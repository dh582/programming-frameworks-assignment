const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public')); // Serve static files from public directory

// Serve index.html when accessing the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Set up SQLite database
const db = new sqlite3.Database('./server/database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

// API endpoint to get flashcards
app.get('/api/flashcards', (req, res) => {
    db.all('SELECT * FROM flashcards', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// API endpoint to create a new flashcard
app.post('/api/flashcards', (req, res) => {
    const { question, answer } = req.body;
    db.run(`INSERT INTO flashcards (question, answer) VALUES (?, ?)`, [question, answer], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({ id: this.lastID, question, answer });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
