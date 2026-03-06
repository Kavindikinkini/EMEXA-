import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/headerorigin';
import Sidebar from '../components/sidebarorigin';
import TriviaRace from '../components/games/TriviaRace';


const EducationalGames = () => {
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('games');
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameConfig, setGameConfig] = useState({
    subject: 'Biology',
    difficulty: 'medium'
  });

  const subjects = ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'Computer Science'];
  const difficulties = ['easy', 'medium', 'hard'];

  const games = [
    {
      id: 'trivia',
      name: 'Trivia Race',
      icon: '⚡',
      description: 'Fast-paced multiple choice questions',
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: 'memory',
      name: 'Memory Match',
      icon: '🧠',
      description: 'Match terms with definitions',
      color: 'from-blue-400 to-cyan-500',
      comingSoon: true
    },
    {
      id: 'scramble',
      name: 'Word Scramble',
      icon: '🔤',
      description: 'Unscramble scientific terms',
      color: 'from-green-400 to-teal-500',
      comingSoon: true
    }
  ];

  if (selectedGame === 'trivia') {
    return (
      <TriviaRace
        subject={gameConfig.subject}
        difficulty={gameConfig.difficulty}
        onComplete={() => setSelectedGame(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={(() => {
        try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.name || u.userName || ''; } catch { return ''; }
      })()} userRole="student" />
      <Sidebar 
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={setActiveMenuItem}
      />
      
      <div className="ml-52 pt-14 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🎮 Educational Games</h1>
              <p className="text-gray-600 mt-2">Learn while having fun! Earn points and achievements.</p>
            </div>
            <button
              onClick={() => navigate('/gamification')}
              className="bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition"
            >
              View My Progress
            </button>
          </div>

          {/* Game Configuration */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Configure Your Game</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <select
                  value={gameConfig.subject}
                  onChange={(e) => setGameConfig({...gameConfig, subject: e.target.value})}
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-teal-500 focus:outline-none"
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                <select
                  value={gameConfig.difficulty}
                  onChange={(e) => setGameConfig({...gameConfig, difficulty: e.target.value})}
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-teal-500 focus:outline-none"
                >
                  {difficulties.map(diff => (
                    <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Game Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {games.map(game => (
              <div
                key={game.id}
                className={`bg-gradient-to-br ${game.color} rounded-2xl p-6 text-white shadow-xl relative overflow-hidden ${
                  game.comingSoon ? 'opacity-60' : 'cursor-pointer hover:scale-105'
                } transition-transform`}
                onClick={() => !game.comingSoon && setSelectedGame(game.id)}
              >
                {game.comingSoon && (
                  <div className="absolute top-4 right-4 bg-white text-gray-800 px-3 py-1 rounded-full text-xs font-bold">
                    Coming Soon
                  </div>
                )}
                <div className="text-6xl mb-4">{game.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{game.name}</h3>
                <p className="text-white/90 mb-4">{game.description}</p>
                {!game.comingSoon && (
                  <button className="bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
                    Play Now →
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="mt-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
            <h3 className="text-xl font-bold mb-4 text-gray-800">🌟 Why Play Educational Games?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="text-3xl">📚</div>
                <div>
                  <h4 className="font-bold text-gray-800">Learn Faster</h4>
                  <p className="text-gray-600 text-sm">Reinforce your knowledge through interactive play</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-3xl">😌</div>
                <div>
                  <h4 className="font-bold text-gray-800">Reduce Stress</h4>
                  <p className="text-gray-600 text-sm">Take a fun break while still being productive</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-3xl">🏆</div>
                <div>
                  <h4 className="font-bold text-gray-800">Earn Rewards</h4>
                  <p className="text-gray-600 text-sm">Get points, achievements, and climb the leaderboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationalGames;