/**
 * Supabase Client and Authentication
 */

// Initialize Supabase
const SUPABASE_URL = 'https://azsnenvnqnchrlrtuocg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6c25lbnZucW5jaHJscnR1b2NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTAzMjMsImV4cCI6MjA2NzQ2NjMyM30.hFDoOY00QbVRLBqmz6bzpVcK36sWF_VrO3XxElkJsCg';

// Initialize client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// User State
let currentUser = null;
let authMode = 'login';

// Check for existing session
async function checkSession() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        currentUser = user;
        showUserInfo();
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('setupScreen').style.display = 'block';
    }
}

// Auth Functions
function toggleAuthMode() {
    authMode = authMode === 'login' ? 'signup' : 'login';
    document.getElementById('authTitle').textContent = authMode === 'login' ? 'Login' : 'Sign Up';
    document.getElementById('authSubmit').textContent = authMode === 'login' ? 'Login' : 'Sign Up';
    document.getElementById('authToggleText').textContent = authMode === 'login' ? "Don't have an account?" : "Already have an account?";
    document.getElementById('authToggleLink').textContent = authMode === 'login' ? 'Sign up' : 'Login';
    hideMessages();
}

async function submitAuth() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    const submitBtn = document.getElementById('authSubmit');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = `${originalText} <span class="loading"></span>`;
    submitBtn.disabled = true;
    
    try {
        let result;
        
        if (authMode === 'login') {
            result = await supabase.auth.signInWithPassword({ email, password });
        } else {
            result = await supabase.auth.signUp({ email, password });
        }
        
        if (result.error) {
            throw result.error;
        }
        
        if (authMode === 'signup' && !result.data.user.email_confirmed_at) {
            showSuccess('Check your email for confirmation link!');
        } else {
            currentUser = result.data.user;
            gameState.userId = currentUser.id;
            showUserInfo();
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('setupScreen').style.display = 'block';
        }
        
    } catch (error) {
        showError(error.message || 'Authentication failed');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    gameState.userId = null;
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('gameBoardScreen').style.display = 'none';
    document.getElementById('userInfo').classList.remove('active');
}

function showUserInfo() {
    const userInfo = document.getElementById('userInfo');
    const userEmail = document.getElementById('userEmail');
    if (currentUser) {
        userEmail.textContent = currentUser.email;
        userInfo.classList.add('active');
    }
}

// Record game state for training
async function recordGameState(action, additionalData = {}) {
    try {
        await supabase.from('game_states').insert({
            game_id: gameState.gameId,
            user_id: currentUser?.id,
            action: action,
            game_state: {
                board: gameState.board,
                hand: gameState.hand,
                gameType: gameState.gameType,
                scores: {
                    yours: gameState.yourScore,
                    opponent: gameState.opponentScore
                },
                passes: gameState.passes,
                draws: gameState.draws
            },
            additional_data: additionalData,
            timestamp: new Date().toISOString()
        });
        
        console.log('Game state recorded:', action);
    } catch (error) {
        console.log('Failed to record game state:', error);
    }
}

// Utility functions for messages
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => successDiv.style.display = 'none', 3000);
    }
}

function hideMessages() {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
}