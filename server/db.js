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
        console.error('Error creating flashcards table:', err.message);
    }
});

// Create the ratings table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    set_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) {
        console.error('Error creating ratings table:', err.message);
    }
});

// Create the telemetry table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    quiz_id INTEGER NOT NULL,
    attempt_time DATETIME NOT NULL,
    completion_time DATETIME NOT NULL
)`, (err) => {
    if (err) {
        console.error('Error creating telemetry table:', err.message);
    }
});

// Sample data to be inserted if it does not already exist
const sampleData = [
    { question: 'What is the capital of France?', answer: 'Paris' },
    { question: 'What is 2 + 2?', answer: '4' },
    { question: 'What is the capital of Germany?', answer: 'Berlin' }
];

// Function to insert sample data into flashcards
function insertSampleData() {
    const promises = sampleData.map(({ question, answer }) => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) AS count FROM flashcards WHERE question = ?`, [question], (err, row) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                    return;
                }

                if (row.count === 0) {
                    db.run(`INSERT INTO flashcards (question, answer) VALUES (?, ?)`, [question, answer], (err) => {
                        if (err) {
                            console.error('Error inserting sample data:', err.message);
                            reject(err);
                        } else {
                            console.log(`Inserted sample flashcard: "${question}"`);
                            resolve();
                        }
                    });
                } else {
                    console.log(`Flashcard with question "${question}" already exists.`);
                    resolve();  // Resolve if it already exists
                }
            });
        });
    });

    // Wait for all promises to complete
    Promise.all(promises)
        .then(() => {
            console.log('All sample data processed.');
            db.close((err) => {
                if (err) {
                    console.error('Error closing the database connection:', err.message);
                } else {
                    console.log('Database connection closed.');
                }
            });
        })
        .catch((error) => {
            console.error('Error processing sample data:', error);
            db.close();
        });
}

// Call the function to insert sample data
insertSampleData();
