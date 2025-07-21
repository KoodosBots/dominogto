/**
 * Game Logic and State Management
 */

// Game State
let gameState = {
    gameType: 'fives',
    scoreLimit: 100,
    boneCount: 7,
    playerMode: '1v1',
    yourScore: 0,
    opponentScore: 0,
    hand: [],
    board: [],
    history: [],
    passes: 0,
    draws: 0,
    gameId: null,
    userId: null
};

// Generate standard domino set
function generateDominoSet() {
    const dominoes = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            dominoes.push([i, j]);
        }
    }
    return dominoes;
}

// Shuffle array function
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Initialize game with selected dominoes
function startGame() {
    const selectedDominoes = getSelectedDominoes();
    
    if (selectedDominoes.length === 0) {
        showError('Please select at least one domino for your hand');
        return;
    }
    
    // Update game state
    gameState.hand = selectedDominoes;
    gameState.gameId = 'game_' + Date.now();
    gameState.userId = currentUser?.id;
    gameState.yourScore = 0;
    gameState.opponentScore = 0;
    gameState.board = [];
    gameState.history = [];
    gameState.passes = 0;
    gameState.draws = 0;
    
    // Initialize proper board layout system
    gameState.boardLayout = new ProperDominoBoard();
    
    // Record game start
    recordGameState('game_started', {
        initialHand: gameState.hand,
        gameConfig: {
            gameType: gameState.gameType,
            scoreLimit: gameState.scoreLimit,
            boneCount: gameState.boneCount,
            playerMode: gameState.playerMode
        }
    });
    
    // Switch to game screen
    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('gameBoardScreen').style.display = 'flex';
    document.getElementById('gameBoardScreen').classList.add('active');
    
    updateGameDisplay();
}

// Get selected dominoes from UI
function getSelectedDominoes() {
    const selectedElements = document.querySelectorAll('.domino.selected');
    return Array.from(selectedElements).map(element => {
        const top = parseInt(element.dataset.top);
        const bottom = parseInt(element.dataset.bottom);
        return [top, bottom];
    });
}

// Add domino to board with proper layout
function addDominoToBoard(domino, targetEnd = null) {
    if (!gameState.boardLayout) {
        gameState.boardLayout = new ProperDominoBoard();
    }
    
    let layoutResult;
    
    if (gameState.board.length === 0) {
        // First domino
        layoutResult = gameState.boardLayout.addFirstDomino(domino);
    } else {
        // Need to specify which end to play on
        if (!targetEnd) {
            // Auto-select first available end for now
            const dropZones = gameState.boardLayout.getDropZones();
            if (dropZones.length === 0) {
                throw new Error('No valid placement zones available');
            }
            
            // Find first zone where this domino can be played
            const validZone = dropZones.find(zone => {
                const [a, b] = domino;
                return a === zone.value || b === zone.value;
            });
            
            if (!validZone) {
                throw new Error(`Cannot place [${domino[0]}|${domino[1]}] - no matching ends`);
            }
            
            targetEnd = validZone.position;
        }
        
        layoutResult = gameState.boardLayout.addDomino(domino, targetEnd);
    }
    
    // Update game state arrays
    gameState.board.push(domino);
    gameState.hand = gameState.hand.filter(d => 
        !(d[0] === domino[0] && d[1] === domino[1])
    );
    
    // Record move
    recordGameState('domino_played', { 
        domino: domino,
        targetEnd: targetEnd,
        newBoardState: gameState.board,
        remainingHand: gameState.hand.length,
        layoutData: layoutResult
    });
    
    updateGameDisplay();
    calculateScore();
}

// Remove domino from board (simplified - removes last played)
function removeFromBoard(domino) {
    const index = gameState.board.findIndex(d => 
        d[0] === domino[0] && d[1] === domino[1]
    );
    
    if (index !== -1) {
        gameState.board.splice(index, 1);
        gameState.hand.push(domino);
        
        // Rebuild layout from scratch (simple approach)
        gameState.boardLayout.clear();
        gameState.board.forEach(d => {
            gameState.boardLayout.addDomino(d);
        });
        
        recordGameState('domino_removed', { 
            domino: domino,
            newBoardState: gameState.board
        });
        
        updateGameDisplay();
        calculateScore();
    }
}

// Backward compatibility
function removeDominoFromBoard(domino) {
    removeFromBoard(domino);
}

// Calculate score based on game type
function calculateScore() {
    if (gameState.gameType === 'fives') {
        calculateFivesScore();
    }
    // Add other game type scoring here
    updateScoreDisplay();
}

// Calculate Fives game score
function calculateFivesScore() {
    if (!gameState.boardLayout || gameState.board.length === 0) return;
    
    // Use proper board layout to get accurate open ends
    const openEndValues = gameState.boardLayout.getOpenEndValues();
    const endSum = openEndValues.reduce((sum, end) => sum + end, 0);
    
    if (endSum % 5 === 0 && endSum > 0) {
        gameState.yourScore += endSum;
        
        recordGameState('points_scored', {
            points: endSum,
            endValues: openEndValues,
            newScore: gameState.yourScore
        });
    }
}

// Pass turn
function passTurn() {
    gameState.passes += 1;
    recordGameState('turn_passed', { totalPasses: gameState.passes });
    updateGameDisplay();
}

// Draw domino (simulate)
function drawDomino() {
    // In a real game, this would draw from the boneyard
    // For now, just increment the draw counter
    gameState.draws += 1;
    recordGameState('domino_drawn', { totalDraws: gameState.draws });
    updateGameDisplay();
}

// End current round
function endRound() {
    const finalScore = {
        yourScore: gameState.yourScore,
        opponentScore: gameState.opponentScore,
        remainingInHand: gameState.hand.length,
        winner: gameState.yourScore > gameState.opponentScore ? 'player' : 'opponent'
    };
    
    recordGameState('round_ended', finalScore);
    
    // Reset for new round
    gameState.board = [];
    gameState.hand = [];
    gameState.passes = 0;
    gameState.draws = 0;
    
    document.getElementById('gameBoardScreen').style.display = 'none';
    document.getElementById('setupScreen').style.display = 'block';
    
    updateGameDisplay();
}

// Reset entire game
function resetGame() {
    gameState = {
        gameType: 'fives',
        scoreLimit: 100,
        boneCount: 7,
        playerMode: '1v1',
        yourScore: 0,
        opponentScore: 0,
        hand: [],
        board: [],
        history: [],
        passes: 0,
        draws: 0,
        gameId: null,
        userId: null
    };
    
    document.getElementById('gameBoardScreen').style.display = 'none';
    document.getElementById('setupScreen').style.display = 'block';
}

// Generate random opponent move (for testing)
function simulateOpponentMove() {
    // Simple simulation - add random score
    gameState.opponentScore += Math.floor(Math.random() * 15) + 5;
    updateScoreDisplay();
    
    recordGameState('opponent_move', { 
        newOpponentScore: gameState.opponentScore 
    });
}