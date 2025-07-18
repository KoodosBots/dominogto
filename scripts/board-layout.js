/**
 * Proper Domino Board Layout System
 * Based on actual domino game rules: line of play, spinners, open ends
 */

class DominoBoardLayout {
    constructor() {
        this.dominoes = []; // Array of placed dominoes in play order
        this.lineOfPlay = []; // The main line/chain of dominoes
        this.openEnds = []; // Current open ends where new dominoes can be placed
        this.spinnerArms = new Map(); // Track arms extending from spinners
        this.firstDouble = null; // Track the first double (main spinner)
        this.layout = new Map(); // Visual positioning for rendering
    }

    /**
     * Add a domino to the board following proper domino rules
     */
    addDomino(domino, targetEndValue = null) {
        const [a, b] = domino;
        const isDouble = a === b;

        if (this.dominoes.length === 0) {
            // First domino - start the line of play
            this.placeFirstDomino(domino);
        } else {
            // Find where this domino can legally connect
            const placement = this.findLegalPlacement(domino, targetEndValue);
            if (placement) {
                this.placeDomino(domino, placement);
            } else {
                throw new Error('Cannot place domino - no valid connections');
            }
        }

        this.dominoes.push(domino);
        this.updateOpenEnds();
        return this.getVisualLayout();
    }

    /**
     * Place the first domino - starts the line of play
     */
    placeFirstDomino(domino) {
        const [a, b] = domino;
        const isDouble = a === b;

        // First domino goes in center position (0,0)
        const dominoData = {
            domino: domino,
            position: { x: 0, y: 0 },
            orientation: isDouble ? 'double' : 'horizontal',
            isDouble: isDouble,
            connectedTo: null,
            connectionPoint: null,
            leftValue: isDouble ? a : a,
            rightValue: isDouble ? a : b,
            topValue: isDouble ? a : null,
            bottomValue: isDouble ? a : null
        };

        this.lineOfPlay.push(dominoData);
        this.layout.set('0,0', dominoData);

        // Set as first double if it's a double
        if (isDouble && !this.firstDouble) {
            this.firstDouble = dominoData;
        }

        // Initialize open ends
        if (isDouble) {
            this.openEnds = [
                { value: a, position: 'left', sourceId: '0,0' },
                { value: a, position: 'right', sourceId: '0,0' },
                { value: a, position: 'top', sourceId: '0,0' },
                { value: a, position: 'bottom', sourceId: '0,0' }
            ];
        } else {
            this.openEnds = [
                { value: a, position: 'left', sourceId: '0,0' },
                { value: b, position: 'right', sourceId: '0,0' }
            ];
        }
    }

    /**
     * Find legal placement for a domino based on open ends
     */
    findLegalPlacement(domino, targetEndValue = null) {
        const [a, b] = domino;
        
        // Check each open end for a matching connection
        for (const openEnd of this.openEnds) {
            const canConnect = (a === openEnd.value || b === openEnd.value);
            
            if (canConnect && (!targetEndValue || openEnd.value === targetEndValue)) {
                const connectingValue = a === openEnd.value ? a : b;
                const exposedValue = a === openEnd.value ? b : a;
                
                return {
                    openEnd: openEnd,
                    connectingValue: connectingValue,
                    exposedValue: exposedValue,
                    orientation: this.determineOrientation(domino, openEnd),
                    position: this.calculatePosition(openEnd)
                };
            }
        }
        
        return null;
    }

    /**
     * Determine orientation based on connection point and domino type
     */
    determineOrientation(domino, openEnd) {
        const [a, b] = domino;
        const isDouble = a === b;
        
        if (isDouble) {
            return 'vertical'; // Doubles are always placed vertically (perpendicular)
        }
        
        // Regular dominoes: orientation depends on connection direction
        if (openEnd.position === 'left' || openEnd.position === 'right') {
            return 'horizontal';
        } else { // top or bottom
            return 'vertical';
        }
    }

    /**
     * Calculate new position based on open end location
     */
    calculatePosition(openEnd) {
        const sourceDomino = this.layout.get(openEnd.sourceId);
        const baseX = sourceDomino.position.x;
        const baseY = sourceDomino.position.y;
        const sourceIsDouble = sourceDomino.isDouble;
        
        // For doubles (spinners), adjacent positions are directly touching
        // For regular dominoes, they connect end-to-end
        switch (openEnd.position) {
            case 'left':
                return { x: baseX - 1, y: baseY };
            case 'right':
                return { x: baseX + 1, y: baseY };
            case 'top':
                return { x: baseX, y: baseY - 1 };
            case 'bottom':
                return { x: baseX, y: baseY + 1 };
            default:
                return { x: baseX, y: baseY };
        }
    }

