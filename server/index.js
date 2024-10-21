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

// API endpoint to get all flashcards, filtering out hidden cards for the user
app.get('/api/flashcards', (req, res) => {
    db.all('SELECT * FROM flashcards WHERE hidden = 0', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// API endpoint to create a new flashcard
app.post('/api/flashcards', (req, res) => {
    const { question, answer, hidden } = req.body; // Extract 'hidden' status from request

    // Check today's flashcard creation count
    const today = new Date().toISOString().slice(0, 10);
    db.all('SELECT COUNT(*) as count FROM flashcards WHERE DATE(created_at) = ?', [today], (err, rows) => {
        if (err) {
            console.error('Error counting flashcards:', err.message); // Log error
            return res.status(500).json({ error: err.message });
        }

        const count = rows[0].count;
        if (count >= 20) {
            console.warn('Daily limit of 20 flashcards reached.'); // Log warning
            return res.status(403).json({ error: 'Daily limit of 20 flashcards reached.' });
        }

        // Insert the flashcard with the 'hidden' status
        db.run(`INSERT INTO flashcards (question, answer, hidden) VALUES (?, ?, ?)`, [question, answer, hidden], function(err) {
            if (err) {
                console.error('Error inserting flashcard:', err.message); // Log error
                return res.status(500).json({ error: err.message });
            }
            console.log('Flashcard added with ID:', this.lastID); // Log the added ID
            res.status(201).json({ id: this.lastID, question, answer, hidden });
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
