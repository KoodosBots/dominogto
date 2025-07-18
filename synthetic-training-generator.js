/**
 * Synthetic Training Data Generator
 * Generates varied domino positions and local GTO analysis for AI training
 */

class SyntheticTrainingGenerator {
    constructor(gtoEngine) {
        this.gtoEngine = gtoEngine;
        this.gameTypes = ['fives', 'draw', 'block'];
        this.handSizes = [7, 6, 5, 4, 3, 2, 1];
    }

    /**
     * Generate a batch of synthetic training positions
     */
    async generateTrainingBatch(batchSize = 50) {
        const trainingData = [];
        
        for (let i = 0; i < batchSize; i++) {
            try {
                const position = this.generateRandomPosition();
                const analysis = await this.gtoEngine.analyzePosition(position, 'pro');
                
                trainingData.push({
                    position: position,
                    gtoAnalysis: {
                        winProbability: analysis.winProbability,
                        bestMove: analysis.bestMove,
                        evaluation: analysis.evaluation,
                        suggestions: analysis.suggestions
                    },
                    generated: true,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.log(`Failed to generate training position ${i}:`, error);
            }
        }
        
        return trainingData;
    }

    /**
     * Generate a random but realistic domino position
     */
    generateRandomPosition() {
        const gameType = this.randomChoice(this.gameTypes);
        const handSize = this.randomChoice(this.handSizes);
        const boardSize = Math.floor(Math.random() * 10) + 1;
        
        // Generate available dominoes (standard double-six set)
        const allDominoes = [];
        for (let i = 0; i <= 6; i++) {
            for (let j = i; j <= 6; j++) {
                allDominoes.push([i, j]);
            }
        }
        
        // Shuffle and distribute
        const shuffled = this.shuffleArray([...allDominoes]);
        const board = shuffled.slice(0, boardSize);
        const hand = shuffled.slice(boardSize, boardSize + handSize);
        
        return {
            board: board,
            hand: hand,
            gameType: gameType,
            yourScore: Math.floor(Math.random() * 100),
            opponentScore: Math.floor(Math.random() * 100),
            passes: Math.floor(Math.random() * 3),
            draws: Math.floor(Math.random() * 5)
        };
    }

    /**
     * Generate opening book positions (common early game scenarios)
     */
    generateOpeningPositions() {
        const openings = [];
        
        // Generate positions with different starting dominoes
        const startingDominoes = [[6,6], [5,5], [4,4], [6,5], [6,4], [5,4]];
        
        startingDominoes.forEach(starter => {
            // Create variations with different hands
            for (let handVar = 0; handVar < 5; handVar++) {
                const position = {
                    board: [starter],
                    hand: this.generateRealisticHand(7, [starter]),
                    gameType: 'fives',
                    yourScore: 0,
                    opponentScore: 0,
                    passes: 0,
                    draws: 0
                };
                openings.push(position);
            }
        });
        
        return openings;
    }

    /**
     * Generate endgame positions (few dominoes left)
     */
    generateEndgamePositions() {
        const endgames = [];
        
        for (let handSize = 1; handSize <= 3; handSize++) {
            for (let variation = 0; variation < 10; variation++) {
                const boardSize = Math.floor(Math.random() * 15) + 5; // More played dominoes
                const position = this.generateRandomPosition();
                position.hand = position.hand.slice(0, handSize);
                
                // Adjust scores for endgame
                position.yourScore = Math.floor(Math.random() * 80) + 20;
                position.opponentScore = Math.floor(Math.random() * 80) + 20;
                
                endgames.push(position);
            }
        }
        
        return endgames;
    }

    /**
     * Generate a realistic hand avoiding the used dominoes
     */
    generateRealisticHand(size, usedDominoes = []) {
        const allDominoes = [];
        for (let i = 0; i <= 6; i++) {
            for (let j = i; j <= 6; j++) {
                allDominoes.push([i, j]);
            }
        }
        
        // Remove used dominoes
        const available = allDominoes.filter(domino => 
            !usedDominoes.some(used => 
                (used[0] === domino[0] && used[1] === domino[1])
            )
        );
        
        const shuffled = this.shuffleArray(available);
        return shuffled.slice(0, Math.min(size, available.length));
    }

    /**
     * Send synthetic training data to Supabase
     */
    async sendSyntheticTraining(supabase, batchSize = 20) {
        try {
            console.log(`Generating ${batchSize} synthetic training positions...`);
            
            const trainingBatch = await this.generateTrainingBatch(batchSize);
            
            // Add opening and endgame positions
            const openings = this.generateOpeningPositions();
            const endgames = this.generateEndgamePositions();
            
            const allData = [
                ...trainingBatch,
                ...openings.slice(0, 10).map(pos => ({
                    position: pos,
                    gtoAnalysis: null, // Will be analyzed separately
                    generated: true,
                    type: 'opening',
                    timestamp: Date.now()
                })),
                ...endgames.slice(0, 10).map(pos => ({
                    position: pos,
                    gtoAnalysis: null,
                    generated: true,
                    type: 'endgame',
                    timestamp: Date.now()
                }))
            ];
            
            // Send to Supabase training_positions table
            const { data, error } = await supabase
                .from('synthetic_training_positions')
                .insert(allData);
            
            if (error) {
                console.error('Failed to send synthetic training data:', error);
                return false;
            }
            
            console.log(`Successfully sent ${allData.length} synthetic training positions`);
            return true;
            
        } catch (error) {
            console.error('Synthetic training generation failed:', error);
            return false;
        }
    }

    /**
     * Utility functions
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.SyntheticTrainingGenerator = SyntheticTrainingGenerator;
}