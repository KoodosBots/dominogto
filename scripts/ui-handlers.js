/**
 * UI Event Handlers and Display Updates - Clean Version
 * No pip rotation - all dominoes use consistent patterns
 */

// CONSISTENT DIMENSION CONSTANTS - Used across all calculations
const BOARD_CONSTANTS = {
    DOMINO_WIDTH: 200,        // Base domino width (matches CSS)
    DOMINO_HEIGHT: 100,       // Base domino height (matches CSS)
    DOMINO_GAP: 8,           // Gap between dominoes (matches CSS --domino-gap)
    CHAIN_SPACING: 105,      // Spacing between spinner and chains (matches CSS)
    CONTAINER_PADDING: 60,   // Conservative padding to prevent overflow
    MIN_SCALE: 0.4,          // Minimum scale to maintain visibility
    MAX_SCALE: 1.0           // Maximum scale (never scale up)
};

// Initialize gameState if it doesn't exist
if (typeof gameState === 'undefined') {
    window.gameState = {
        board: [],
        hand: [],
        yourScore: 0,
        opponentScore: 0,
        draws: 0,
        passes: 0,
        boneCount: 7,
        playerMode: '1v1',
        gameType: 'fives',
        scoreLimit: 100,
        boardLayout: null
    };
}

// Generate domino set (0-0 to 6-6) - needed for UI initialization
function generateDominoSet() {
    const dominoes = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            dominoes.push([i, j]);
        }
    }
    return dominoes;
}

// Shuffle array utility
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Get pip positions - SIMPLE VERSION (no rotation)
function getPipPositions(value) {
    const positions = {
        0: [], // blank
        1: [{ x: 50, y: 50 }], // center
        2: [{ x: 25, y: 25 }, { x: 75, y: 75 }], // diagonal
        3: [{ x: 25, y: 25 }, { x: 50, y: 50 }, { x: 75, y: 75 }], // diagonal line
        4: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 75 }, { x: 75, y: 75 }], // four corners
        5: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 50, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }], // four corners + center
        6: [{ x: 20, y: 25 }, { x: 50, y: 25 }, { x: 80, y: 25 }, { x: 20, y: 75 }, { x: 50, y: 75 }, { x: 80, y: 75 }] // two horizontal rows
    };

    return positions[value] || [];
}

// Create domino half - with optional rotation for doubles
function createDominoHalf(value, isVertical = false, context = 'default', scale = 1.0) {
    const half = document.createElement('div');
    half.className = 'domino-half';
    half.style.position = 'relative';
    half.style.background = '#f8f8f8';
    half.style.display = 'flex';
    half.style.alignItems = 'center';
    half.style.justifyContent = 'center';
    half.style.width = '100%';
    half.style.height = '100%';

    // Create SVG for precise pip positioning
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.setAttribute('viewBox', '0 0 100 100');

    // Get pip positions - rotate for vertical doubles with 6 pips
    let pipPositions = getPipPositions(value);
    
    // Only rotate doubles (including 6-pips) for board dominoes
    if (context === 'board' && value === 6) {
        if (isVertical) {
            pipPositions = [
                { x: 25, y: 20 }, { x: 75, y: 20 },
                { x: 25, y: 50 }, { x: 75, y: 50 },
                { x: 25, y: 80 }, { x: 75, y: 80 }
            ]; // vertical columns for vertical board dominoes
        } else {
            pipPositions = [
                { x: 20, y: 25 }, { x: 20, y: 75 },
                { x: 50, y: 25 }, { x: 50, y: 75 },
                { x: 80, y: 25 }, { x: 80, y: 75 }
            ]; // horizontal rows for horizontal board dominoes
        }
    }
    // For hand/selection dominoes, always use original vertical columns pattern
    else if (value === 6) {
        pipPositions = [
            { x: 25, y: 20 }, { x: 75, y: 20 },
            { x: 25, y: 50 }, { x: 75, y: 50 },
            { x: 25, y: 80 }, { x: 75, y: 80 }
        ]; // original 6-pip pattern for hand/selection (vertical columns)
    }

    pipPositions.forEach(pos => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pos.x);
        circle.setAttribute('cy', pos.y);
        // Fixed pip size - no scaling based on domino size
        const pipRadius = 6;
        circle.setAttribute('r', pipRadius);
        
        // Add 3D effect with gradient and shadow
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const radialGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        radialGradient.setAttribute('id', `pip-gradient-${Math.random().toString(36).substr(2, 9)}`);
        radialGradient.setAttribute('cx', '30%');
        radialGradient.setAttribute('cy', '30%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#666');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#000');
        
        radialGradient.appendChild(stop1);
        radialGradient.appendChild(stop2);
        gradient.appendChild(radialGradient);
        svg.appendChild(gradient);
        
        circle.setAttribute('fill', `url(#${radialGradient.getAttribute('id')})`);
        circle.setAttribute('filter', 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))');
        // This line is now handled above with gradient
        svg.appendChild(circle);
    });

    half.appendChild(svg);
    return half;
}

