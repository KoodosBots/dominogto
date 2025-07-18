/**
 * Proper Domino Board Implementation
 * Based on actual All Fives domino game rules
 */

class ProperDominoBoard {
    constructor() {
        this.mainChain = [];           // Linear horizontal chain of dominoes
        this.spinner = null;           // Reference to first double played
        this.spinnerIndex = -1;        // Position of spinner in main chain
        this.topChain = [];           // Dominoes played on top of spinner
        this.bottomChain = [];        // Dominoes played on bottom of spinner
        this.openEnds = {             // Current pip values at open ends
            left: null,
            right: null,
            top: null,    // Only exists after spinner
            bottom: null  // Only exists after spinner
        };
    }

    /**
     * Add first domino to start the game
     */
    addFirstDomino(domino) {
        const [a, b] = domino;
        this.mainChain.push({
            values: domino,
            isSpinner: false,
            orientation: 'horizontal'
        });
        
        // Set initial open ends
        this.openEnds.left = a;
        this.openEnds.right = b;
        
        // Check if first domino is a double (becomes spinner immediately)
        if (a === b && !this.spinner) {
            this.setAsSpinner(0, domino);
        }
        
        return this.getLayoutData();
    }

    /**
     * Add domino to one of the open ends
     */
    addDomino(domino, targetEnd) {
        const [a, b] = domino;
        const isDouble = a === b;
        
        if (!this.canPlace(domino, targetEnd)) {
            throw new Error(`Cannot place [${a}|${b}] on ${targetEnd} end (value: ${this.openEnds[targetEnd]})`);
        }
        
        const placement = this.calculatePlacement(domino, targetEnd);
        
        // Add to appropriate chain
        if (targetEnd === 'left' || targetEnd === 'right') {
            this.addToMainChain(domino, targetEnd, placement);
        } else if (targetEnd === 'top') {
            this.addToTopChain(domino, placement);
        } else if (targetEnd === 'bottom') {
            this.addToBottomChain(domino, placement);
        }
        
        // Check if this domino should become the spinner
        if (isDouble && !this.spinner) {
            this.setAsSpinner(this.getLastAddedIndex(targetEnd), domino);
        }
        
        this.updateOpenEnds();
        return this.getLayoutData();
    }

    /**
     * Check if domino can be placed at target end
     */
    canPlace(domino, targetEnd) {
        const [a, b] = domino;
        const endValue = this.openEnds[targetEnd];
        
        if (endValue === null) return false;
        if (targetEnd === 'top' || targetEnd === 'bottom') {
            // Can only place on top/bottom if spinner exists
            if (!this.spinner) return false;
        }
        
        return a === endValue || b === endValue;
    }

    /**
     * Calculate how to place the domino (which end connects)
     */
    calculatePlacement(domino, targetEnd) {
        const [a, b] = domino;
        const endValue = this.openEnds[targetEnd];
        
        console.log(`=== PLACEMENT CALCULATION ===`);
        console.log(`Domino: [${a}|${b}]`);
        console.log(`Target end: ${targetEnd}`);
        console.log(`Open end value: ${endValue}`);
        
        if (a === endValue) {
            console.log(`Match found: a(${a}) === endValue(${endValue})`);
            console.log(`Result: connecting=${a}, exposed=${b}, flipped=false`);
            console.log(`=== END PLACEMENT ===\n`);
            return { connectingValue: a, exposedValue: b, flipped: false };
        } else {
            console.log(`Match found: b(${b}) === endValue(${endValue})`);
            console.log(`Result: connecting=${b}, exposed=${a}, flipped=true`);
            console.log(`=== END PLACEMENT ===\n`);
            return { connectingValue: b, exposedValue: a, flipped: true };
        }
    }

    /**
     * Add domino to main horizontal chain
     */
    addToMainChain(domino, side, placement) {
        const [a, b] = domino;
        const isDouble = a === b;
        
        const dominoData = {
            values: domino,
            isSpinner: false,
            orientation: isDouble ? 'vertical' : 'vertical', // Main chain: vertical dominoes extending horizontally
            placement: placement
        };
        
        if (side === 'left') {
            this.mainChain.unshift(dominoData);
            // Adjust spinner index since we inserted at beginning
            if (this.spinnerIndex >= 0) this.spinnerIndex++;
        } else {
            this.mainChain.push(dominoData);
        }
    }

    /**
     * Add domino to top chain (horizontal from spinner)
     */
    addToTopChain(domino, placement) {
        const [a, b] = domino;
        const isDouble = a === b;
        
        this.topChain.push({
            values: domino,
            isSpinner: false,
            orientation: isDouble ? 'vertical' : 'horizontal', // Top chain: horizontal dominoes extending upward
            placement: placement
        });
    }

    /**
     * Add domino to bottom chain (horizontal from spinner)
     */
    addToBottomChain(domino, placement) {
        const [a, b] = domino;
        const isDouble = a === b;
        
        this.bottomChain.push({
            values: domino,
            isSpinner: false,
            orientation: isDouble ? 'vertical' : 'horizontal', // Bottom chain: horizontal dominoes extending downward
            placement: placement
        });
    }

