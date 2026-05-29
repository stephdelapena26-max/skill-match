const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config(); // Allows your app to read environment variables

const app = express();

// This setup works perfectly for both local development and Vercel hosting!
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Neon requires SSL encryption for live cloud connections
  }
});

// 2. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Explicit route root rule to serve index.html automatically when opening the domain link!
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. The Login Route
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

// 4. The Registration Route
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

// 5. Get profile data
app.get('/api/user-data', async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, username, email, bio, pfp_icon FROM users ORDER BY user_id DESC LIMIT 1');
        if (result.rows.length === 0) return res.status(404).send("User not found");
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching data");
    }
});

// 6. Add Post
app.post('/add-post', async (req, res) => {
    const { post_type, skill_name, description } = req.body;
    try {
        const userRes = await pool.query('SELECT user_id FROM users ORDER BY user_id DESC LIMIT 1');
        const userId = userRes.rows[0].user_id;
        
        await pool.query(
            'INSERT INTO posts (user_id, post_type, skill_name, description) VALUES ($1, $2, $3, $4)',
            [userId, post_type, skill_name, description]
        );
        res.redirect('/dashboard.html'); 
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving post.");
    }
});

// 7. Search Skills & Feed
app.get('/api/search-skills', async (req, res) => {
    const { query } = req.query;
    try {
        const searchQuery = `%${query || ''}%`;
        const result = await pool.query(
            'SELECT * FROM posts WHERE skill_name ILIKE $1 OR description ILIKE $1 ORDER BY post_id DESC',
            [searchQuery]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Search failed" });
    }
});

// 8. Delete Post (CRUD: Delete)
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

// 9. Load Dynamic Contacts
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

// 10. Update Bio
app.post('/api/update-bio', async (req, res) => {
    const { bio } = req.body;
    try {
        await pool.query(
            'UPDATE users SET bio = $1 WHERE user_id = (SELECT user_id FROM users ORDER BY user_id DESC LIMIT 1)',
            [bio]
        );
        res.status(200).json({ success: true, message: "Bio updated!" });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// 11. Update PFP
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

// 12. Reply Message
app.post('/api/reply-message', async (req, res) => {
    console.log("Data received from frontend:", req.body);
    const { message_text, receiverId, senderId } = req.body;
    try {
        const queryText = 'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES ($1, $2, $3)';
        const values = [senderId, receiverId, message_text];
        await pool.query(queryText, values);
        console.log("Message saved successfully!");
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("CRITICAL DATABASE ERROR:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 13. Get Message History
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

// 14. Start Server: ONLY runs if we are testing locally on your computer
if (process.env.NODE_ENV !== 'production') {
  const PORT = 3000;
  app.listen(PORT, () => {
      console.log(`Skill Match Server Live: http://localhost:${PORT}`);
  });
}

// Crucial for Vercel: Export the application handler module
module.exports = app;