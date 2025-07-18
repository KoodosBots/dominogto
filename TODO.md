# Domino GTO - Development TODO

## Core GTO Analysis System Implementation

### Phase 1: Position Analysis Foundation
- [ ] **Implement Board Normalization**
  - Create `normalizeBoard()` function to handle board symmetries
  - Sort domino placements to create canonical representation
  - Handle different board orientations consistently

- [ ] **Position Hashing System**
  ```javascript
  function hashPosition(board, currentPlayer) {
    // Normalize board representation
    // Sort to handle symmetries
    return crypto.createHash('sha256')
      .update(JSON.stringify({board: normalizeBoard(board), player: currentPlayer}))
      .digest('hex');
  }
  ```
  - Implement SHA-256 position hashing
  - Include current player in hash calculation
  - Ensure consistent hashing across game sessions

### Phase 2: Caching Infrastructure
- [ ] **Analysis Cache System**
  - Create `checkCache(positionHash, maxDepth)` function
  - Implement local storage for position cache
  - Add cache expiration and cleanup logic
  - Index cached positions by hash and depth

- [ ] **Cache Storage Functions**
  - Implement `storeAnalysis(positionHash, analysis, maxDepth)`
  - Design efficient cache data structure
  - Add cache size limits and LRU eviction
  - Persist cache between browser sessions

### Phase 3: Tiered Analysis Engine
- [ ] **Multi-Tier Analysis System**
  ```javascript
  async function analyzePosition(gameState, tier) {
    const maxDepth = {free: 2, basic: 5, pro: 10}[tier];
    const positionHash = hashPosition(gameState.board, gameState.currentPlayer);
    
    // Check cache first
    const cached = await checkCache(positionHash, maxDepth);
    if (cached) return cached;
    
    // Run new analysis
    const analysis = await runLookahead(gameState, maxDepth);
    
    // Store for future use
    await storeAnalysis(positionHash, analysis, maxDepth);
    
    return analysis;
  }
  ```
  - Implement tier-based depth limits (free: 2, basic: 5, pro: 10)
  - Create user tier management system
  - Add subscription/payment tier validation

### Phase 4: Lookahead Algorithm
- [ ] **Core Lookahead Engine**
  - Implement `runLookahead(gameState, maxDepth)` function
  - Create minimax algorithm for domino positions
  - Add alpha-beta pruning for performance
  - Handle different game types (fives, draw, block)

- [ ] **Position Evaluation**
  - Design evaluation function for domino positions
  - Consider hand strength, board control, scoring potential
  - Weight factors based on game type and stage
  - Include probabilistic opponent modeling

### Phase 5: Move Generation & Validation
- [ ] **Legal Move Generation**
  - Generate all possible domino placements
  - Validate moves against current board state
  - Handle spinner and non-spinner placements
  - Consider forced plays and blocking moves

- [ ] **Move Ordering**
  - Implement move ordering for better pruning
  - Prioritize high-scoring moves in fives
  - Consider defensive moves and hand management
  - Add transposition table for repeated positions

### Phase 6: Game-Specific Logic
- [ ] **Fives Game Analysis**
  - Implement scoring end calculation
  - Optimize for multiple-of-5 scoring opportunities
  - Consider defensive play to prevent opponent scoring
  - Balance offense vs. defense based on score differential

- [ ] **Draw/Block Game Analysis**
  - Focus on hand management and blocking
  - Calculate domino distribution probabilities
  - Optimize for going out quickly
  - Consider suit control and blocking opportunities

### Phase 7: Integration with Existing UI
- [ ] **Replace Current Analysis Function**
  - Update `analyzePosition()` call in gto.html:1268
  - Remove Supabase Edge Function dependency
  - Integrate with local GTO analysis engine
  - Maintain existing UI display format

- [ ] **Add Tier Selection UI**
  - Create tier selection dropdown/buttons
  - Show analysis depth and time estimates
  - Add upgrade prompts for higher tiers
  - Display cached vs. fresh analysis indicators

### Phase 8: Performance Optimization
- [ ] **Web Worker Implementation**
  - Move analysis to Web Worker for non-blocking UI
  - Implement progress callbacks for long analyses
  - Add analysis cancellation capability
  - Handle worker communication and error handling

- [ ] **Algorithm Optimization**
  - Profile and optimize critical paths
  - Implement iterative deepening
  - Add time-based analysis limits
  - Optimize memory usage for large searches

### Phase 9: Training Data Collection
- [ ] **Position Database**
  - Store analyzed positions for training
  - Collect user feedback on analysis quality
  - Build opening book from strong play
  - Create endgame tablebase for perfect play

- [ ] **Machine Learning Integration**
  - Train neural networks on collected data
  - Implement MCTS with learned evaluation
  - Add pattern recognition for common positions
  - Continuously improve analysis quality

### Phase 10: Advanced Features
- [ ] **Analysis Explanation**
  - Generate human-readable move explanations
  - Show calculation trees for educational value
  - Highlight key tactical and strategic concepts
  - Add analysis comparison between moves

- [ ] **Historical Analysis**
  - Analyze completed games for mistakes
  - Show alternative lines and missed opportunities
  - Generate improvement suggestions
  - Track user progress and learning

## Technical Requirements
- Maintain existing HTML/CSS/JS structure
- Ensure compatibility with modern browsers
- Implement progressive enhancement
- Keep analysis responsive and user-friendly
- Handle edge cases and error conditions gracefully

## Success Metrics
- Analysis accuracy compared to expert play
- Response time under 2 seconds for free tier
- Cache hit rate above 70% for common positions
- User engagement and retention improvements
- Positive feedback on analysis quality