// Create selectable domino element - SIMPLE VERSION
function createSelectableDominoElement(domino) {
    const element = document.createElement('div');
    element.className = 'domino';
    element.dataset.top = domino[0];
    element.dataset.bottom = domino[1];

    element.onclick = () => {
        const selectedCount = document.querySelectorAll('.domino.selected').length;

        if (element.classList.contains('selected')) {
            element.classList.remove('selected');
        } else if (selectedCount < gameState.boneCount) {
            element.classList.add('selected');
        } else {
            showError(`You can only select ${gameState.boneCount} dominoes`);
        }

        updateSelectedCount();
    };

    const topHalf = createDominoHalf(domino[0], true, 'selection'); // vertical orientation for selection
    const divider = document.createElement('div');
    divider.className = 'domino-divider';
    const bottomHalf = createDominoHalf(domino[1], true, 'selection'); // vertical orientation for selection

    element.appendChild(topHalf);
    element.appendChild(divider);
    element.appendChild(bottomHalf);

    return element;
}

// Create hand domino element - SIMPLE VERSION
function createHandDominoElement(domino, index) {
    const element = document.createElement('div');
    element.className = 'hand-domino';
    element.draggable = true;
    element.dataset.dominoIndex = index;

    element.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ index: index, domino: domino }));
        element.classList.add('dragging');
    };

    element.ondragend = () => {
        element.classList.remove('dragging');
    };

    element.onclick = () => showAddToBoardModal(domino);

    const topHalf = createDominoHalf(domino[0], true, 'hand'); // vertical orientation for hand
    const divider = document.createElement('div');
    divider.className = 'domino-divider';
    const bottomHalf = createDominoHalf(domino[1], true, 'hand'); // vertical orientation for hand

    element.appendChild(topHalf);
    element.appendChild(divider);
    element.appendChild(bottomHalf);

    return element;
}

// Initialize domino selection interface
function initializeDominoSelection() {
    console.log('Initializing domino selection...');

    const dominoesGrid = document.getElementById('dominoesGrid');
    if (!dominoesGrid) {
        console.error('dominoesGrid element not found!');
        return;
    }

    console.log('Found dominoesGrid element:', dominoesGrid);

    dominoesGrid.innerHTML = '';

    const allDominoes = generateDominoSet();
    console.log('Generated dominoes:', allDominoes.length, 'dominoes');

    allDominoes.forEach((domino, index) => {
        console.log(`Creating domino ${index + 1}:`, domino);
        const element = createSelectableDominoElement(domino);
        dominoesGrid.appendChild(element);
    });

    console.log('Domino selection initialized with', allDominoes.length, 'dominoes');
    updateSelectedCount();
}

// Update selected count display
function updateSelectedCount() {
    const selectedCount = document.querySelectorAll('.domino.selected').length;
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
        countElement.textContent = `Selected: ${selectedCount}/${gameState.boneCount}`;
    }
}

// Random hand generator
function generateRandomHand() {
    document.querySelectorAll('.domino.selected').forEach(domino => {
        domino.classList.remove('selected');
    });

    const allDominoes = Array.from(document.querySelectorAll('.domino'));
    const shuffled = shuffleArray(allDominoes);

    for (let i = 0; i < gameState.boneCount && i < shuffled.length; i++) {
        shuffled[i].classList.add('selected');
    }

    updateSelectedCount();
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
}

// Modal functions
function showAddToBoardModal(selectedDomino = null) {
    console.log('showAddToBoardModal called with:', selectedDomino);
    console.log('Current gameState.hand:', gameState.hand);
    
    const modal = document.getElementById('addToBoardModal');
    const modalDominoes = document.getElementById('modalDominoes');

    if (!modal || !modalDominoes) {
        console.error('Modal elements not found!', { modal: !!modal, modalDominoes: !!modalDominoes });
        return;
    }

    modalDominoes.innerHTML = '';

    let dominoesToShow;

    if (selectedDomino) {
        dominoesToShow = [selectedDomino];
    } else {
        // For testing/setup purposes, show all dominoes not on board
        const allDominoes = generateDominoSet();
        const playedDominoes = gameState.board || [];

        dominoesToShow = allDominoes.filter(domino => {
            const onBoard = playedDominoes.some(boardDomino =>
                boardDomino[0] === domino[0] && boardDomino[1] === domino[1]
            );
            return !onBoard;
        });
        
        console.log('Showing all remaining dominoes for placement:', dominoesToShow.length, 'available');
    }

    console.log('Dominoes to show in modal:', dominoesToShow);
    
    if (dominoesToShow.length === 0) {
        modalDominoes.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No dominoes available to add.</p>';
    } else {
        dominoesToShow.forEach(domino => {
            const element = createSelectableDominoElement(domino);

            element.draggable = true;
            element.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ domino: domino }));
                element.classList.add('dragging');
            };
            element.ondragend = () => {
                element.classList.remove('dragging');
            };

            element.onclick = () => {
                try {
                    console.log('Adding domino to board from modal:', domino);
                    addDominoToBoard(domino);
                    modal.style.display = 'none';
                } catch (error) {
                    console.error('Failed to add domino to board:', error);
                    showError(error.message || 'Cannot place domino on board');
                    // Keep modal open so user can try again
                }
            };
            modalDominoes.appendChild(element);
        });
    }

    modal.style.display = 'flex';
}

