import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';

interface ChessBoardProps {
  difficulty?: 'pvp' | 'easy' | 'medium' | 'hard';
  onGameOver?: (result: string) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({ difficulty = 'pvp', onGameOver }) => {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  
  const board = game.board();

  // Helper to get unicode pieces
  const getPieceSymbol = (piece: any) => {
    if (!piece) return '';
    const symbols: Record<string, Record<string, string>> = {
      'w': { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
      'b': { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
    };
    return symbols[piece.color][piece.type];
  };

  const handleSquareClick = (square: string) => {
    if (game.isGameOver()) return;
    
    // Block action if not Player's turn in PvE
    const isPlayerTurn = game.turn() === 'w'; 
    if (difficulty !== 'pvp' && !isPlayerTurn) return;

    if (selectedSquare) {
      try {
        const moveDetails = {
          from: selectedSquare,
          to: square,
          promotion: 'q'
        };
        const newGame = new Chess();
        newGame.loadPgn(game.pgn());
        const move = newGame.move(moveDetails);
        
        if (move) {
          setGame(newGame);
          setSelectedSquare(null);
          setPossibleMoves([]);
          checkGameOver(newGame);
          return;
        }
      } catch (e) {
        // Invalid move block falls through to selection
      }
    }

    const piece = game.get(square as Square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square as Square);
      const moves = game.moves({ square: square as Square, verbose: true });
      setPossibleMoves(moves.map((m: any) => m.to));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const checkGameOver = (g: Chess) => {
    if (g.isCheckmate()) {
      onGameOver?.(g.turn() === 'w' ? 'Schwarz gewinnt durch Schachmatt!' : 'Weiß gewinnt durch Schachmatt!');
    } else if (g.isDraw()) {
      onGameOver?.('Unentschieden!');
    } else if (g.isStalemate()) {
      onGameOver?.('Patt!');
    }
  };

  // Simple KI
  useEffect(() => {
    if (difficulty !== 'pvp' && game.turn() === 'b' && !game.isGameOver()) {
      const makePCMove = () => {
        const moves = game.moves();
        if (moves.length === 0) return;
        
        // Very simple "Easy" KI: totally random
        const randomIdx = Math.floor(Math.random() * moves.length);
        const newGame = new Chess();
        newGame.loadPgn(game.pgn());
        newGame.move(moves[randomIdx]);
        
        setGame(newGame);
        checkGameOver(newGame);
      };

      const timer = setTimeout(makePCMove, 500);
      return () => clearTimeout(timer);
    }
  }, [game, difficulty, onGameOver]);

  return (
    <div className="chess-board">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((square, colIndex) => {
            const isDark = (rowIndex + colIndex) % 2 === 1;
            const squareId = String.fromCharCode(97 + colIndex) + (8 - rowIndex) as Square;
            const isSelected = selectedSquare === squareId;
            const isPossibleMove = possibleMoves.includes(squareId);

            return (
              <div
                key={colIndex}
                className={`square ${isDark ? 'dark-square' : 'light-square'} ${isSelected ? 'selected' : ''} ${isPossibleMove ? 'possible-move' : ''}`}
                onClick={() => handleSquareClick(squareId)}
              >
                {isPossibleMove && !square && <div className="move-indicator"></div>}
                {square && (
                  <span className={`piece ${square.color === 'w' ? 'white-piece' : 'black-piece'}`}>
                    {getPieceSymbol(square)}
                  </span>
                )}
                {isPossibleMove && square && <div className="capture-indicator"></div>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
