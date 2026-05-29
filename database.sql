/* Drop tables if they exist to allow clean reinstallations during testing */
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS users CASCADE;

/* User Table - Fixed for PostgreSQL */
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY, -- Changed INT AUTO_INCREMENT to SERIAL
    username VARCHAR(100),       -- Changed 'name' to 'username' to match your JavaScript/HTML API routes
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    bio TEXT,                   -- Added bio field since your profile.html saves to /api/update-bio
    pfp_icon VARCHAR(10)        -- Added pfp_icon field since your profile.html saves to /api/update-pfp
);

/* Skill Table - Fixed for PostgreSQL with Cascading Deletes */
CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY, -- Changed INT AUTO_INCREMENT to SERIAL
    user_id INT,
    skill_name VARCHAR(100),
    description TEXT,
    type VARCHAR(20),            -- 'Offer' or 'Request'
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE -- Added CASCADE to prevent constraint errors
);