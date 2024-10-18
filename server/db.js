const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

// Create the flashcards table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
)`);

// Insert sample data if needed
const sampleData = [
    { question: 'What is the capital of France?', answer: 'Paris' },
    { question: 'What is 2 + 2?', answer: '4' },
    { question: 'What is the capital of Germany?', answer: 'Berlin' }
];

sampleData.forEach(({ question, answer }) => {
    db.run(`INSERT INTO flashcards (question, answer) VALUES (?, ?)`, [question, answer]);
});

db.close();