// Game setup handlers
function updateGameSetup() {
    const gameTypeEl = document.getElementById('gameType');
    const scoreLimitEl = document.getElementById('scoreLimit');
    const boneCountEl = document.getElementById('boneCount');
    const playerModeEl = document.getElementById('playerMode');

    if (gameTypeEl) gameState.gameType = gameTypeEl.value;
    if (scoreLimitEl) gameState.scoreLimit = parseInt(scoreLimitEl.value);
    if (boneCountEl) gameState.boneCount = parseInt(boneCountEl.value);
    if (playerModeEl) gameState.playerMode = playerModeEl.value;

    updateSelectedCount();
    initializeDominoSelection();
}

// Note: startGame() is implemented in game-logic.js

// Update all game displays
function updateGameDisplay() {
    updateBoardDisplay();
    updateHandDisplay();
    updateScoreDisplay();
    updateStatsDisplay();
}

// Update hand display
function updateHandDisplay() {
    const handDisplay = document.getElementById('myHandDisplay');
    if (!handDisplay) {
        console.error('myHandDisplay element not found!');
        return;
    }

    console.log('Updating hand display with:', gameState.hand);
    handDisplay.innerHTML = '';

    if (!gameState.hand || gameState.hand.length === 0) {
        handDisplay.innerHTML = '<p style="color: #666;">No dominoes in hand</p>';
        return;
    }

    gameState.hand.forEach((domino, index) => {
        const dominoElement = createHandDominoElement(domino, index);
        handDisplay.appendChild(dominoElement);
    });

    console.log('Hand display updated with', gameState.hand.length, 'dominoes');
}

// Update board display
function updateBoardDisplay() {
    const boardDisplay = document.getElementById('boardDisplay');
    if (!boardDisplay) return;

    if (!gameState.boardLayout || gameState.board.length === 0) {
        boardDisplay.innerHTML = '<p style="color: #666;">No dominoes played yet. Drag from your hand or click \'Add to Board\'.</p>';
        return;
    }

    const layoutData = gameState.boardLayout.getLayoutData();
    renderProperBoardLayout(boardDisplay, layoutData);
}

// Update score display
function updateScoreDisplay() {
    const yourScoreElement = document.getElementById('yourScore');
    const opponentScoreElement = document.getElementById('opponentScore');

    if (yourScoreElement) yourScoreElement.textContent = gameState.yourScore;
    if (opponentScoreElement) opponentScoreElement.textContent = gameState.opponentScore;

    updateOpenEndsDisplay();
}

// Update open ends display
function updateOpenEndsDisplay() {
    const openEndsSumElement = document.getElementById('openEndsSum');
    const openEndsDetailElement = document.getElementById('openEndsDetail');
    const openEndsCard = document.getElementById('openEndsCard');

    if (!openEndsSumElement || !gameState.boardLayout) return;

    const openEndValues = gameState.boardLayout.getOpenEndValues();
    const sum = openEndValues.reduce((total, value) => total + value, 0);
    const isScoring = sum % 5 === 0 && sum > 0;

    openEndsSumElement.textContent = sum;

    if (openEndValues.length > 0) {
        openEndsDetailElement.textContent = `[${openEndValues.join(' + ')}]`;
    } else {
        openEndsDetailElement.textContent = 'No dominoes played';
    }

    if (isScoring) {
        openEndsCard.classList.add('scoring');
        openEndsDetailElement.textContent += ` = ${sum} Points!`;
    } else {
        openEndsCard.classList.remove('scoring');
    }
}

// Update stats display
function updateStatsDisplay() {
    const totalDominoes = 28;
    const playedCount = gameState.board.length;
    const playerCount = gameState.playerMode === '1v1' ? 2 : 4;
    const initialHandSize = gameState.boneCount;

    const totalInInitialHands = initialHandSize * playerCount;
    const remainingInBoneyard = totalDominoes - totalInInitialHands - gameState.draws;

    const remainingBonesEl = document.getElementById('remainingBones');
    const playedBonesEl = document.getElementById('playedBones');
    const drawsAndPassesEl = document.getElementById('drawsAndPasses');

    if (remainingBonesEl) remainingBonesEl.textContent = Math.max(0, remainingInBoneyard);
    if (playedBonesEl) playedBonesEl.textContent = playedCount;
    if (drawsAndPassesEl) drawsAndPassesEl.textContent = `${gameState.draws}/${gameState.passes}`;
}

