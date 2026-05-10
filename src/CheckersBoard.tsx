import React, { useState, useEffect } from 'react';

type Piece = 'w' | 'b' | 'W' | 'B' | null; // w: white man, W: white king, b: black man, B: black king
type BoardState = Piece[][];

interface CheckersBoardProps {
  difficulty?: 'pvp' | 'easy' | 'medium' | 'hard';
  onGameOver?: (result: string) => void;
}

const INITIAL_BOARD: BoardState = Array(8).fill(null).map((_, row) => 
  Array(8).fill(null).map((_, col) => {
    if ((row + col) % 2 === 1) {
      if (row < 3) return 'b';
      if (row > 4) return 'w';
    }
    return null;
  })
);

export const CheckersBoard: React.FC<CheckersBoardProps> = ({ difficulty = 'pvp', onGameOver }) => {
  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [selectedPos, setSelectedPos] = useState<{ r: number, c: number } | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<{ r: number, c: number, jumpPos?: { r: number, c: number } }[]>([]);

  // Simple KI
  useEffect(() => {
    if (difficulty !== 'pvp' && turn === 'b') {
      const timer = setTimeout(() => {
        // Collect all possible moves for black
        let allMoves: { from: { r: number, c: number }, to: { r: number, c: number, jumpPos?: { r: number, c: number } } }[] = [];
        let anyJumps = false;

        board.forEach((row, r) => {
          row.forEach((piece, c) => {
            if (piece?.toLowerCase() === 'b') {
              const moves = getValidMovesForPiece(board, r, c, 'b');
              if (moves.some(m => m.jumpPos)) anyJumps = true;
              moves.forEach(m => allMoves.push({ from: { r, c }, to: m }));
            }
          });
        });

        if (anyJumps) {
          allMoves = allMoves.filter(m => m.to.jumpPos);
        }

        if (allMoves.length > 0) {
          const move = allMoves[Math.floor(Math.random() * allMoves.length)];
          executeMove(move.from.r, move.from.c, move.to.r, move.to.c, move.to.jumpPos);
        } else {
          onGameOver?.('Weiß gewinnt! (Schwarz kann nicht mehr ziehen)');
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [turn, difficulty, board]);

  const getValidMovesForPiece = (b: BoardState, r: number, c: number, activeColor: 'w'|'b') => {
    const piece = b[r][c];
    if (!piece || piece.toLowerCase() !== activeColor) return [];

    const isKing = piece === piece.toUpperCase();
    const forwardDir = activeColor === 'w' ? -1 : 1;
    const directions = isKing ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[forwardDir, 1], [forwardDir, -1]];
    
    let moves = [];
    let jumps = [];

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        if (!b[nr][nc]) {
          moves.push({ r: nr, c: nc });
        } else if (b[nr][nc]?.toLowerCase() !== activeColor) {
           // check jump
           const jr = nr + dr;
           const jc = nc + dc;
           if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !b[jr][jc]) {
               jumps.push({ r: jr, c: jc, jumpPos: { r: nr, c: nc } });
           }
        }
      }
    }

    return jumps.length > 0 ? jumps : moves;
  };

  const hasAnyJumps = (activeColor: 'w'|'b') => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.toLowerCase() === activeColor) {
           const moves = getValidMovesForPiece(board, r, c, activeColor);
           if (moves.some(m => m.jumpPos)) return true;
        }
      }
    }
    return false;
  };

  const handleSquareClick = (r: number, c: number) => {
    // PvE lock
    if (difficulty !== 'pvp' && turn === 'b') return;

    if (selectedPos) {
      const move = possibleMoves.find(m => m.r === r && m.c === c);
      if (move) {
        executeMove(selectedPos.r, selectedPos.c, r, c, move.jumpPos);
        return;
      }
    }

    const piece = board[r][c];
    if (piece && piece.toLowerCase() === turn) {
       const moves = getValidMovesForPiece(board, r, c, turn);
       const mustJump = hasAnyJumps(turn);
       if (mustJump) {
          const jumpsOnly = moves.filter(m => m.jumpPos);
          if (jumpsOnly.length > 0) {
             setSelectedPos({ r, c });
             setPossibleMoves(jumpsOnly);
          } else {
             setSelectedPos(null);
             setPossibleMoves([]);
          }
       } else {
          setSelectedPos({ r, c });
          setPossibleMoves(moves);
       }
    } else {
       setSelectedPos(null);
       setPossibleMoves([]);
    }
  };

  const executeMove = (fromR: number, fromC: number, toR: number, toC: number, jumpPos?: { r: number, c: number }) => {
     const newBoard = board.map(row => [...row]);
     let piece = newBoard[fromR][fromC];
     newBoard[fromR][fromC] = null;
     
     if (jumpPos) {
        newBoard[jumpPos.r][jumpPos.c] = null;
     }

     // Promotion
     if (piece === 'w' && toR === 0) piece = 'W';
     if (piece === 'b' && toR === 7) piece = 'B';

     newBoard[toR][toC] = piece;
     setBoard(newBoard);
     setSelectedPos(null);
     setPossibleMoves([]);
     setTurn(turn === 'w' ? 'b' : 'w');
  };

  return (
    <div className="chess-board">
      {board.map((row, r) => (
        <div key={r} className="board-row">
          {row.map((col, c) => {
            const isDark = (r + c) % 2 === 1;
            const isSelected = selectedPos?.r === r && selectedPos?.c === c;
            const possibleMove = possibleMoves.find(m => m.r === r && m.c === c);
            
            return (
              <div 
                key={c}
                className={`square ${isDark ? 'dark-square' : 'light-square'} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSquareClick(r, c)}
              >
                 {possibleMove && !col && <div className="move-indicator"></div>}
                 {col && (
                    <div className="checker-piece" style={{
                       width: '80%', height: '80%', borderRadius: '50%',
                       background: col.toLowerCase() === 'w' ? '#f8fafc' : '#1a1a1a',
                       border: `4px solid ${col.toLowerCase() === 'w' ? '#cbd5e1' : '#000000'}`,
                       boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                       display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}>
                       {col === col.toUpperCase() && col !== null && (
                         <span style={{ color: col === 'W' ? '#000' : '#fff', fontWeight: 'bold' }}>♔</span>
                       )}
                    </div>
                 )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  );
};
