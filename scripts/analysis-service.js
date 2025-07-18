/**
 * Analysis Service - Training-Optimized Analysis System
 */

// Initialize GTO Engine
let gtoEngine = null;

function initializeGTOEngine() {
    if (typeof DominoGTOEngine !== 'undefined') {
        gtoEngine = new DominoGTOEngine();
        console.log('GTO Engine initialized successfully');
    } else {
        console.error('DominoGTOEngine not available');
    }
}

// Smart AI Analysis - Always collects training data, optimizes for speed or accuracy
async function analyzePosition() {
    const analysisSection = document.getElementById('analysisSection');
    const analysisContent = document.getElementById('analysisContent');
    const analysisSpeedSelect = document.getElementById('analysisSpeed');
    
    analysisSection.style.display = 'block';
    analysisContent.innerHTML = '<p>Analyzing position...</p>';
    
    const analysisMode = analysisSpeedSelect ? analysisSpeedSelect.value : 'instant';
    
    // Always send position data for training in background
    sendTrainingData();
    
    try {
        if (analysisMode === 'instant') {
            // Show local analysis immediately, then upgrade with cloud results
            await showInstantAnalysis();
        } else {
            // Wait for most accurate cloud analysis
            await showAccurateAnalysis();
        }
        
    } catch (error) {
        analysisContent.innerHTML = '<p style="color: #ef4444;">Analysis failed. Please try again.</p>';
        console.error('Analysis error:', error);
    }
}

// Instant mode: Show local analysis immediately, then upgrade
async function showInstantAnalysis() {
    const analysisContent = document.getElementById('analysisContent');
    
    // Get local analysis first for instant feedback
    const localResult = await analyzeWithLocalGTO();
    localResult.method = 'Local GTO (Processing cloud AI...)';
    displayAnalysisResults(localResult);
    
    // Then get cloud analysis and upgrade the display
    try {
        const cloudResult = await analyzeWithSupabase();
        if (cloudResult) {
            cloudResult.upgraded = true;
            displayAnalysisResults(cloudResult);
        }
    } catch (error) {
        console.log('Cloud AI unavailable, keeping local analysis');
        // Keep local analysis, but update the method label
        localResult.method = 'Local GTO (Cloud AI unavailable)';
        displayAnalysisResults(localResult);
    }
}

// Accurate mode: Wait for cloud analysis only
async function showAccurateAnalysis() {
    try {
        const cloudResult = await analyzeWithSupabase();
        if (cloudResult) {
            displayAnalysisResults(cloudResult);
        } else {
            // Fallback to local if cloud fails
            const localResult = await analyzeWithLocalGTO();
            localResult.method = 'Local GTO (Cloud AI unavailable)';
            localResult.fallbackUsed = true;
            displayAnalysisResults(localResult);
        }
    } catch (error) {
        // Fallback to local if cloud fails
        const localResult = await analyzeWithLocalGTO();
        localResult.method = 'Local GTO (Cloud AI unavailable)';
        localResult.fallbackUsed = true;
        displayAnalysisResults(localResult);
    }
}

// Background training data collection
async function sendTrainingData() {
    try {
        // Send position data for training regardless of analysis mode
        const trainingData = {
            position: {
                board: gameState.board || [],
                hand: gameState.hand || [],
                gameType: gameState.gameType || 'fives',
                scores: {
                    yours: gameState.yourScore || 0,
                    opponent: gameState.opponentScore || 0
                },
                passes: gameState.passes || 0,
                draws: gameState.draws || 0
            },
            timestamp: Date.now(),
            sessionId: gameState.gameId,
            userId: gameState.userId
        };

        // Also include local GTO analysis as training signal
        if (gtoEngine) {
            const localAnalysis = await analyzeWithLocalGTO();
            trainingData.localGTOAnalysis = {
                winProbability: localAnalysis.winProbability,
                bestMove: localAnalysis.suggestions[0]?.title,
                evaluation: localAnalysis.evaluation
            };
        }

        // Send to Supabase for training (non-blocking)
        supabase.from('training_positions').insert(trainingData).then(result => {
            if (result.error) {
                console.log('Training data collection failed:', result.error);
            } else {
                console.log('Training data collected successfully');
            }
        });

    } catch (error) {
        console.log('Training data collection error:', error);
    }
}

// Enhanced Supabase analysis function with caching
async function analyzeWithSupabase() {
    // Initialize engine for caching if needed
    if (!gtoEngine) {
        initializeGTOEngine();
    }
    
    let positionHash = null;
    
    try {
        // Check cache first if GTO engine is available
        if (gtoEngine) {
            positionHash = await gtoEngine.hashPosition(
                gameState.board || [],
                'player',
                gameState.gameType || 'fives'
            );
            
            const cachedResult = await gtoEngine.checkCache(positionHash, 99); // Special depth for Supabase cache
            if (cachedResult && cachedResult.method === 'Cloud AI') {
                return {
                    ...cachedResult,
                    fromCache: true
                };
            }
        }
        
        // Call Supabase for fresh analysis
        const { data, error } = await supabase.functions.invoke('analyze-domino-position', {
            body: {
                gameState: {
                    board: gameState.board,
                    hand: gameState.hand,
                    gameType: gameState.gameType,
                    scores: {
                        yours: gameState.yourScore,
                        opponent: gameState.opponentScore
                    },
                    remainingInBoneyard: parseInt(document.getElementById('remainingBones').textContent),
                    passes: gameState.passes,
                    draws: gameState.draws
                }
            }
        });
        
        if (error) throw error;
        
        const result = {
            winProbability: data.winProbability,
            suggestions: data.suggestions,
            method: 'Cloud AI',
            fromCache: false
        };
        
        // Cache the Supabase result using GTO engine
        if (gtoEngine && positionHash) {
            await gtoEngine.storeAnalysis(positionHash, result, 99);
        }
        
        // Record analysis
        await recordGameState('analysis_requested', { analysis: data });
        
        return result;
        
    } catch (error) {
        console.error('Supabase analysis error:', error);
        return null;
    }
}