// Note: The following functions are implemented in other files:
// - startGame() -> game-logic.js
// - analyzePosition() -> analysis-service.js  
// - endRound() -> game-logic.js
// - passTurn() -> game-logic.js
// - drawDomino() -> game-logic.js
// - simulateOpponentMove() -> game-logic.js
// - resetGame() -> game-logic.js
// - addDominoToBoard() -> game-logic.js
// - removeFromBoard() -> game-logic.js
// - logout() -> supabase-client.js
// - submitAuth() -> supabase-client.js
// - toggleAuthMode() -> supabase-client.js

// Initialize UI event listeners
function initializeUI() {
    console.log('Initializing UI...');

    // Show the game setup section
    const setupScreen = document.getElementById('setupScreen');
    if (setupScreen) {
        setupScreen.style.display = 'block';
        console.log('Game setup screen shown');
    }

    // Hide auth section (assuming user is logged in for testing)
    const authSection = document.getElementById('authSection');
    if (authSection) {
        authSection.style.display = 'none';
    }

    // Setup drag and drop for board
    setupBoardDragDrop();

    // Initialize domino selection
    initializeDominoSelection();

    // Setup game configuration listeners
    ['gameType', 'scoreLimit', 'boneCount', 'playerMode'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateGameSetup);
        }
    });

    console.log('UI initialized successfully');
}

// Modal close handler
window.onclick = function (event) {
    const modal = document.getElementById('addToBoardModal');
    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
};

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing UI...');
    // Small delay to ensure CSS is loaded
    setTimeout(() => {
        initializeUI();
    }, 100);
});

// Board rendering functions (needed for updateBoardDisplay)
function renderProperBoardLayout(container, layoutData) {
    container.innerHTML = '';

    // Create board game container that will be scaled as a unit
    const gameContainer = document.createElement('div');
    gameContainer.className = 'domino-game-container';
    
    // Calculate container scaling based on viewport and content
    const containerScale = calculateContainerScale(container, layoutData);
    
    // Apply transform scaling to entire container
    gameContainer.style.transform = `scale(${containerScale})`;
    gameContainer.style.transformOrigin = 'center center';
    
    // Set fixed properties for consistent layout
    gameContainer.style.setProperty('--domino-gap', '8px');
    gameContainer.style.setProperty('--chain-spacing', '105px');

    // Create main horizontal chain - now just for positioning spinner chains
    const mainChain = document.createElement('div');
    mainChain.className = 'main-chain';

    // Track spinner element for positioning
    let spinnerElement = null;

    layoutData.mainChain.forEach((dominoData, index) => {
        // Determine if this is left or right side of main chain
        const side = index < layoutData.spinnerIndex ? 'left' : 
                     index > layoutData.spinnerIndex ? 'right' : 'spinner';
        
        console.log(`=== MAIN CHAIN ASSIGNMENT ===`);
        console.log(`Domino: [${dominoData.values[0]}|${dominoData.values[1]}]`);
        console.log(`Index: ${index}, SpinnerIndex: ${layoutData.spinnerIndex}`);
        console.log(`Assigned to: ${side}`);
        console.log(`Is Spinner: ${dominoData.isSpinner}`);
        console.log(`=== END MAIN CHAIN ===\n`);
        
        const element = createProperDominoElement(dominoData, side);
        mainChain.appendChild(element);

        if (dominoData.isSpinner) {
            spinnerElement = element;
            element.setAttribute('data-spinner', 'true');
        }
    });

    // Add main chain to game container
    gameContainer.appendChild(mainChain);

    // Add spinner chains after main chain is in DOM
    if (layoutData.spinner && spinnerElement) {
        console.log('=== SPINNER CHAINS CREATION ===');
        console.log('Spinner exists:', !!layoutData.spinner);
        console.log('Spinner element:', spinnerElement);
        console.log('Top chain length:', layoutData.topChain.length);
        console.log('Bottom chain length:', layoutData.bottomChain.length);
        console.log('=== END SPINNER CHAINS ===\n');
        
        setTimeout(() => {
            addSpinnerChains(gameContainer, spinnerElement, layoutData);
        }, 0);
    } else {
        console.log('=== NO SPINNER CHAINS ===');
        console.log('Spinner:', layoutData.spinner);
        console.log('Spinner element:', spinnerElement);
        console.log('=== END NO SPINNER ===\n');
    }

    // Add drop zones to game container
    renderDropZones(gameContainer, layoutData.dropZones);
    
    // Add the scaled game container to the main container
    container.appendChild(gameContainer);
}

