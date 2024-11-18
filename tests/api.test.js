// tests/api.test.js
const request = require('supertest');
const app = require('../server'); // Adjust the path to your Express app

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
});
