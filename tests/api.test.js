// i am using Jest to test the project.
const request = require('supertest');
const { app, db } = require('../server');

beforeAll((done) => {
    db.serialize(() => {
        // Insert test flashcards into the database to ensure they exist
        db.run('INSERT INTO flashcards (question, answer, hidden, created_at) VALUES (?, ?, ?, ?)', 
            ['What is the capital of Italy?', 'Rome', 0, new Date().toISOString()], 
            function(err) {
                if (err) {
                    console.error('Error inserting test flashcard:', err.message);
                    return done(err);
                }
                console.log(`Flashcard with ID ${this.lastID} inserted`);
                done();
            });
    });
});

afterAll((done) => {
    // Clean up test data after tests
    db.serialize(() => {
        db.run('DELETE FROM flashcards', function(err) {
            if (err) {
                console.error('Error deleting test flashcards:', err.message);
                return done(err);
            }
            console.log('Test flashcards deleted');
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed.');
                }
                done();
            });
        });
    });
});

describe('API Tests', () => {
    it('GET /api/flashcards should return flashcards', async () => {
        const response = await request(app).get('/api/flashcards');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /api/flashcards should create a new flashcard', async () => {
        const newCard = { question: 'What is the capital of Italy?', answer: 'Rome', hidden: 0 };
        const response = await request(app).post('/api/flashcards').send(newCard);
        expect(response.status).toBe(201);
        expect(response.body.question).toBe(newCard.question);
    });

    it('POST /api/flashcards/:id/hide should hide a flashcard', async () => {
        const cardId = 1; // Assume this ID exists in your test database
        const response = await request(app).post(`/api/flashcards/${cardId}/hide`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe(`Flashcard with ID ${cardId} hidden successfully.`);
    });

    it('POST /api/flashcards/rate should rate a flashcard set', async () => {
        const ratingData = { set_id: 1, rating: 5 }; // Ensure a valid set_id exists in your database
        const response = await request(app).post('/api/flashcards/rate').send(ratingData);
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Rated flashcard set with ID 1 successfully.');
    });

    it('POST /api/flashcards/rate should return 400 for invalid rating', async () => {
        const invalidRatingData = { set_id: 1, rating: 6 }; // Invalid rating (out of range)
        const response = await request(app).post('/api/flashcards/rate').send(invalidRatingData);
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Rating must be between 1 and 5.');
    });
});