// Calculate container scaling based on viewport and content size
function calculateContainerScale(container, layoutData) {
    // Get available viewport space with conservative padding
    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - BOARD_CONSTANTS.CONTAINER_PADDING;
    const availableHeight = containerRect.height - BOARD_CONSTANTS.CONTAINER_PADDING;
    
    console.log('=== SCALING CALCULATION ===');
    console.log('Available space:', { width: availableWidth, height: availableHeight });
    
    // Calculate required space for board content using consistent constants
    const mainChainLength = layoutData.mainChain ? layoutData.mainChain.length : 0;
    const topChainLength = layoutData.topChain ? layoutData.topChain.length : 0;
    const bottomChainLength = layoutData.bottomChain ? layoutData.bottomChain.length : 0;
    
    console.log('Chain lengths:', { main: mainChainLength, top: topChainLength, bottom: bottomChainLength });
    
    // Calculate required dimensions using accurate constants
    const requiredWidth = (mainChainLength * BOARD_CONSTANTS.DOMINO_WIDTH) + 
                         ((mainChainLength - 1) * BOARD_CONSTANTS.DOMINO_GAP);
    
    const requiredHeight = BOARD_CONSTANTS.DOMINO_HEIGHT + // Main chain height
                          (topChainLength > 0 ? (topChainLength * BOARD_CONSTANTS.DOMINO_HEIGHT) + 
                           ((topChainLength - 1) * BOARD_CONSTANTS.DOMINO_GAP) + BOARD_CONSTANTS.CHAIN_SPACING : 0) +
                          (bottomChainLength > 0 ? (bottomChainLength * BOARD_CONSTANTS.DOMINO_HEIGHT) + 
                           ((bottomChainLength - 1) * BOARD_CONSTANTS.DOMINO_GAP) + BOARD_CONSTANTS.CHAIN_SPACING : 0);
    
    console.log('Required dimensions:', { width: requiredWidth, height: requiredHeight });
    
    // Calculate scale to fit both dimensions
    const scaleX = requiredWidth > 0 ? availableWidth / requiredWidth : 1;
    const scaleY = requiredHeight > 0 ? availableHeight / requiredHeight : 1;
    
    console.log('Individual scales:', { scaleX, scaleY });
    
    // Use the smaller scale to ensure everything fits, with bounds
    const calculatedScale = Math.min(scaleX, scaleY, BOARD_CONSTANTS.MAX_SCALE);
    const finalScale = Math.max(BOARD_CONSTANTS.MIN_SCALE, calculatedScale);
    
    console.log('Final scale:', finalScale);
    console.log('=== END SCALING ===\n');
    
    return finalScale;
}

