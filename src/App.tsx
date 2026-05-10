import { useState, useEffect } from 'react';
import { Moon, Sun, MonitorPlay, Users } from 'lucide-react';
import { ChessBoard } from './ChessBoard';
import { CheckersBoard } from './CheckersBoard';

export type GameMode = 'chess' | 'checkers' | null;
export type Difficulty = 'pvp' | 'easy' | 'medium' | 'hard';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [selectedGame, setSelectedGame] = useState<GameMode>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('pvp');

  // Load theme from system or local storage later, default to dark for better premium feel
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleStart = (game: 'chess' | 'checkers') => {
    setSelectedGame(game);
  };

  return (
    <div className="app-container">
      <header className="glass-panel app-header">
        <h1>VibeBoard</h1>
        <button className="btn btn-icon-only" onClick={toggleTheme} aria-label="Toggle Dark Mode">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>

      <main className="main-content">
        {!selectedGame ? (
          <section className="hero-section glass-panel">
            <h2>Wähle dein Spiel</h2>
            
            <div className="game-modes">
              <button className="btn game-btn" onClick={() => handleStart('chess')}>
                <span className="btn-icon">♟️</span>
                Schach
              </button>
              <button className="btn game-btn" onClick={() => handleStart('checkers')} title="Dame">
                <span className="btn-icon">⚪</span>
                Dame
              </button>
            </div>

            <div className="opponent-selection">
              <h3>Spieldus modus</h3>
              <div className="button-group">
                <button 
                  className={`btn variant-outline ${difficulty === 'pvp' ? 'active' : ''}`}
                  onClick={() => setDifficulty('pvp')}
                >
                  <Users size={16}/> Spieler vs Spieler
                </button>
                <button 
                  className={`btn variant-outline ${difficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => setDifficulty('easy')}
                >
                  <MonitorPlay size={16}/> Spieler vs PC (Leicht)
                </button>
                <button 
                  className={`btn variant-outline ${difficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => setDifficulty('medium')}
                >
                  <MonitorPlay size={16}/> Spieler vs PC (Mittel)
                </button>
                <button 
                  className={`btn variant-outline ${difficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => setDifficulty('hard')}
                >
                  <MonitorPlay size={16}/> Spieler vs PC (Schwer)
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="game-board-container glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
             <h2>Spielt: {selectedGame === 'chess' ? 'Schach' : 'Dame'} • Modus: {difficulty}</h2>
             <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                 {selectedGame === 'chess' ? (
                   <ChessBoard difficulty={difficulty} onGameOver={(msg) => alert(msg)} />
                 ) : (
                   <CheckersBoard difficulty={difficulty} onGameOver={(msg) => alert(msg)} />
                 )}
             </div>
             <button className="btn" onClick={() => setSelectedGame(null)}>Zurück zum Menü</button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
