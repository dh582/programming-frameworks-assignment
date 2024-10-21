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
    answer TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    hidden BOOLEAN DEFAULT 0
)`, (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    }
});

// Sample data to be inserted if it does not already exist
const sampleData = [
    { question: 'What is the capital of France?', answer: 'Paris' },
    { question: 'What is 2 + 2?', answer: '4' },
    { question: 'What is the capital of Germany?', answer: 'Berlin' }
];

// Function to insert sample data
function insertSampleData() {
    sampleData.forEach(({ question, answer }) => {
        db.get(`SELECT COUNT(*) AS count FROM flashcards WHERE question = ?`, [question], (err, row) => {
            if (err) {
                console.error(err.message);
                return;
            }

            if (row.count === 0) {
                db.run(`INSERT INTO flashcards (question, answer) VALUES (?, ?)`, [question, answer], (err) => {
                    if (err) {
                        console.error('Error inserting sample data:', err.message);
                    } else {
                        console.log(`Inserted sample flashcard: "${question}"`);
                    }
                });
            } else {
                console.log(`Flashcard with question "${question}" already exists.`);
            }
        });
    });
}

// Call the function to insert sample data
insertSampleData();

// Close the database connection gracefully
db.close((err) => {
    if (err) {
        console.error('Error closing the database connection:', err.message);
    } else {
        console.log('Database connection closed.');
    }
});
