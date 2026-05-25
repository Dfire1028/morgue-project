// Demo credentials
const DEMO_CREDENTIALS = {
    username: "Dfire1028",
    password: "mortuary123"
};

// Demo 2FA codes
const VALID_2FA_CODES = ["123456", "234567", "345678"];

let timerInterval;
let timeRemaining = 60;

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
    }
}

// Verify credentials and move to 2FA step
function verifyCredentials() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Reset error messages
    document.getElementById('usernameError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    document.getElementById('credentialsError').classList.remove('show');

    let isValid = true;

    if (!username) {
        document.getElementById('usernameError').textContent = 'Username is required';
        isValid = false;
    }

    if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required';
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
        document.getElementById('credentialsStep').classList.remove('active');
        document.getElementById('2faStep').classList.add('active');
        startTimer();
    } else {
        const errorMsg = document.getElementById('credentialsError');
        errorMsg.textContent = '❌ Invalid username or password';
        errorMsg.classList.add('show');
    }
}

// Go back to credentials step
function goBackToCredentials() {
    document.getElementById('2faStep').classList.remove('active');
    document.getElementById('credentialsStep').classList.add('active');
    clearInterval(timerInterval);
    document.getElementById('2fa').value = '';
    document.getElementById('2faErrorMessage').classList.remove('show');
}

// Start countdown timer
function startTimer() {
    timeRemaining = 60;
    updateTimer();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimer();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            show2FAError('Code expired. Please try again.');
            goBackToCredentials();
        }
    }, 1000);
}

// Update timer display
function updateTimer() {
    document.getElementById('timerValue').textContent = timeRemaining;
}

// Show 2FA error message
function show2FAError(message) {
    const errorMsg = document.getElementById('2faErrorMessage');
    errorMsg.textContent = '❌ ' + message;
    errorMsg.classList.add('show');
}

// Verify 2FA code
function verify2FA(event) {
    event.preventDefault();
    
    const code = document.getElementById('2fa').value;
    document.getElementById('2faErrorMessage').classList.remove('show');

    if (!code || code.length !== 6 || isNaN(code)) {
        show2FAError('Please enter a valid 6-digit code');
        return;
    }

    if (VALID_2FA_CODES.includes(code)) {
        clearInterval(timerInterval);
        loginSuccess();
    } else {
        show2FAError('Invalid verification code. Please try again.');
        document.getElementById('2fa').value = '';
        document.getElementById('2fa').focus();
    }
}

// Handle successful login
function loginSuccess() {
    alert('✅ Login Successful! Welcome to Morgue Management System');
    window.location.href = '/dashboard';
}

// Auto-format 2FA input
document.addEventListener('DOMContentLoaded', function() {
    const twoFAInput = document.getElementById('2fa');
    
    if (twoFAInput) {
        twoFAInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    document.getElementById('loginForm').addEventListener('submit', verify2FA);
});