// Local GTO analysis function
async function analyzeWithLocalGTO() {
    // Initialize engine if not already done
    if (!gtoEngine) {
        initializeGTOEngine();
    }
    
    if (!gtoEngine) {
        throw new Error('GTO Engine not available');
    }
    
    const selectedTier = document.getElementById('analysisTier')?.value || 'free';
    const startTime = Date.now();
    
    // Prepare game state for analysis
    const analysisGameState = {
        board: gameState.board || [],
        hand: gameState.hand || [],
        gameType: gameState.gameType || 'fives',
        yourScore: gameState.yourScore || 0,
        opponentScore: gameState.opponentScore || 0,
        passes: gameState.passes || 0,
        draws: gameState.draws || 0
    };
    
    // Run GTO analysis
    const analysis = await gtoEngine.analyzePosition(analysisGameState, selectedTier);
    const analysisTime = Date.now() - startTime;
    
    return {
        winProbability: analysis.winProbability,
        suggestions: analysis.suggestions,
        method: 'Local GTO',
        fromCache: analysis.fromCache,
        analysisTime: analysisTime,
        depth: analysis.depth || gtoEngine.tierLimits[selectedTier],
        tier: selectedTier
    };
}

// Display analysis results with method indicator and upgrade status
function displayAnalysisResults(result) {
    const analysisContent = document.getElementById('analysisContent');
    const winProbElement = document.getElementById('winProbValue');
    
    // Update win probability
    if (winProbElement) {
        winProbElement.textContent = result.winProbability + '%';
    }
    
    // Method badges with smart coloring
    let methodBadge;
    if (result.method.includes('Cloud AI')) {
        methodBadge = '<span style="background: #3b82f6; padding: 2px 8px; border-radius: 12px; font-size: 11px;">☁️ Cloud AI</span>';
    } else if (result.method.includes('Processing')) {
        methodBadge = '<span style="background: #f59e0b; padding: 2px 8px; border-radius: 12px; font-size: 11px;">⚡ Local GTO</span>';
    } else {
        methodBadge = '<span style="background: #10b981; padding: 2px 8px; border-radius: 12px; font-size: 11px;">⚡ Local GTO</span>';
    }
    
    const cacheIndicator = result.fromCache ? 
        '<span style="color: #10b981; font-size: 12px;">📦 Cached</span>' : 
        '<span style="color: #f59e0b; font-size: 12px;">🔄 Fresh</span>';
    
    // Special indicators
    const upgradeNotice = result.upgraded ? 
        '<div style="color: #10b981; font-size: 12px; margin-top: 5px;">✨ Upgraded to Cloud AI analysis!</div>' : '';
    
    const fallbackNotice = result.fallbackUsed ? 
        '<div style="color: #f59e0b; font-size: 12px; margin-top: 5px;">⚠️ Cloud AI unavailable, using local analysis</div>' : '';
        
    const trainingNotice = '<div style="color: #8b5cf6; font-size: 12px; margin-top: 5px;">📊 Position data sent for AI training</div>';
    
    // Build analysis details section
    let analysisDetails = `
        <div style="margin-bottom: 15px; padding: 10px; background: #1a1a1a; border-radius: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="display: flex; gap: 10px; align-items: center;">
                    ${methodBadge}
                    ${cacheIndicator}
                </div>
            </div>
            <div style="font-size: 13px; color: #ccc; margin-bottom: 5px;">
                ${result.method}
            </div>
    `;
    
    // Add performance details for local GTO
    if (result.method.includes('Local GTO') && result.tier) {
        analysisDetails += `
            <div style="font-size: 12px; color: #666;">
                Depth: ${result.depth} moves | 
                Time: ${result.analysisTime}ms | 
                Quality: ${result.tier?.toUpperCase()}
            </div>
        `;
    }
    
    analysisDetails += upgradeNotice + fallbackNotice + trainingNotice + '</div>';
    
    // Display suggestions
    const suggestionsHtml = result.suggestions.map(s => `
        <div class="suggestion">
            <h4>${s.title}</h4>
            <p>${s.description}</p>
            <div class="probability-bar">
                <div class="probability-fill" style="width: ${s.confidence}%"></div>
            </div>
            <small>Confidence: ${s.confidence}%</small>
        </div>
    `).join('');
    
    analysisContent.innerHTML = analysisDetails + suggestionsHtml;
}