// Create proper domino element for board - SIMPLE VERSION (no pip rotation)
function createProperDominoElement(dominoData, chain = 'main') {
    const { values, isSpinner, orientation, placement } = dominoData;
    let [a, b] = values;
    const isDouble = a === b;

    // Clear orientation logic: position connecting pip adjacent to connection point
    if (placement) {
        const connectingValue = placement.connectingValue;
        
        // For each chain, we need the connecting pip in a specific position
        let needConnectingAtA = false; // true if connecting pip should be at position a
        let needConnectingAtB = false; // true if connecting pip should be at position b
        
        if (chain === 'top') {
            // Top chain: horizontal dominoes extending upward, connecting pip should be at BOTTOM (position B/right)
            needConnectingAtB = true;
        } else if (chain === 'bottom') {
            // Bottom chain: horizontal dominoes extending downward, connecting pip should be at TOP (position A/left)
            needConnectingAtA = true;
        } else if (chain === 'left') {
            // Left side: vertical dominoes extending leftward, connecting pip should be at RIGHT (position B/bottom)
            needConnectingAtB = true;
        } else if (chain === 'right') {
            // Right side: vertical dominoes extending rightward, connecting pip should be at LEFT (position A/top)
            needConnectingAtA = true;
        }
        
        // Now check if we need to swap
        const connectingCurrentlyAtA = (a === connectingValue);
        const connectingCurrentlyAtB = (b === connectingValue);
        
        if (needConnectingAtA && connectingCurrentlyAtB) {
            // Need connecting at A, but it's at B → swap
            [a, b] = [b, a];
        } else if (needConnectingAtB && connectingCurrentlyAtA) {
            // Need connecting at B, but it's at A → swap
            [a, b] = [b, a];
        }
        // If connecting pip is already in the right position, no swap needed
    }

    // Comprehensive debug logging
    if (placement) {
        console.log(`=== DOMINO PLACEMENT DEBUG ===`);
        console.log(`Original domino: [${values[0]}|${values[1]}]`);
        console.log(`Chain: ${chain}`);
        console.log(`Connecting value: ${placement.connectingValue}`);
        console.log(`Exposed value: ${placement.exposedValue}`);
        console.log(`Placement flipped: ${placement.flipped}`);
        console.log(`Before orientation logic: a=${a}, b=${b}`);
        
        // Log the orientation requirements
        const isVerticalDomino = isDouble || orientation === 'vertical';
        console.log(`Is vertical domino: ${isVerticalDomino}`);
        console.log(`Orientation property: ${orientation}`);
        
        // Log the positioning logic
        console.log(`Position A will be: ${isVerticalDomino ? 'TOP' : 'LEFT'}`);
        console.log(`Position B will be: ${isVerticalDomino ? 'BOTTOM' : 'RIGHT'}`);
        
        // Log final result
        console.log(`Final result: [${a}|${b}]`);
        console.log(`Position A (${isVerticalDomino ? 'TOP' : 'LEFT'}): ${a}`);
        console.log(`Position B (${isVerticalDomino ? 'BOTTOM' : 'RIGHT'}): ${b}`);
        console.log(`=== END DEBUG ===\n`);
    }

    const element = document.createElement('div');
    element.className = 'board-domino';

    if (isSpinner) {
        element.classList.add('spinner');
    }

    // Set domino size and orientation based on chain position
    let isVerticalDomino = false;
    
    if (chain === 'top' || chain === 'bottom') {
        // Top/bottom chains: regular dominoes are vertical, doubles are horizontal
        isVerticalDomino = !isDouble; // Doubles are horizontal, regulars are vertical
    } else if (chain === 'left' || chain === 'right' || chain === 'spinner') {
        // Left/right/spinner chains: use horizontal dominoes
        isVerticalDomino = isDouble; // Only doubles are vertical
    } else {
        // Main chain: horizontal dominoes
        isVerticalDomino = isDouble; // Only doubles are vertical
    }
    
    // Calculate dynamic scaling based on total dominoes on board
    const scale = 1.0; // Use base scale for hand dominoes
    const baseWidth = isVerticalDomino ? 100 : 200;  // Starting size: 200x100px horizontal, 100x200px vertical
    const baseHeight = isVerticalDomino ? 200 : 100;
    
    if (isVerticalDomino) {
        element.style.width = `${baseWidth * scale}px`;
        element.style.height = `${baseHeight * scale}px`;
        element.style.flexDirection = 'column';
    } else {
        element.style.width = `${baseWidth * scale}px`;
        element.style.height = `${baseHeight * scale}px`;
        element.style.flexDirection = 'row';
    }

    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'space-between';
    element.style.background = '#f8f8f8';
    element.style.border = '2px solid #555';
    element.style.borderRadius = '6px';
    const scaledPadding = Math.max(2, 6 * scale);
    element.style.padding = `${scaledPadding}px`;
    element.style.margin = '0';
    element.style.boxSizing = 'border-box';
    element.style.cursor = 'pointer';

    // Create domino halves - pass isVertical for doubles and context for board
    const firstHalf = createDominoHalf(a, isVerticalDomino, 'board', scale);
    const divider = document.createElement('div');
    divider.className = 'domino-divider';

    const dividerThickness = Math.max(1, 2 * scale);
    if (isVerticalDomino) {
        divider.style.width = '90%';
        divider.style.height = `${dividerThickness}px`;
    } else {
        divider.style.width = `${dividerThickness}px`;
        divider.style.height = '90%';
    }
    divider.style.background = '#333';

    const secondHalf = createDominoHalf(b, isVerticalDomino, 'board', scale);

    element.appendChild(firstHalf);
    element.appendChild(divider);
    element.appendChild(secondHalf);

    element.onclick = () => removeFromBoard(values);

    // Add drag-over effects for better UX
    element.ondragover = (e) => {
        e.preventDefault();
        element.classList.add('drag-target');
    };

    element.ondragleave = () => {
        element.classList.remove('drag-target');
    };

    element.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove('drag-target');
        
        // Let the drop zone handle the actual drop logic
        // This is just for visual feedback
    };

    return element;
}

