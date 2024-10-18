document.addEventListener('DOMContentLoaded', () => {
    const flashcardContainer = document.getElementById('flashcard-container');
    const flashcardForm = document.getElementById('flashcard-form');
    const questionInput = document.getElementById('question');
    const answerInput = document.getElementById('answer');

    // Fetch flashcards from the API
    const fetchFlashcards = async () => {
        const response = await fetch('http://localhost:3000/api/flashcards');
        const flashcards = await response.json();
        flashcardContainer.innerHTML = '';
        flashcards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('flashcard');
            cardElement.innerHTML = `
                <p>${card.question}</p>
                <button onclick="revealAnswer(${card.id})">Show Answer</button>
                <p id="answer-${card.id}" style="display: none;">${card.answer}</p>
            `;
            flashcardContainer.appendChild(cardElement);
        });
    };

    // Reveal answer on button click
    window.revealAnswer = (id) => {
        document.getElementById(`answer-${id}`).style.display = 'block';
    };

    // Add a new flashcard
    flashcardForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newFlashcard = {
            question: questionInput.value,
            answer: answerInput.value
        };
        await fetch('http://localhost:3000/api/flashcards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newFlashcard)
        });
        questionInput.value = '';
        answerInput.value = '';
        fetchFlashcards(); // Refresh flashcards
    });

    fetchFlashcards(); // Initial fetch
});