    /**
     * Place a domino at the calculated position
     */
    placeDomino(domino, placement) {
        const [a, b] = domino;
        const isDouble = a === b;
        const positionKey = `${placement.position.x},${placement.position.y}`;
        
        // Determine which value goes where based on connection
        let leftValue, rightValue, topValue, bottomValue;
        
        if (isDouble) {
            // Doubles have same value on all sides
            leftValue = rightValue = topValue = bottomValue = a;
        } else {
            // Regular dominoes: connecting value goes toward connection point
            const { connectingValue, exposedValue } = placement;
            
            if (placement.orientation === 'horizontal') {
                if (placement.openEnd.position === 'left') {
                    rightValue = connectingValue;
                    leftValue = exposedValue;
                } else { // right
                    leftValue = connectingValue;
                    rightValue = exposedValue;
                }
                topValue = bottomValue = null;
            } else { // vertical
                if (placement.openEnd.position === 'top') {
                    bottomValue = connectingValue;
                    topValue = exposedValue;
                } else { // bottom
                    topValue = connectingValue;
                    bottomValue = exposedValue;
                }
                leftValue = rightValue = null;
            }
        }

        const dominoData = {
            domino: domino,
            position: placement.position,
            orientation: placement.orientation,
            isDouble: isDouble,
            connectedTo: placement.openEnd.sourceId,
            connectionPoint: placement.openEnd.position,
            leftValue: leftValue,
            rightValue: rightValue,
            topValue: topValue,
            bottomValue: bottomValue
        };

        this.lineOfPlay.push(dominoData);
        this.layout.set(positionKey, dominoData);

        // Track first double as main spinner
        if (isDouble && !this.firstDouble) {
            this.firstDouble = dominoData;
        }
    }

    /**
     * Update open ends after placing a domino
     */
    updateOpenEnds() {
        this.openEnds = [];
        
        // Check all placed dominoes for open ends
        for (const [positionKey, dominoData] of this.layout) {
            const { position, leftValue, rightValue, topValue, bottomValue } = dominoData;
            
            // Check each direction for open connections
            if (leftValue !== null && !this.hasAdjacentDomino(position.x - 1, position.y)) {
                this.openEnds.push({
                    value: leftValue,
                    position: 'left',
                    sourceId: positionKey,
                    coord: { x: position.x - 1, y: position.y }
                });
            }
            
            if (rightValue !== null && !this.hasAdjacentDomino(position.x + 1, position.y)) {
                this.openEnds.push({
                    value: rightValue,
                    position: 'right',
                    sourceId: positionKey,
                    coord: { x: position.x + 1, y: position.y }
                });
            }
            
            if (topValue !== null && !this.hasAdjacentDomino(position.x, position.y - 1)) {
                this.openEnds.push({
                    value: topValue,
                    position: 'top',
                    sourceId: positionKey,
                    coord: { x: position.x, y: position.y - 1 }
                });
            }
            
            if (bottomValue !== null && !this.hasAdjacentDomino(position.x, position.y + 1)) {
                this.openEnds.push({
                    value: bottomValue,
                    position: 'bottom',
                    sourceId: positionKey,
                    coord: { x: position.x, y: position.y + 1 }
                });
            }
        }
    }

    /**
     * Check if there's a domino at the given position
     */
    hasAdjacentDomino(x, y) {
        return this.layout.has(`${x},${y}`);
    }

    /**
     * Get current open end values for scoring
     */
    getOpenEndValues() {
        return this.openEnds.map(end => end.value);
    }

    /**
     * Get visual layout data for rendering
     */
    getVisualLayout() {
        const dominoList = Array.from(this.layout.values());
        const bounds = this.calculateBounds();
        
        return {
            dominoes: dominoList,
            openEnds: this.openEnds,
            bounds: bounds,
            firstDouble: this.firstDouble,
            totalDominoes: this.dominoes.length
        };
    }

    /**
     * Calculate bounds for centering the display
     */
    calculateBounds() {
        if (this.layout.size === 0) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 1, height: 1 };
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const [key, data] of this.layout) {
            const { x, y } = data.position;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }

        return {
            minX, maxX, minY, maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }

    /**
     * Get available connections (for UI indicators)
     */
    getAvailableConnections() {
        return this.openEnds.map(end => ({
            x: end.coord.x,
            y: end.coord.y,
            value: end.value,
            direction: end.position,
            sourcePosition: end.sourceId
        }));
    }

    /**
     * Clear the board
     */
    clear() {
        this.dominoes = [];
        this.lineOfPlay = [];
        this.openEnds = [];
        this.spinnerArms.clear();
        this.firstDouble = null;
        this.layout.clear();
    }

    /**
     * Get board state for game logic compatibility
     */
    getBoardState() {
        return {
            dominoes: [...this.dominoes],
            layout: this.getVisualLayout(),
            ends: this.getOpenEndValues()
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DominoBoardLayout = DominoBoardLayout;
}