// Add spinner chains positioned relative to the spinner domino
function addSpinnerChains(container, spinnerElement, layoutData) {
    console.log('=== ADDING SPINNER CHAINS ===');
    console.log('Board container:', container);
    console.log('Spinner element:', spinnerElement);
    
    const spinnerChains = document.createElement('div');
    spinnerChains.className = 'spinner-chains';

    const mainChain = container.querySelector('.main-chain');
    console.log('Main chain found:', !!mainChain);
    
    if (!mainChain) {
        console.error('No main chain found!');
        return;
    }

    // Position spinner chains using consistent constants (matches scaling calculation)
    const spinnerIndex = layoutData.spinnerIndex;
    const totalDominoes = layoutData.mainChain.length;
    
    // Calculate position using same constants as scaling
    const totalWidth = (totalDominoes * BOARD_CONSTANTS.DOMINO_WIDTH) + 
                      ((totalDominoes - 1) * BOARD_CONSTANTS.DOMINO_GAP);
    const spinnerOffset = (spinnerIndex * BOARD_CONSTANTS.DOMINO_WIDTH) + 
                         (spinnerIndex * BOARD_CONSTANTS.DOMINO_GAP) + 
                         (BOARD_CONSTANTS.DOMINO_WIDTH / 2);
    const relativeLeft = (spinnerOffset / totalWidth) * 100;
    
    console.log('=== SPINNER POSITIONING ===');
    console.log('Spinner index:', spinnerIndex, 'of', totalDominoes);
    console.log('Using constants:', {
        dominoWidth: BOARD_CONSTANTS.DOMINO_WIDTH,
        gap: BOARD_CONSTANTS.DOMINO_GAP
    });
    console.log('Calculations:', {
        totalWidth,
        spinnerOffset,
        relativeLeft: relativeLeft + '%'
    });
    console.log('=== END SPINNER POSITIONING ===\n');
    
    spinnerChains.style.position = 'absolute';
    spinnerChains.style.left = relativeLeft + '%';
    spinnerChains.style.top = '50%'; // Center vertically on main chain
    spinnerChains.style.transform = 'translate(-50%, -50%)';

    // Top chain
    if (layoutData.topChain.length > 0) {
        console.log('Creating top chain with', layoutData.topChain.length, 'dominoes');
        const topChain = document.createElement('div');
        topChain.className = 'top-chain';

        layoutData.topChain.forEach((dominoData, index) => {
            console.log(`=== TOP CHAIN ASSIGNMENT ===`);
            console.log(`Domino: [${dominoData.values[0]}|${dominoData.values[1]}]`);
            console.log(`Index in top chain: ${index}`);
            console.log(`Orientation: ${dominoData.orientation}`);
            console.log(`=== END TOP CHAIN ===\n`);
            
            const element = createProperDominoElement(dominoData, 'top');
            console.log('Created top chain element:', element);
            topChain.appendChild(element);
        });

        spinnerChains.appendChild(topChain);
        console.log('Added top chain to spinner chains');
    } else {
        console.log('No top chain dominoes to add');
    }

    // Bottom chain
    if (layoutData.bottomChain.length > 0) {
        console.log('Creating bottom chain with', layoutData.bottomChain.length, 'dominoes');
        const bottomChain = document.createElement('div');
        bottomChain.className = 'bottom-chain';

        layoutData.bottomChain.forEach((dominoData, index) => {
            console.log(`=== BOTTOM CHAIN ASSIGNMENT ===`);
            console.log(`Domino: [${dominoData.values[0]}|${dominoData.values[1]}]`);
            console.log(`Index in bottom chain: ${index}`);
            console.log(`Orientation: ${dominoData.orientation}`);
            console.log(`=== END BOTTOM CHAIN ===\n`);
            
            const element = createProperDominoElement(dominoData, 'bottom');
            console.log('Created bottom chain element:', element);
            bottomChain.appendChild(element);
        });

        spinnerChains.appendChild(bottomChain);
        console.log('Added bottom chain to spinner chains');
    } else {
        console.log('No bottom chain dominoes to add');
    }

    container.appendChild(spinnerChains);
    console.log('Added spinner chains to board container');
    console.log('=== END ADDING SPINNER CHAINS ===\n');
}

// Render drop zones with dynamic positioning based on actual chain endpoints
function renderDropZones(container, dropZones) {
    const dropZonesContainer = document.createElement('div');
    dropZonesContainer.className = 'drop-zones-container';

    // Calculate dynamic positions after DOM elements are in place
    setTimeout(() => {
        calculateDropZonePositions(container, dropZones, dropZonesContainer);
    }, 10);

    dropZones.forEach(zone => {
        const dropZone = document.createElement('div');
        dropZone.className = `drop-zone ${zone.position}`;
        dropZone.textContent = zone.value;
        dropZone.title = `Connect ${zone.value} here`;
        dropZone.style.position = 'absolute'; // Ensure absolute positioning

        // Add drag and drop support to drop zones
        dropZone.ondragover = (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        };

        dropZone.ondragleave = () => {
            dropZone.classList.remove('drag-over');
        };

        dropZone.ondrop = (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent board drop handler from firing
            dropZone.classList.remove('drag-over');

            const dragDataText = e.dataTransfer.getData('text/plain');
            let domino = null;

            try {
                const dragData = JSON.parse(dragDataText);
                domino = dragData.domino;
            } catch (error) {
                const dominoIndex = parseInt(dragDataText);
                if (!isNaN(dominoIndex) && gameState.hand[dominoIndex]) {
                    domino = gameState.hand[dominoIndex];
                }
            }

            if (domino) {
                try {
                    console.log(`Dropping domino [${domino[0]}|${domino[1]}] on ${zone.position} end (requires ${zone.value})`);
                    addDominoToBoard(domino, zone.position);
                } catch (error) {
                    console.error('Failed to add domino to board:', error);
                    showError(error.message || 'Cannot place domino at this position');
                }
            }
        };

        dropZone.onclick = () => {
            showPlayableHand(zone.value, zone.position);
        };

        dropZonesContainer.appendChild(dropZone);
    });

    container.appendChild(dropZonesContainer);
}

