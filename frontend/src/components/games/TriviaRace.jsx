// frontend/src/components/games/TriviaRace.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Award, ChevronRight, Home } from 'lucide-react';


const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

const TriviaRace = ({ subject, difficulty, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStartTime] = useState(Date.now());
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loadError, setLoadError] = useState(null); 

   const hasLoaded = React.useRef(false);
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadQuestions();
    }
  }, []);

  useEffect(() => {
    if (loading || gameOver || isAnswered) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, gameOver, isAnswered, currentQuestion]);

  const loadQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE}/api/educational-games/trivia?subject=${subject}&difficulty=${difficulty}&count=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.questions && response.data.questions.length > 0) {
        setQuestions(response.data.questions);
      } else {
        setLoadError('No questions returned. Please try again.');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      setLoadError('Failed to load questions. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const handleAnswer = (answerIndex) => {
    if (isAnswered) return;

    setSelectedAnswer(answerIndex);
    setIsAnswered(true);

    const correct = answerIndex === questions[currentQuestion].correctIndex;
    if (correct) {
      const timeBonus = timeLeft > 20 ? 2 : timeLeft > 10 ? 1 : 0;
      setScore(score + 1 + timeBonus);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setTimeLeft(30);
      } else {
        endGame();
      }
    }, 2000);
  };

  const handleTimeout = () => {
    setIsAnswered(true);
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setTimeLeft(30);
      } else {
        endGame();
      }
    }, 1500);
  };

  const endGame = async () => {
    setGameOver(true);
    const timeSpent = Math.floor((Date.now() - gameStartTime) / 1000);

    try {
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API_BASE}/api/educational-games/submit-score`,
        {
          studentId: user._id || user.id,
          gameType: 'trivia',
          score: score,
          totalQuestions: questions.length,
          timeSpent,
          subject,
          difficulty
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFeedback(response.data);
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (loadError || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Could Not Load Questions</h3>
          <p className="text-gray-600 mb-6">{loadError || 'The AI service is currently unavailable. Please check your API key and try again.'}</p>
          <div className="flex gap-4">
            <button
              onClick={loadQuestions}
              className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => onComplete && onComplete()}
              className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
            >
              Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (gameOver) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-6 bg-purple-100 rounded-full mb-4">
              <Award className="w-16 h-16 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Complete!</h2>
            <p className="text-gray-600">Great job on the Trivia Race</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 text-center">
              <p className="text-gray-600 text-sm mb-1">Score</p>
              <p className="text-4xl font-black text-green-600">{score}/{questions.length}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 text-center">
              <p className="text-gray-600 text-sm mb-1">Points Earned</p>
              <p className="text-4xl font-black text-orange-600">+{feedback?.pointsEarned || 0}</p>
            </div>
          </div>

          {feedback?.feedback && (
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-2 text-blue-900">📝 Feedback</h3>
              <p className="text-blue-800 mb-4">{feedback.feedback.message}</p>
              {feedback.feedback.tips && (
                <div>
                  <p className="font-semibold text-blue-900 mb-2">💡 Tips:</p>
                  <ul className="space-y-1">
                    {feedback.feedback.tips.map((tip, idx) => (
                      <li key={idx} className="text-blue-700 text-sm">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
            >
              Play Again
            </button>
            <button
              onClick={() => onComplete && onComplete()}
              className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
            >
              Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">⚡ Trivia Race</h2>
              <p className="text-gray-600">{subject} - {difficulty}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Score</p>
                <p className="text-2xl font-bold text-purple-600">{score}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Time</p>
                <div className={`text-2xl font-bold ${timeLeft < 10 ? 'text-red-500' : 'text-gray-800'}`}>
                  <Clock className="inline w-6 h-6 mr-1" />
                  {timeLeft}s
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full ${
                  idx < currentQuestion
                    ? 'bg-purple-600'
                    : idx === currentQuestion
                    ? 'bg-purple-400'
                    : 'bg-gray-200'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <span className="text-purple-600 font-semibold">Question {currentQuestion + 1}/{questions.length}</span>
            <h3 className="text-2xl font-bold text-gray-800 mt-2">{question.question}</h3>
          </div>

          <div className="space-y-3">
            {question.options.map((option, idx) => {
              const isCorrect = idx === question.correctIndex;
              const isSelected = idx === selectedAnswer;
              
              let buttonClass = 'w-full p-4 rounded-xl text-left border-2 transition-all ';
              
              if (isAnswered) {
                if (isCorrect) {
                  buttonClass += 'bg-green-100 border-green-500 text-green-800';
                } else if (isSelected) {
                  buttonClass += 'bg-red-100 border-red-500 text-red-800';
                } else {
                  buttonClass += 'bg-gray-100 border-gray-300 text-gray-600';
                }
              } else {
                buttonClass += 'border-gray-300 hover:border-purple-400 hover:bg-purple-50 cursor-pointer';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={isAnswered}
                  className={buttonClass}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      isAnswered && isCorrect
                        ? 'bg-green-500 text-white'
                        : isAnswered && isSelected
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-semibold text-blue-900 mb-1">Explanation:</p>
              <p className="text-blue-800">{question.explanation}</p>
              {question.funFact && (
                <p className="text-blue-700 text-sm mt-2">💡 {question.funFact}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TriviaRace;