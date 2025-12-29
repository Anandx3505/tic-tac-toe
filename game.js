document.addEventListener('DOMContentLoaded', () => {

    let gameBoard = new Array(9).fill(0);
    const winSequences = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    let j = 'X';
    let flag = false;
    let isAIMode = false;
    let aiDifficulty = 'hard';
    const aiPlayer = '0';
    const humanPlayer = 'X';
    let moveCount = 0;
    let gameStats = { wins: 0, draws: 0, losses: 0 };

    const xMoves = [];
    const oMoves = [];
    
    const transpositionTable = new Map();
    
    const openingBook = {
        '000000000': [4],
        '0000X0000': [0, 2, 6, 8],
        'X00000000': [4],
        '0X0000000': [4],
    }; 

    const cells = document.querySelectorAll('.cell');
    const stat = document.getElementById('status');
    const resetButton = document.getElementById('reset');
    const twistOn = document.getElementById('mySwitch');
    const pvpButton = document.getElementById('pvp-mode');
    const aiButton = document.getElementById('ai-mode');
    const difficultySelector = document.getElementById('difficulty-selector');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const gameStatsDiv = document.getElementById('game-stats');
    const moveCountSpan = document.getElementById('move-count');
    const winRecordSpan = document.getElementById('win-record');

    const heading = document.querySelector('h1');
    const para = document.querySelector('p');
    const labell = document.querySelector('label');


    loadGameStats();
    
    pvpButton.addEventListener('click', () => {
        isAIMode = false;
        pvpButton.classList.add('active');
        aiButton.classList.remove('active');
        difficultySelector.style.display = 'none';
        gameStatsDiv.style.display = 'none';
        resetGame();
    });

    aiButton.addEventListener('click', () => {
        isAIMode = true;
        aiButton.classList.add('active');
        pvpButton.classList.remove('active');
        difficultySelector.style.display = 'flex';
        gameStatsDiv.style.display = 'flex';
        resetGame();
    });

    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            aiDifficulty = btn.dataset.difficulty;
            difficultyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            resetGame();
        });
    });

    twistOn.addEventListener('change', function () {
        if (this.checked) {
            document.body.style.backgroundColor = 'black';
            para.style.color = 'white';
            heading.style.color = 'white';
            resetGame();
            labell.title = "Click for normal mode";
            stat.textContent = "🌀 Twist Mode ON: Each player keeps only 3 moves. Oldest will disappear!";

        } else {
            document.body.style.backgroundColor = 'white';
            para.style.color = 'black';
            heading.style.color = 'black';
            labell.title = "Click for twist mode🌀";
            resetGame();
            stat.textContent = "";
        }
    });
    resetButton.addEventListener('click', resetGame);

    cells.forEach(cell => {
        cell.addEventListener('click', handleClick);
    });

    function handleClick(e) {
        if (flag) return;
        if (isAIMode && j === aiPlayer) return;

        const index = e.target.dataset.index;
        if (gameBoard[index] === 0) {
            makeMove(index, j);
            
            if (!flag && isAIMode && j === aiPlayer) {
                cells.forEach(cell => {
                    if (gameBoard[cell.dataset.index] === 0) {
                        cell.classList.add('ai-thinking');
                    }
                });
                
                setTimeout(() => {
                    cells.forEach(cell => cell.classList.remove('ai-thinking'));
                    aiMove();
                }, 400);
            }
        } else {
            alert("Invalid move, try again!");
        }
    }

    function makeMove(index, player) {
        gameBoard[index] = player;
        cells[index].textContent = player;
        moveCount++;
        updateMoveCount();
        
        if(twistOn.checked) {
            if (player === 'X') {
                xMoves.push(index);
                if (xMoves.length > 3) {
                    const oldIndex = xMoves.shift();
                    gameBoard[oldIndex] = 0;
                    cells[oldIndex].textContent = '';
                }
            } else {
                oMoves.push(index);
                if (oMoves.length > 3) {
                    const oldIndex = oMoves.shift();
                    gameBoard[oldIndex] = 0;
                    cells[oldIndex].textContent = '';
                }
            }
        }

        if (checkWin(gameBoard, player)) {
            highlightWinningCells(player);
            stat.textContent = player + " Wins!";
            flag = true;
            
            if (isAIMode) {
                if (player === humanPlayer) {
                    gameStats.wins++;
                    stat.textContent = "🎉 You Win! (Impressive!)";
                } else {
                    gameStats.losses++;
                    stat.textContent = "💀 AI Wins! (Try again!)";
                }
                saveGameStats();
                updateStatsDisplay();
            }
        } else {
            drawGame();
            j = (j === 'X') ? '0' : 'X';
        }
    }

    function checkWin(gameBoard, player) {
        for (let seq of winSequences) {
            if (
                gameBoard[seq[0]] === player &&
                gameBoard[seq[1]] === player &&
                gameBoard[seq[2]] === player
            ) {
                return true;
            }
        }
        return false;
    }

    function resetGame() {
        gameBoard.fill(0);
        xMoves.length = 0;
        oMoves.length = 0;
        moveCount = 0;
        transpositionTable.clear();
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('winning-cell', 'ai-thinking');
        });
        j = 'X';
        stat.textContent = '';
        flag = false;
        updateMoveCount();
    }

    function drawGame() {
        if (!gameBoard.includes(0) && stat.textContent === '') {
            stat.textContent = "It's a draw!";
            flag = true;
            
            if (isAIMode) {
                gameStats.draws++;
                stat.textContent = "🤝 Draw! (Well played!)";
                saveGameStats();
                updateStatsDisplay();
            }
        }
    }

    function aiMove() {
        if (flag) return;
        
        let moveIndex;
        
        if (twistOn.checked) {
            moveIndex = twistModeAI();
        } else {
            switch(aiDifficulty) {
                case 'easy':
                    moveIndex = easyAI();
                    break;
                case 'medium':
                    moveIndex = mediumAI();
                    break;
                case 'hard':
                    moveIndex = hardAI();
                    break;
                default:
                    moveIndex = hardAI();
            }
        }
        
        if (moveIndex !== undefined) {
            makeMove(moveIndex, aiPlayer);
        }
    }

    function easyAI() {
        const availableSpots = getAvailableSpots();
        if (availableSpots.length === 0) return undefined;
        
        if (Math.random() < 0.3) {
            return minimaxAlphaBeta(gameBoard, 0, -Infinity, Infinity, true).index;
        }
        
        return availableSpots[Math.floor(Math.random() * availableSpots.length)];
    }
    
    function mediumAI() {
        if (Math.random() < 0.15) {
            const availableSpots = getAvailableSpots();
            return availableSpots[Math.floor(Math.random() * availableSpots.length)];
        }
        
        const winMove = findWinningMove(aiPlayer);
        if (winMove !== -1) return winMove;
        
        const blockMove = findWinningMove(humanPlayer);
        if (blockMove !== -1) return blockMove;
        
        return strategicMove();
    }
    
    function hardAI() {
        const boardKey = gameBoard.join('');
        if (openingBook[boardKey]) {
            const moves = openingBook[boardKey];
            return moves[Math.floor(Math.random() * moves.length)];
        }
        
        if (transpositionTable.has(boardKey)) {
            return transpositionTable.get(boardKey);
        }
        
        const depth = 0;
        const result = minimaxAlphaBeta(gameBoard, depth, -Infinity, Infinity, true);
        
        transpositionTable.set(boardKey, result.index);
        
        return result.index;
    }
    
    function twistModeAI() {
        const winMove = findWinningMove(aiPlayer);
        if (winMove !== -1) return winMove;
        
        const blockMove = findWinningMove(humanPlayer);
        if (blockMove !== -1) return blockMove;
        
        const aiMoveCount = oMoves.length;
        if (aiMoveCount < 3) {
            return strategicMove();
        }
        
        return strategicMove();
    }

    function minimaxAlphaBeta(board, depth, alpha, beta, isMaximizing) {
        if (checkWin(board, aiPlayer)) {
            return { score: 10 - depth, index: -1 };
        }
        if (checkWin(board, humanPlayer)) {
            return { score: depth - 10, index: -1 };
        }
        
        const availableSpots = getAvailableSpots();
        if (availableSpots.length === 0) {
            return { score: 0, index: -1 };
        }
        
        const orderedMoves = orderMoves(availableSpots);
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            let bestMove = -1;
            
            for (let i = 0; i < orderedMoves.length; i++) {
                const spot = orderedMoves[i];
                board[spot] = aiPlayer;
                
                const evaluation = minimaxAlphaBeta(board, depth + 1, alpha, beta, false);
                
                board[spot] = 0;
                
                if (evaluation.score > maxEval) {
                    maxEval = evaluation.score;
                    bestMove = spot;
                }
                
                alpha = Math.max(alpha, evaluation.score);
                if (beta <= alpha) {
                    break;
                }
            }
            
            return { score: maxEval, index: bestMove };
        } else {
            let minEval = Infinity;
            let bestMove = -1;
            
            for (let i = 0; i < orderedMoves.length; i++) {
                const spot = orderedMoves[i];
                board[spot] = humanPlayer;
                
                const evaluation = minimaxAlphaBeta(board, depth + 1, alpha, beta, true);
                
                board[spot] = 0;
                
                if (evaluation.score < minEval) {
                    minEval = evaluation.score;
                    bestMove = spot;
                }
                
                beta = Math.min(beta, evaluation.score);
                if (beta <= alpha) {
                    break;
                }
            }
            
            return { score: minEval, index: bestMove };
        }
    }
    
    function orderMoves(moves) {
        const positionValues = { 4: 4, 0: 3, 2: 3, 6: 3, 8: 3, 1: 2, 3: 2, 5: 2, 7: 2 };
        return moves.sort((a, b) => positionValues[b] - positionValues[a]);
    }
    
    function getAvailableSpots() {
        const spots = [];
        for (let i = 0; i < 9; i++) {
            if (gameBoard[i] === 0) spots.push(i);
        }
        return spots;
    }
    
    function findWinningMove(player) {
        for (let i = 0; i < 9; i++) {
            if (gameBoard[i] === 0) {
                gameBoard[i] = player;
                if (checkWin(gameBoard, player)) {
                    gameBoard[i] = 0;
                    return i;
                }
                gameBoard[i] = 0;
            }
        }
        return -1;
    }
    
    function strategicMove() {
        const positionValues = [3, 2, 3, 2, 4, 2, 3, 2, 3];
        const corners = [0, 2, 6, 8];
        const center = 4;
        const edges = [1, 3, 5, 7];
        
        if (gameBoard[center] === 0) return center;
        
        const availableCorners = corners.filter(i => gameBoard[i] === 0);
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        const availableEdges = edges.filter(i => gameBoard[i] === 0);
        if (availableEdges.length > 0) {
            return availableEdges[Math.floor(Math.random() * availableEdges.length)];
        }
        
        const available = getAvailableSpots();
        return available.length > 0 ? available[0] : undefined;
    }
    
    function highlightWinningCells(player) {
        for (let seq of winSequences) {
            if (
                gameBoard[seq[0]] === player &&
                gameBoard[seq[1]] === player &&
                gameBoard[seq[2]] === player
            ) {
                cells[seq[0]].classList.add('winning-cell');
                cells[seq[1]].classList.add('winning-cell');
                cells[seq[2]].classList.add('winning-cell');
                break;
            }
        }
    }
    
    function updateMoveCount() {
        if (isAIMode) {
            moveCountSpan.textContent = `Moves: ${moveCount}`;
        }
    }
    
    function updateStatsDisplay() {
        winRecordSpan.textContent = `W: ${gameStats.wins} | D: ${gameStats.draws} | L: ${gameStats.losses}`;
    }
    
    function saveGameStats() {
        localStorage.setItem('tictactoe_stats', JSON.stringify(gameStats));
    }
    
    function loadGameStats() {
        const saved = localStorage.getItem('tictactoe_stats');
        if (saved) {
            gameStats = JSON.parse(saved);
            updateStatsDisplay();
        }
    }
});
