const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();

// 1. Database Connection (With explicit fallback for localhost)
const databaseConnectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_YIqB0m5yivWp@ep-plain-glade-a1sc7j3z-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: databaseConnectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// 2. Middleware Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// FIXED FOR VERCEL: Explicitly resolve the static files directory path
app.use(express.static(path.join(__dirname)));

// 3. Root Route (Serves Homepage automatically)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 4. Authentication Routes
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT user_id, username FROM users WHERE email = $1 AND password = $2', 
      [email, password]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.send(`
        <script>
          localStorage.setItem('userId', '${user.user_id}');
          localStorage.setItem('username', '${user.username}');
          window.location.href = '/dashboard.html';
        </script>
      `);
    } else {
      res.send('Invalid email or password.');
    }
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
      [username, email, password]
    );
    res.send('<h1>Registration Successful!</h1><a href="/index.html">Click here to Login</a>');
  } catch (err) {
    res.status(500).send('Error creating account.');
  }
});

app.get('/api/user-data', async (req, res) => {
    const userId = req.query.userId; // Matches the ?userId= sent by frontend
    try {
        const result = await pool.query(
            'SELECT user_id, username, email, bio, pfp_icon FROM users WHERE user_id = $1', 
            [userId]
        );
        if (result.rows.length === 0) return res.status(404).send("User not found");
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching data");
    }
});

app.post('/api/update-bio', async (req, res) => {
    const { bio, userId } = req.body; // You will need to send userId from the frontend now!
    try {
        await pool.query('UPDATE users SET bio = $1 WHERE user_id = $2', [bio, userId]);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/update-pfp', async (req, res) => {
  const { pfp_icon } = req.body;
  try {
    await pool.query(
      'UPDATE users SET pfp_icon = $1 WHERE user_id = (SELECT user_id FROM users ORDER BY user_id DESC LIMIT 1)',
      [pfp_icon]
    );
    res.status(200).json({ success: true, message: "PFP updated!" });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 6. Add Post (With Empty Table Protection & Error Logging)
app.post('/add-post', async (req, res) => {
    const { post_type, skill_name, description } = req.body;
    try {
        const userRes = await pool.query('SELECT user_id FROM users ORDER BY user_id DESC LIMIT 1');
        
        // Safety Check: If no user exists in the database yet, handle it gracefully
        if (userRes.rows.length === 0) {
            console.error("DATABASE WARNING: No users exist in the database yet.");
            return res.status(400).send("<h1>Error: You must create an account and log in first before posting!</h1><a href='/index.html'>Go to Registration/Login</a>");
        }

        const userId = userRes.rows[0].user_id;
        
        await pool.query(
            'INSERT INTO posts (user_id, post_type, skill_name, description) VALUES ($1, $2, $3, $4)',
            [userId, post_type, skill_name, description]
        );
        res.redirect('/dashboard.html'); 
    } catch (err) {
        // Crucial: Print the exact error message to your VS Code terminal console
        console.error("CRITICAL POSTING DATABASE ERROR:", err.message);
        res.status(500).send(`Error saving post: ${err.message}`);
    }
});

app.get('/api/search-skills', async (req, res) => {
  const { query } = req.query;
  try {
    const searchQuery = `%${query || ''}%`;
    // Ensure this returns user_id
const result = await pool.query(
    'SELECT post_id, user_id, skill_name, description, post_type FROM posts ORDER BY post_id DESC'
);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

app.delete('/api/delete-post/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const result = await pool.query('DELETE FROM posts WHERE post_id = $1', [postId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error deleting post" });
  }
});

// 7. Messaging & Contacts API Endpoints
app.get('/api/my-contacts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, username, pfp_icon FROM users ORDER BY username ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// New API route for public profile viewing
app.get('/api/public-profile/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            'SELECT username, bio, pfp_icon FROM users WHERE user_id = $1', 
            [userId]
        );
        if (result.rows.length === 0) return res.status(404).send("User not found");
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send("Server error");
    }
});

app.post('/api/reply-message', async (req, res) => {
  const { message_text, receiverId, senderId } = req.body;
  try {
    const queryText = 'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES ($1, $2, $3)';
    const values = [senderId, receiverId, message_text];
    await pool.query(queryText, values);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("DATABASE ERROR:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/get-messages', async (req, res) => {
  const { sender, receiver } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
       OR (sender_id = $2 AND receiver_id = $1) 
       ORDER BY message_id ASC`, 
      [sender, receiver]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ error: "Could not load messages" });
  }
});

// 8. Runtime Initialization Lifecycle Listener
if (process.env.NODE_ENV !== 'production') {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Skill Match Server Live: http://localhost:${PORT}`);
  });
}

module.exports = app;