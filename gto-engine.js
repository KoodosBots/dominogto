/**
 * Domino GTO Analysis Engine
 * Implements Game Theory Optimal analysis for domino games
 */

class DominoGTOEngine {
    constructor() {
        this.cache = new Map();
        this.cacheMaxSize = 10000;
        this.tierLimits = {
            free: 2,
            basic: 5,
            pro: 10
        };
    }

    /**
     * Phase 1: Board Normalization
     * Creates a canonical representation of the board state
     */
    normalizeBoard(board) {
        if (!board || board.length === 0) {
            return [];
        }

        const normalizedBoard = board.map(domino => {
            const [a, b] = domino;
            return a <= b ? [a, b] : [b, a];
        });

        normalizedBoard.sort((a, b) => {
            if (a[0] !== b[0]) return a[0] - b[0];
            return a[1] - b[1];
        });

        return normalizedBoard;
    }

    /**
     * Phase 1: Position Hashing
     * Creates a unique hash for a position including board and current player
     */
    async hashPosition(board, currentPlayer, gameType = 'fives') {
        const normalizedBoard = this.normalizeBoard(board);
        const positionData = {
            board: normalizedBoard,
            player: currentPlayer,
            gameType: gameType
        };

        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(positionData));
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Phase 2: Cache System
     * Checks if position analysis exists in cache
     */
    async checkCache(positionHash, maxDepth) {
        const cacheKey = `${positionHash}_${maxDepth}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hour expiry
            return cached.analysis;
        }
        
        return null;
    }

    /**
     * Phase 2: Cache Storage
     * Stores analysis results with LRU eviction
     */
    async storeAnalysis(positionHash, analysis, maxDepth) {
        const cacheKey = `${positionHash}_${maxDepth}`;
        
        if (this.cache.size >= this.cacheMaxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(cacheKey, {
            analysis: analysis,
            timestamp: Date.now()
        });
    }

    /**
     * Phase 3: Multi-Tier Analysis
     * Main analysis function with tier-based depth limits
     */
    async analyzePosition(gameState, tier = 'free') {
        const maxDepth = this.tierLimits[tier] || this.tierLimits.free;
        const positionHash = await this.hashPosition(
            gameState.board, 
            'player', // assuming player to move
            gameState.gameType
        );

        const cached = await this.checkCache(positionHash, maxDepth);
        if (cached) {
            return { ...cached, fromCache: true };
        }

        const analysis = await this.runLookahead(gameState, maxDepth);
        await this.storeAnalysis(positionHash, analysis, maxDepth);
        
        return { ...analysis, fromCache: false };
    }

    /**
     * Phase 4: Core Lookahead Engine
     * Implements minimax with alpha-beta pruning
     */
    async runLookahead(gameState, maxDepth) {
        const startTime = Date.now();
        
        try {
            const result = this.minimax(gameState, maxDepth, -Infinity, Infinity, true);
            const analysisTime = Date.now() - startTime;
            
            return {
                bestMove: result.move,
                evaluation: result.score,
                winProbability: this.scoreToWinProbability(result.score),
                suggestions: this.generateSuggestions(gameState, result),
                analysisTime: analysisTime,
                depth: maxDepth
            };
        } catch (error) {
            console.error('Lookahead analysis failed:', error);
            return this.getDefaultAnalysis();
        }
    }

    /**
     * Minimax algorithm with alpha-beta pruning
     */
    minimax(gameState, depth, alpha, beta, maximizingPlayer) {
        if (depth === 0 || this.isGameOver(gameState)) {
            return {
                score: this.evaluatePosition(gameState),
                move: null
            };
        }

        const possibleMoves = this.generateLegalMoves(gameState);
        let bestMove = null;

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            
            for (const move of possibleMoves) {
                const newState = this.makeMove(gameState, move);
                const evaluation = this.minimax(newState, depth - 1, alpha, beta, false);
                
                if (evaluation.score > maxEval) {
                    maxEval = evaluation.score;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, evaluation.score);
                if (beta <= alpha) {
                    break; // Alpha-beta pruning
                }
            }
            
            return { score: maxEval, move: bestMove };
        } else {
            let minEval = Infinity;
            
            for (const move of possibleMoves) {
                const newState = this.makeMove(gameState, move);
                const evaluation = this.minimax(newState, depth - 1, alpha, beta, true);
                
                if (evaluation.score < minEval) {
                    minEval = evaluation.score;
                    bestMove = move;
                }
                
                beta = Math.min(beta, evaluation.score);
                if (beta <= alpha) {
                    break; // Alpha-beta pruning
                }
            }
            
            return { score: minEval, move: bestMove };
        }
    }

    /**
     * Phase 4: Position Evaluation
     * Evaluates a domino position based on multiple factors
     */
    evaluatePosition(gameState) {
        if (this.isGameOver(gameState)) {
            return this.getGameOverScore(gameState);
        }

        let score = 0;
        
        // Hand strength evaluation
        score += this.evaluateHandStrength(gameState.hand);
        
        // Board control evaluation
        score += this.evaluateBoardControl(gameState);
        
        // Scoring potential (for fives game)
        if (gameState.gameType === 'fives') {
            score += this.evaluateScoringPotential(gameState);
        }
        
        // Game-specific adjustments
        score += this.getGameTypeModifier(gameState);
        
        return score;
    }

    /**
     * Phase 5: Legal Move Generation
     * Generates all possible domino placements for current position
     */
    generateLegalMoves(gameState) {
        if (!gameState.hand || gameState.hand.length === 0) {
            return [{ type: 'pass' }];
        }

        const moves = [];
        const boardEnds = this.getBoardEnds(gameState.board);

        // If board is empty, any domino can be played
        if (gameState.board.length === 0) {
            gameState.hand.forEach(domino => {
                moves.push({
                    type: 'play',
                    domino: domino,
                    position: 'start',
                    orientation: 'normal'
                });
            });
            return moves;
        }

        // Check each domino against each board end
        gameState.hand.forEach(domino => {
            const [a, b] = domino;
            
            boardEnds.forEach(end => {
                if (a === end.value) {
                    moves.push({
                        type: 'play',
                        domino: domino,
                        position: end.side,
                        orientation: 'normal'
                    });
                }
                if (b === end.value && a !== b) {
                    moves.push({
                        type: 'play',
                        domino: domino,
                        position: end.side,
                        orientation: 'flipped'
                    });
                }
            });
        });

        // If no legal plays, add pass move
        if (moves.length === 0) {
            moves.push({ type: 'pass' });
        }

        return moves;
    }

    /**
     * Helper function to get board ends
     */
    getBoardEnds(board) {
        if (!board || board.length === 0) {
            return [];
        }

        if (board.length === 1) {
            const [a, b] = board[0];
            return [
                { side: 'left', value: a },
                { side: 'right', value: b }
            ];
        }

        // For multiple dominoes, this is simplified
        // In a real implementation, we'd track the actual board layout
        const firstDomino = board[0];
        const lastDomino = board[board.length - 1];
        
        return [
            { side: 'left', value: firstDomino[0] },
            { side: 'right', value: lastDomino[1] }
        ];
    }

    /**
     * Utility functions for evaluation
     */
    evaluateHandStrength(hand) {
        if (!hand || hand.length === 0) return 0;
        
        let strength = 0;
        hand.forEach(domino => {
            const [a, b] = domino;
            strength += a + b; // Simple pip count
            if (a === b) strength += 2; // Bonus for doubles
        });
        
        return strength;
    }

    evaluateBoardControl(gameState) {
        // Simple board control evaluation
        return gameState.board.length * 5;
    }

    evaluateScoringPotential(gameState) {
        // For fives game, evaluate immediate scoring opportunities
        let potential = 0;
        const boardEnds = this.getBoardEnds(gameState.board);
        
        if (boardEnds.length === 2) {
            const endSum = boardEnds.reduce((sum, end) => sum + end.value, 0);
            if (endSum % 5 === 0) {
                potential += endSum; // Reward current scoring position
            }
        }
        
        return potential;
    }

    getGameTypeModifier(gameState) {
        // Game-specific evaluation adjustments
        switch (gameState.gameType) {
            case 'fives':
                return gameState.yourScore - gameState.opponentScore;
            case 'block':
            case 'draw':
                return -(gameState.hand?.length || 0) * 10; // Prefer fewer dominoes
            default:
                return 0;
        }
    }

    isGameOver(gameState) {
        return !gameState.hand || gameState.hand.length === 0;
    }

    getGameOverScore(gameState) {
        if (!gameState.hand || gameState.hand.length === 0) {
            return 1000; // Win condition
        }
        return -1000; // Loss condition
    }

    makeMove(gameState, move) {
        // Create a copy of the game state with the move applied
        const newState = JSON.parse(JSON.stringify(gameState));
        
        if (move.type === 'play') {
            newState.board.push(move.domino);
            newState.hand = newState.hand.filter(d => 
                !(d[0] === move.domino[0] && d[1] === move.domino[1])
            );
        } else if (move.type === 'pass') {
            newState.passes += 1;
        }
        
        return newState;
    }

    scoreToWinProbability(score) {
        // Convert evaluation score to win percentage
        const sigmoid = 1 / (1 + Math.exp(-score / 100));
        return Math.round(sigmoid * 100);
    }

    generateSuggestions(gameState, result) {
        const suggestions = [];
        
        if (result.move) {
            if (result.move.type === 'play') {
                const [a, b] = result.move.domino;
                suggestions.push({
                    title: `Play ${a}-${b}`,
                    description: `Best move: Place the ${a}-${b} domino on the ${result.move.position} side`,
                    confidence: Math.min(95, 60 + Math.abs(result.score) / 10)
                });
            } else if (result.move.type === 'pass') {
                suggestions.push({
                    title: 'Pass',
                    description: 'No legal moves available - must pass',
                    confidence: 100
                });
            }
        }
        
        // Add additional strategic suggestions
        if (gameState.gameType === 'fives') {
            suggestions.push({
                title: 'Focus on Scoring',
                description: 'Look for moves that create multiples of 5 on the board ends',
                confidence: 75
            });
        }
        
        return suggestions;
    }

    getDefaultAnalysis() {
        return {
            bestMove: null,
            evaluation: 0,
            winProbability: 50,
            suggestions: [{
                title: 'Analysis Unavailable',
                description: 'Unable to analyze position at this time',
                confidence: 0
            }],
            analysisTime: 0,
            depth: 0
        };
    }
}

// Export for use in HTML
if (typeof window !== 'undefined') {
    window.DominoGTOEngine = DominoGTOEngine;
}