    /**
     * Mark a domino as the spinner (first double)
     */
    setAsSpinner(index, domino) {
        this.spinner = domino;
        
        if (this.mainChain[index]) {
            this.spinnerIndex = index;
            this.mainChain[index].isSpinner = true;
            this.mainChain[index].orientation = 'vertical'; // Spinner is perpendicular
            
            // Spinner opens up top and bottom ends
            this.openEnds.top = domino[0];    // Both values same for double
            this.openEnds.bottom = domino[0];
        }
    }

    /**
     * Update open end values after placing a domino
     */
    updateOpenEnds() {
        // Update main chain ends
        if (this.mainChain.length > 0) {
            const leftDomino = this.mainChain[0];
            const rightDomino = this.mainChain[this.mainChain.length - 1];
            
            // Left end - always the outward-facing value
            if (leftDomino.placement) {
                this.openEnds.left = leftDomino.placement.exposedValue;
            } else {
                // For first domino, left side is values[0]
                this.openEnds.left = leftDomino.values[0];
            }
            
            // Right end - always the outward-facing value
            if (rightDomino.placement) {
                this.openEnds.right = rightDomino.placement.exposedValue;
            } else {
                // For first domino, right side is values[1]
                this.openEnds.right = rightDomino.values[1];
            }
            
            // Special case: if left and right are the same domino (first domino)
            if (this.mainChain.length === 1) {
                const [a, b] = leftDomino.values;
                this.openEnds.left = a;
                this.openEnds.right = b;
            }
        }
        
        // Update spinner chain ends
        if (this.spinner) {
            // Top end
            if (this.topChain.length > 0) {
                const topDomino = this.topChain[this.topChain.length - 1];
                this.openEnds.top = topDomino.placement.exposedValue;
            } else {
                // No dominoes on top yet, so spinner value is exposed
                this.openEnds.top = this.spinner[0];
            }
            
            // Bottom end
            if (this.bottomChain.length > 0) {
                const bottomDomino = this.bottomChain[this.bottomChain.length - 1];
                this.openEnds.bottom = bottomDomino.placement.exposedValue;
            } else {
                // No dominoes on bottom yet, so spinner value is exposed
                this.openEnds.bottom = this.spinner[0];
            }
        } else {
            // No spinner, so no top/bottom ends
            this.openEnds.top = null;
            this.openEnds.bottom = null;
        }
    }

    /**
     * Get current open ends for scoring (All Fives)
     */
    getOpenEndValues() {
        const ends = [this.openEnds.left, this.openEnds.right];
        
        // Add spinner ends if spinner exists
        if (this.spinner) {
            ends.push(this.openEnds.top, this.openEnds.bottom);
        }
        
        return ends.filter(end => end !== null);
    }

    /**
     * Calculate All Fives score
     */
    calculateScore() {
        const endValues = this.getOpenEndValues();
        const sum = endValues.reduce((total, value) => total + value, 0);
        
        // Points awarded if sum is multiple of 5
        return (sum % 5 === 0 && sum > 0) ? sum : 0;
    }

    /**
     * Get available drop zones (where dominoes can be placed)
     */
    getDropZones() {
        const zones = [];
        
        // Main chain ends always available (unless blocked)
        if (this.openEnds.left !== null) {
            zones.push({ position: 'left', value: this.openEnds.left });
        }
        if (this.openEnds.right !== null) {
            zones.push({ position: 'right', value: this.openEnds.right });
        }
        
        // Spinner ends only if spinner exists and ends are available
        if (this.spinner) {
            if (this.openEnds.top !== null) {
                zones.push({ position: 'top', value: this.openEnds.top });
            }
            if (this.openEnds.bottom !== null) {
                zones.push({ position: 'bottom', value: this.openEnds.bottom });
            }
        }
        
        return zones;
    }

    /**
     * Get valid moves for a given hand of dominoes
     */
    getValidMoves(hand) {
        const moves = [];
        const dropZones = this.getDropZones();
        
        hand.forEach(domino => {
            const [a, b] = domino;
            
            dropZones.forEach(zone => {
                if (a === zone.value || b === zone.value) {
                    moves.push({
                        domino: domino,
                        position: zone.position,
                        matchingValue: zone.value,
                        connectingValue: a === zone.value ? a : b,
                        exposedValue: a === zone.value ? b : a
                    });
                }
            });
        });
        
        return moves;
    }

    /**
     * Get layout data for rendering
     */
    getLayoutData() {
        return {
            mainChain: [...this.mainChain],
            topChain: [...this.topChain],
            bottomChain: [...this.bottomChain],
            spinner: this.spinner,
            spinnerIndex: this.spinnerIndex,
            openEnds: { ...this.openEnds },
            dropZones: this.getDropZones(),
            score: this.calculateScore()
        };
    }

    /**
     * Helper to get index of last added domino
     */
    getLastAddedIndex(targetEnd) {
        switch (targetEnd) {
            case 'left': return 0;
            case 'right': return this.mainChain.length - 1;
            case 'top': return this.topChain.length - 1;
            case 'bottom': return this.bottomChain.length - 1;
            default: return -1;
        }
    }

    /**
     * Clear the board
     */
    clear() {
        this.mainChain = [];
        this.spinner = null;
        this.spinnerIndex = -1;
        this.topChain = [];
        this.bottomChain = [];
        this.openEnds = { left: null, right: null, top: null, bottom: null };
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.ProperDominoBoard = ProperDominoBoard;
}