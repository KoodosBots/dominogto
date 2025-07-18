# Domino GTO Analysis Project

## Project Overview
This is a comprehensive domino Game Theory Optimal (GTO) analysis system that provides AI-powered move recommendations for different domino game variants (Fives, Draw, Block).

## Key Components
- **gto.html**: Main application file with UI and game logic
- **todo.md**: Comprehensive development roadmap with 10 phases
- **GTO Analysis Engine**: Local JavaScript-based analysis system

## Architecture
The system implements a multi-tier analysis engine with:
- Position normalization and hashing for cache efficiency
- Tiered analysis depths (Free: 2, Basic: 5, Pro: 10 moves)
- Local caching with LRU eviction
- Minimax algorithm with alpha-beta pruning
- Game-specific evaluation functions

## Development Commands
- No specific build commands (pure HTML/CSS/JS)
- Open gto.html in browser for testing
- Use browser dev tools for debugging

## Testing Strategy
- Test each phase implementation independently
- Verify position normalization handles board symmetries correctly
- Validate cache performance and hit rates
- Test analysis accuracy against known positions
- Performance test with different tier depths

## Current Status
✅ **COMPLETED**: Training-Optimized Analysis System
- **Maximum Training Data**: ALL positions sent to cloud for AI learning
- **Speed vs Accuracy**: User chooses instant local + cloud upgrade OR wait for accurate cloud
- **No Data Loss**: Even "instant" mode upgrades to cloud results automatically
- **Local GTO as Training Signal**: Local analysis sent as additional training data
- **Smart UX**: Clear progression from local to cloud analysis

## Implementation Summary
- **index.html**: Clean HTML structure with external file references
- **styles/**: Organized CSS files (main.css, components.css, responsive.css)
- **scripts/**: Modular JavaScript architecture
  - `supabase-client.js`: Authentication and cloud services
  - `game-logic.js`: Core game state and domino mechanics
  - `ui-handlers.js`: DOM manipulation and event handling
  - `analysis-service.js`: Training-optimized analysis system
  - `main.js`: Application initialization
- **gto-engine.js**: Local GTO engine for instant feedback and training data
- **Always Training**: Every analysis request contributes to AI improvement
- **Dual Signal Training**: Human moves + Local GTO analysis for better learning

## Training-Optimized Architecture
1. **Instant Mode**: Show local analysis immediately → upgrade to cloud AI automatically
2. **Accurate Mode**: Wait for cloud AI only (with local fallback if needed)
3. **Background Training**: ALL positions sent to Supabase `training_positions` table
4. **Dual Learning**: Cloud AI learns from both human moves AND local GTO suggestions
5. **No Training Loss**: Removed pure local-only mode that prevented data collection

## Key Files to Monitor
- `index.html` - Clean HTML structure with modular architecture
- `scripts/analysis-service.js` - Training-optimized analysis system
  - `analyzePosition()` - Main analysis function with speed/accuracy modes
  - `analyzeWithSupabase()` - Enhanced cloud analysis with caching
  - `analyzeWithLocalGTO()` - Local GTO analysis function
  - `sendTrainingData()` - Background training data collection
- `scripts/game-logic.js` - Core game state and domino mechanics
- `scripts/ui-handlers.js` - DOM manipulation and display updates
- `scripts/supabase-client.js` - Authentication and cloud services
- `gto-engine.js` - Complete local GTO analysis implementation

## Directory Structure
```
/domino-gto/
├── index.html (clean HTML)
├── styles/
│   ├── main.css (base styles)
│   ├── components.css (UI components)
│   └── responsive.css (mobile/responsive)
├── scripts/
│   ├── supabase-client.js (auth & cloud)
│   ├── game-logic.js (game mechanics)
│   ├── ui-handlers.js (DOM & events)
│   ├── analysis-service.js (AI analysis)
│   └── main.js (initialization)
├── gto-engine.js (local GTO)
├── synthetic-training-generator.js (training data)
└── CLAUDE.md (documentation)
```