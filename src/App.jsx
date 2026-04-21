import React, { useState } from 'react';
import axios from 'axios';
import './index.css';

const API_BASE = 'http://localhost:5005/api';

function App() {
  const [view, setView] = useState('home');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [scoreCount, setScoreCount] = useState(0);

  const startQuiz = async (cat, diff) => {
    setCategory(cat);
    setDifficulty(diff);
    try {
      const res = await axios.get(`${API_BASE}/questions/random`, {
        params: { category: cat, difficulty: diff, limit: 20 }
      });
      if (res.data.length === 0) {
        alert("No questions found for this level yet! Try another one.");
        return;
      }
      setQuestions(res.data);
      setCurrentIdx(0);
      setAnswers({});
      setShowFeedback(false);
      setScoreCount(0);
      setView('quiz');
    } catch (err) {
      console.error(err);
      alert("Failed to fetch questions. Is the server running on port 5005?");
    }
  };

  const handleAnswer = (optionIdx) => {
    if (showFeedback) return; // Prevent double clicking

    const isCorrect = optionIdx === questions[currentIdx].correctAnswer;
    setAnswers({ ...answers, [currentIdx]: optionIdx });
    setShowFeedback(true);
    if (isCorrect) setScoreCount(prev => prev + 1);
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setShowFeedback(false);
    } else {
      setView('results');
    }
  };

  const getFeedbackMessage = (pct) => {
    if (pct === 100) return "Master status achieved! You're a Python/AI God!";
    if (pct >= 80) return "Excellent work! You really know your stuff.";
    if (pct >= 50) return "Good job! You have a solid core, but there's room to grow.";
    return "Keep practicing! Every expert was once a beginner.";
  };

  if (view === 'results') {
    const finalPct = Math.round((scoreCount / questions.length) * 100);
    return (
      <div className="glass-card text-center" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <h2>Challenge Complete!</h2>
        <div className="score-circle">{finalPct}%</div>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Score: {scoreCount} / {questions.length}
          </p>
          <p style={{ color: 'var(--text-muted)' }}>{getFeedbackMessage(finalPct)}</p>
        </div>
        <button className="btn-primary" onClick={() => setView('home')}>Back to Home</button>
      </div>
    );
  }

  if (view === 'quiz') {
    const q = questions[currentIdx];
    const isAnswered = answers[currentIdx] !== undefined;

    return (
      <div className="question-container glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Question {currentIdx + 1} / {questions.length}</span>
          <span>{category} - {difficulty}</span>
        </div>

        <h3 style={{ marginBottom: '2rem' }}>{q.text}</h3>

        <div className="options">
          {q.options.map((opt, i) => {
            let statusClass = "";
            if (showFeedback) {
              if (i === q.correctAnswer) statusClass = "correct-pulse";
              else if (i === answers[currentIdx]) statusClass = "wrong-shake";
            }
            return (
              <button
                key={i}
                className={`option-btn ${answers[currentIdx] === i ? 'selected' : ''} ${statusClass}`}
                onClick={() => handleAnswer(i)}
                disabled={showFeedback}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div style={{ marginTop: '2rem', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
            <p style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: answers[currentIdx] === q.correctAnswer ? '#10b981' : '#f43f5e'
            }}>
              {answers[currentIdx] === q.correctAnswer ? "✓ Correct!" : "✗ Wrong!"}
            </p>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{q.explanation}</p>
            <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={nextQuestion}>
              {currentIdx === questions.length - 1 ? "View Results" : "Next Question"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="home-container">
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Quiz<span style={{ color: 'var(--primary)' }}>20</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Master Python & AI with 20-question intense challenges</p>
      </header>

      <main className="grid-cols">
        <div className="glass-card category-section">
          <div style={{ fontSize: '4rem' }}>🐍</div>
          <h2>Python Challenge</h2>
          <p className="text-center" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Master everything from basic syntax to advanced decorators.</p>
          <div className="level-buttons">
            <button className="btn-secondary" onClick={() => startQuiz('Python', 'Beginner')}>Beginner</button>
            <button className="btn-secondary" onClick={() => startQuiz('Python', 'Intermediate')}>Intermediate</button>
            <button className="btn-secondary" onClick={() => startQuiz('Python', 'Advanced')}>Advanced</button>
          </div>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => startQuiz('Python', 'Beginner')}>
            Generate Random Python Quiz
          </button>
        </div>

        <div className="glass-card category-section">
          <div style={{ fontSize: '4rem' }}>🤖</div>
          <h2>AI Challenge</h2>
          <p className="text-center" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Deep dive into ML, Transformers, and Generative AI.</p>
          <div className="level-buttons">
            <button className="btn-secondary" onClick={() => startQuiz('AI', 'Beginner')}>Beginner</button>
            <button className="btn-secondary" onClick={() => startQuiz('AI', 'Intermediate')}>Intermediate</button>
            <button className="btn-secondary" onClick={() => startQuiz('AI', 'Advanced')}>Advanced</button>
          </div>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => startQuiz('AI', 'Beginner')}>
            Generate AI Quiz
          </button>
        </div>
      </main>

      <footer style={{ textAlign: 'center', marginTop: '6rem', color: 'var(--text-muted)' }}>
        Interactive Learning Platform &bull; Built with React & Node.js
      </footer>
    </div>
  );
}

export default App;
