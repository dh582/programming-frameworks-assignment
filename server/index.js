//I am using Express for this assignment as i have done some projects with express before
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

// Middleware to handle flashcard daily creation limit
let dailyLimit = 20; // Default daily limit

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
    const { question, answer, hidden } = req.body;

    // Check today's flashcard creation count
    const today = new Date().toISOString().slice(0, 10);
    db.all('SELECT COUNT(*) as count FROM flashcards WHERE DATE(created_at) = ?', [today], (err, rows) => {
        if (err) {
            console.error('Error counting flashcards:', err.message);
            return res.status(500).json({ error: err.message });
        }

        const count = rows[0].count;
        if (count >= dailyLimit) {  // Use dynamic daily limit
            console.warn(`Daily limit of ${dailyLimit} flashcards reached.`);
            return res.status(403).json({ error: `Daily limit of ${dailyLimit} flashcards reached.` });
        }

        // Insert the flashcard with the 'hidden' status
        db.run(`INSERT INTO flashcards (question, answer, hidden, created_at) VALUES (?, ?, ?, ?)`, 
               [question, answer, hidden, today], function(err) {
            if (err) {
                console.error('Error inserting flashcard:', err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log('Flashcard added with ID:', this.lastID);
            res.status(201).json({ id: this.lastID, question, answer, hidden });
        });
    });
});

// API endpoint to hide a flashcard
app.post('/api/flashcards/:id/hide', (req, res) => {
    const id = req.params.id;

    db.run('UPDATE flashcards SET hidden = 1 WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error hiding flashcard:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: `Flashcard with ID ${id} hidden successfully.` });
    });
});

// API endpoint to rate a flashcard set
app.post('/api/flashcards/rate', (req, res) => {
    const { set_id, rating } = req.body;

    // Validate rating input and set_id presence
    if (!set_id || typeof set_id !== 'number') {
        return res.status(400).json({ error: 'Invalid set ID.' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    db.run(`INSERT INTO ratings (set_id, rating) VALUES (?, ?)`, [set_id, rating], function(err) {
        if (err) {
            console.error('Error rating flashcard set:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: `Rated flashcard set with ID ${set_id} successfully.` });
    });
});

// API endpoint to get highly rated flashcard sets
app.get('/api/flashcards/top-rated', (req, res) => {
    db.all('SELECT set_id, AVG(rating) as avg_rating FROM ratings GROUP BY set_id ORDER BY avg_rating DESC LIMIT 5', [], (err, rows) => {
        if (err) {
            console.error('Error fetching top-rated flashcards:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// API endpoint to log telemetry data
app.post('/api/telemetry', (req, res) => {
    const { userId, quizId, attemptTime, completionTime } = req.body;

    // Validate input
    if (!userId || !quizId || !attemptTime || !completionTime) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Insert telemetry data into the database
    db.run(`INSERT INTO telemetry (user_id, quiz_id, attempt_time, completion_time) VALUES (?, ?, ?, ?)`, 
           [userId, quizId, attemptTime, completionTime], 
           function(err) {
        if (err) {
            console.error('Error logging telemetry:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Telemetry data logged successfully.' });
    });
});

// API endpoint to get current daily limit
app.get('/api/admin/daily-limit', (req, res) => {
    res.json({ dailyLimit });
});

// API endpoint to update daily limit
app.patch('/api/admin/daily-limit', (req, res) => {
    const { newLimit } = req.body;

    // Validate newLimit input
    if (typeof newLimit !== 'number' || newLimit < 1) {
        return res.status(400).json({ error: 'Daily limit must be a positive integer.' });
    }

    dailyLimit = newLimit; // Update the daily limit
    res.json({ message: `Daily limit updated to ${newLimit}.` });
});

// Start the server only if this file is being run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export app and db for testing
module.exports = { app, db };
