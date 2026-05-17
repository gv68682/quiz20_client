import React, { useState } from 'react';
import axios from 'axios';
import './index.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const SERVER_PORT = import.meta.env.VITE_SERVER_PORT;

function App() {
  const [view, setView] = useState('home');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [scoreCount, setScoreCount] = useState(0);

  // New states for More AI
  const [moreAiTopic, setMoreAiTopic] = useState('All');
  const [shortAnswerInput, setShortAnswerInput] = useState('');

  const moreAiTopics = ['All', 'ML', 'Deep Learning', 'NLP', 'LangChain', 'RAG', 'Agents', 'MCP'];

  // Fisher-Yates shuffle
  const shuffleArray = (array) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };


  const goHome = () => {
    setView('home');
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers({});
    setShowFeedback(false);
    setScoreCount(0);
    setShortAnswerInput('');
  };

  const startQuiz = async (cat, diff) => {
    setCategory(cat);
    setDifficulty(diff);

    try {
      let res;
      if (cat === 'More AI') {
        console.log("Starting More AI Quiz");
        console.log("Topic:", moreAiTopic);
        console.log("Difficulty:", diff);
        res = await axios.get(`${SERVER_URL}/api/questions/more-ai`, {
          params: { topic: moreAiTopic, level: diff, limit: 20 }
        });
        // console.log("Fetched More AI:");
        // console.log("Response:", res);
        // console.log("Data:", res.data);
      } else {
        res = await axios.get(`${SERVER_URL}/api/questions/random`, {
          params: { category: cat, difficulty: diff, limit: 20 }
        });
      }

      if (res.data.length === 0) {
        alert("No questions found for this level yet! Try another one.");
        return;
      }

      // Pre-process questions to shuffle options and identify correct answer
      let processedQuestions = res.data.map(q => {
        if (cat === 'More AI') {
          let options = q.options || [];
          let correctAnswerStr = q.answer;

          if (q.type === 'MCQ') {
            options = shuffleArray(options);
          } else if (q.type === 'True/False') {
            options = ['True', 'False'];
          }

          let correctAnswerIdx = options.findIndex(
            opt => opt?.trim().toLowerCase() === correctAnswerStr?.trim().toLowerCase()
          );

          if (correctAnswerIdx === -1) {
            console.warn("Correct answer not found in options:", q);
            correctAnswerIdx = 0;
          }

          return {
            ...q,
            text: q.question, // unify property names
            options: options,
            correctAnswer: correctAnswerIdx, // will be -1 for short answer
            correctAnswerStr: correctAnswerStr,
            explanation: q.explanation || `The correct answer is: ${correctAnswerStr}`
          };
        }
        return q; // Standard python/ai questions
      });

      setQuestions(processedQuestions);
      // console.log("Processed:", processedQuestions);
      setCurrentIdx(0);
      setAnswers({});
      setShowFeedback(false);
      setScoreCount(0);
      setShortAnswerInput('');
      setView('quiz');
    } catch (err) {
      console.error(err);
      alert(`Failed to fetch questions. Is the server running on port ${SERVER_PORT}?`);
      alert(err.message);
    }
  };

  const handleAnswer = (val) => {
    if (showFeedback) return;

    const q = questions[currentIdx];
    let isCorrect = false;

    if (q.type === 'Short Answer') {
      const userAns = val.trim().toLowerCase();
      const actualAns = q.correctAnswerStr.trim().toLowerCase();
      isCorrect = userAns === actualAns;
      setAnswers({ ...answers, [currentIdx]: val });
    } else {
      isCorrect = val === q.correctAnswer;
      setAnswers({ ...answers, [currentIdx]: val });
    }

    setShowFeedback(true);
    if (isCorrect) setScoreCount(prev => prev + 1);
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setShowFeedback(false);
      setShortAnswerInput('');
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
    let isCorrectAnswered = false;

    if (showFeedback) {
      if (q.type === 'Short Answer') {
        const userAns = (answers[currentIdx] || '').trim().toLowerCase();
        const actualAns = q.correctAnswerStr.trim().toLowerCase();
        isCorrectAnswered = userAns === actualAns;
      } else {
        isCorrectAnswered = answers[currentIdx] === q.correctAnswer;
      }
    }

    return (
      <div className="question-container glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button
            onClick={goHome}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
          <span style={{ color: 'var(--text-muted)' }}>
            Question {currentIdx + 1} / {questions.length}
          </span>
          <button onClick={goHome}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >X</button>
        </div>
        <span style={{ color: 'var(--text-muted)' }}>Question {currentIdx + 1} / {questions.length}</span>
        <span>{category} - {difficulty} {category === 'More AI' ? `(${q.section || moreAiTopic})` : ''}</span>

        <h3 style={{ marginBottom: '2rem' }}>{q.text}</h3>

        <div className="options" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {q.type === 'Short Answer' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                value={shortAnswerInput}
                onChange={(e) => setShortAnswerInput(e.target.value)}
                disabled={showFeedback}
                className="input-field"
                placeholder="Type your answer here..."
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #3776AB', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem' }}
              />
              {!showFeedback && (
                <button className="btn-primary" onClick={() => handleAnswer(shortAnswerInput)}>Submit Answer</button>
              )}
            </div>
          ) : (
            q.options.map((opt, i) => {
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
            })
          )}
        </div>

        {showFeedback && (
          <div style={{ marginTop: '2rem', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
            <p style={{
              fontSize: '1.2rem',
              fontWeight: 'normal',
              color: isCorrectAnswered ? '#d1fae5' : '#f97488'
            }}>
              {isCorrectAnswered ? "✓ Correct!" : "✗ Wrong!"}
            </p>

            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {q.explanation}
            </p>
            <button
              className="btn-primary"
              style={{
                marginTop: '1.5rem',
                width: '30%',
                background: '#3776AB',
                padding: '10px 6px',
                fontWeight: 'normal'
              }}
              onClick={nextQuestion}
            >
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
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Quiz<span style={{ color: '#3776AB' }}>20</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Master Python & AI with intense challenges</p>
      </header>

      <main className="grid-cols">
        <div className="glass-card category-section">
          <div style={{ display: 'flex', width: '56px', height: '28px' }}>
            <div style={{ flex: 1, background: '#3776AB' }} />
            <div style={{ flex: 1, background: '#FFD43B' }} />
          </div>
          <h2>Python Challenge</h2>
          <p className="text-center" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Master everything from basic syntax to advanced decorators.</p>
          <div className="level-buttons">
            <button className="btn-secondary" onClick={() => startQuiz('Python', 'Beginner')}>Beginner</button>
            <button className="btn-secondary" onClick={() => startQuiz('Python', 'Intermediate')}>Intermediate</button>
            <button className="btn-secondary" onClick={() => startQuiz('Python', 'Advanced')}>Advanced</button>
          </div>
          <button className="btn-primary" style={{ width: '100%', background: '#3776AB', padding: '6px 12px', fontWeight: 'normal', marginTop: '1rem' }} onClick={() => startQuiz('Python', 'Beginner')}>
            Generate Python Quiz
          </button>
        </div>

        <div className="glass-card category-section">
          <div style={{ fontSize: '40px', width: '56px', height: '28px', color: '#FFD43B' }}>⚡</div>
          <h2>AI Challenge</h2>
          <p className="text-center" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Deep dive into ML, Transformers, and Generative AI.</p>
          <div className="level-buttons">
            <button className="btn-secondary" onClick={() => startQuiz('AI', 'Beginner')}>Beginner</button>
            <button className="btn-secondary" onClick={() => startQuiz('AI', 'Intermediate')}>Intermediate</button>
            <button className="btn-secondary" onClick={() => startQuiz('AI', 'Advanced')}>Advanced</button>
          </div>
          <button className="btn-primary" style={{ width: '100%', background: '#3776AB', padding: '6px 12px', fontWeight: 'normal', marginTop: '1rem' }} onClick={() => startQuiz('AI', 'Beginner')}>
            Generate AI Quiz
          </button>
        </div>

        <div className="glass-card category-section">
          <div style={{ fontSize: '40px', width: '56px', height: '28px', color: '#FFD43B' }}>⚡</div>
          <h2>More AI Quiz</h2>
          <p className="text-center" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Extensive topic-wise quizzes covering all major AI domains.</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
            {moreAiTopics.map(topic => (
              <button
                key={topic}
                className={`btn-secondary ${moreAiTopic === topic ? 'selected-topic' : ''}`}
                style={{
                  background: moreAiTopic === topic ? '#3776AB' : 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
                onClick={() => setMoreAiTopic(topic)}
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="level-buttons">
            <button className="btn-secondary" onClick={() => startQuiz('More AI', 'Beginner')}>Beginner</button>
            <button className="btn-secondary" onClick={() => startQuiz('More AI', 'Intermediate')}>Intermediate</button>
            <button className="btn-secondary" onClick={() => startQuiz('More AI', 'Advanced')}>Advanced</button>
          </div>
          <button className="btn-primary" style={{ width: '100%', background: '#3776AB', padding: '6px 12px', fontWeight: 'normal', marginTop: '1rem' }} onClick={() => startQuiz('More AI', 'Beginner')}>
            Generate More AI Quiz
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