// Calculate dynamic drop zone positions using logical layout (works with scaling)
function calculateDropZonePositions(container, dropZones, dropZonesContainer) {
    console.log('=== CALCULATING DROP ZONE POSITIONS (LOGICAL) ===');
    
    // Use CSS positioning instead of getBoundingClientRect to work with scaling
    dropZones.forEach((zone, index) => {
        const dropZone = dropZonesContainer.children[index];
        if (!dropZone) return;
        
        // Position drop zones using CSS instead of calculated coordinates
        // This works properly with container scaling
        switch (zone.position) {
            case 'left':
                dropZone.style.left = '20px';
                dropZone.style.top = '50%';
                dropZone.style.transform = 'translateY(-50%)';
                break;
                
            case 'right':
                dropZone.style.right = '20px';
                dropZone.style.top = '50%';
                dropZone.style.transform = 'translateY(-50%)';
                dropZone.style.left = 'auto'; // Clear left positioning
                break;
                
            case 'top':
                dropZone.style.left = '50%';
                dropZone.style.top = '20px';
                dropZone.style.transform = 'translateX(-50%)';
                break;
                
            case 'bottom':
                dropZone.style.left = '50%';
                dropZone.style.bottom = '20px';
                dropZone.style.top = 'auto'; // Clear top positioning
                dropZone.style.transform = 'translateX(-50%)';
                break;
        }
        
        console.log(`Drop zone ${zone.position} positioned using CSS layout`);
    });
    
    console.log('=== END DROP ZONE POSITIONING ===\n');
}

// Setup drag and drop for board
function setupBoardDragDrop() {
    const boardDisplay = document.getElementById('boardDisplay');
    if (!boardDisplay) {
        console.log('Board display not found, drag and drop setup skipped');
        return;
    }

    console.log('Setting up board drag and drop...');

    boardDisplay.ondragover = (e) => {
        e.preventDefault();
        boardDisplay.classList.add('drag-over');
    };

    boardDisplay.ondragleave = () => {
        boardDisplay.classList.remove('drag-over');
    };

    boardDisplay.ondrop = (e) => {
        e.preventDefault();
        boardDisplay.classList.remove('drag-over');

        const dragDataText = e.dataTransfer.getData('text/plain');
        let domino = null;

        try {
            // Try to parse as JSON first (new format)
            const dragData = JSON.parse(dragDataText);
            domino = dragData.domino;
        } catch (error) {
            // Fallback to old format for compatibility
            const dominoIndex = parseInt(dragDataText);
            if (!isNaN(dominoIndex) && gameState.hand[dominoIndex]) {
                domino = gameState.hand[dominoIndex];
            }
        }

        if (domino) {
            try {
                console.log('Dropping domino on board:', domino);
                addDominoToBoard(domino);
            } catch (error) {
                console.error('Failed to add domino to board:', error);
                showError(error.message || 'Cannot place domino at this position');
            }
        } else {
            console.error('No valid domino data found in drop');
        }
    };

    console.log('Board drag and drop setup complete');
}

// Show playable hand for connection value
function showPlayableHand(connectionValue, targetPosition = null) {
    const playableDominoes = gameState.hand.filter(domino =>
        domino[0] === connectionValue || domino[1] === connectionValue
    );

    if (playableDominoes.length > 0) {
        showAddToBoardModal();
        const modalDominoes = document.getElementById('modalDominoes');
        modalDominoes.innerHTML = '';

        playableDominoes.forEach(domino => {
            const element = createSelectableDominoElement(domino);
            element.onclick = () => {
                try {
                    console.log(`Adding playable domino [${domino[0]}|${domino[1]}] to position:`, targetPosition);
                    if (targetPosition) {
                        addDominoToBoard(domino, targetPosition);
                    } else {
                        addDominoToBoard(domino);
                    }
                    document.getElementById('addToBoardModal').style.display = 'none';
                } catch (error) {
                    console.error('Failed to add playable domino to board:', error);
                    showError(error.message || 'Cannot place domino at this position');
                    // Keep modal open so user can try again
                }
            };
            modalDominoes.appendChild(element);
        });
    }
}