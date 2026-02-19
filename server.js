require('dotenv').config(); // Loads your secrets from .env
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Files (CSS, Images)
// This tells Express: "If someone asks for a file, look in the 'public' folder"
app.use(express.static(path.join(__dirname, 'public')));

// Basic Route (The Homepage)
app.get('/', (req, res) => {
    // For now, just send a message. Later, we will send an HTML file.
    res.send('<h1>Midland Oil Group - Server is Running!</h1>');
});

// Start the Server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});