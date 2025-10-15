// Initialize Firebase (replace with your config)
const firebaseConfig = {
    apiKey: "AIzaSyCwE0TAh-zmnAX9-DX7LtqV3EUFlnbcVbo",
    authDomain: "sheesh-b0592.firebaseapp.com",
    databaseURL: "https://sheesh-b0592-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sheesh-b0592",
    storageBucket: "sheesh-b0592.firebasestorage.app",
    messagingSenderId: "1062222272949",
    appId: "1:1062222272949:web:e127e478be877f7d3fa1fc",
    measurementId: "G-M2JBZC5Z16"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const javaCode = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;

let startTime;
let timerInterval;
let userName = "";
let timerStarted = false;
let errors = 0;
let correctChars = 0;
let extraChars = 0;
let currentTestData = null;

// Initialize the page - ensure typing area is ready
window.onload = function() {
    // Make sure name modal is hidden
    document.getElementById('nameModal').style.display = 'none';
    // Ensure typing area is visible and accessible
    const typingArea = document.getElementById('typingArea');
    typingArea.style.zIndex = '10'; // Ensure it's above other elements
    typingArea.style.position = 'relative'; // Ensure proper positioning
};

// Handle tab key in textarea
const typingArea = document.getElementById('typingArea');
typingArea.addEventListener('click', function() {
    // Ensure the typing area is focused when clicked
    this.focus();
});

typingArea.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        
        // Insert tab character
        this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
        
        // Move cursor position
        this.selectionStart = this.selectionEnd = start + 4;
        return;
    }
    
    // Start timer on first keypress if not already started
    if (!timerStarted && e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta') {
        startTimer();
        timerStarted = true;
    }
});

// Track errors and correct characters in real-time
typingArea.addEventListener('input', function() {
    const userInput = typingArea.value;
    const reference = javaCode;
    
    // Reset counters
    errors = 0;
    correctChars = 0;
    extraChars = 0;
    
    // Calculate correct/incorrect/extra characters
    const minLength = Math.min(userInput.length, reference.length);
    
    for (let i = 0, j = 0; i < minLength && j < minLength; i++, j++) {
        // Treat tab (4 spaces) and single space the same
        if (userInput[i] === '\t' && reference[j] === ' ') {
            let spaceCount = 0;
            while (reference[j] === ' ' && spaceCount < 4 && j < reference.length) {
                spaceCount++;
                j++;
            }
            j--;
            
            if (spaceCount === 4) {
                correctChars += 4;
            } else {
                errors += 4;
            }
        } else if (userInput[i] === reference[j]) {
            correctChars++;
        } else {
            errors++;
        }
    }
    
    // Count extra characters if user input is longer than reference
    if (userInput.length > reference.length) {
        extraChars = userInput.length - reference.length;
    }
    
    // Check if the input matches the target code (ignoring trailing whitespace)
    const normalizedInput = userInput.trimEnd();
    const normalizedReference = reference.trimEnd();
    
    if (normalizedInput === normalizedReference) {
        // Automatically submit if the code matches
        checkTyping();
    }
});

// Disable paste functionality
typingArea.addEventListener('paste', function(e) {
    e.preventDefault();
    alert("Pasting is disabled for this typing test.");
});

// Also prevent right-click paste
typingArea.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

function startTimer() {
    // Start timer only when user starts typing
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 10);
}

function updateTimer() {
    const elapsedTime = (Date.now() - startTime) / 1000;
    document.getElementById('time').textContent = elapsedTime.toFixed(2);
}

function calculateAccuracy() {
    // MonkeyType-like accuracy calculation
    const totalTyped = correctChars + errors + extraChars;
    if (totalTyped === 0) return 100;
    
    // Accuracy is (correct characters / (correct characters + errors)) * 100
    // Extra characters don't count against accuracy directly, but they're tracked separately
    const accuracy = (correctChars / (correctChars + errors)) * 100;
    return Math.max(0, Math.min(100, accuracy.toFixed(2))); // Clamp between 0 and 100
}

function checkTyping() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    const elapsedTime = timerStarted ? (Date.now() - startTime) / 1000 : 0;
    const accuracy = calculateAccuracy();
    
    // Store the test data for later submission
    currentTestData = {
        time: elapsedTime,
        accuracy: parseFloat(accuracy),
        correctChars: correctChars,
        errors: errors,
        extraChars: extraChars
    };
    
    // Update the result display
    document.getElementById('resultTime').textContent = elapsedTime.toFixed(2) + 's';
    document.getElementById('resultAccuracy').textContent = accuracy + '%';
    document.getElementById('resultCorrect').textContent = correctChars;
    document.getElementById('resultErrors').textContent = errors;
    document.getElementById('result').style.display = 'block';
    
    // Highlight the code snippet with correct/incorrect characters
    highlightCode(typingArea.value);
    
    // Show name prompt
    document.getElementById('nameModal').style.display = 'flex';
    document.getElementById('userName').focus();
    
    // Clear the typing area
    typingArea.value = '';
    
    // Reset timer state
    timerStarted = false;
    document.getElementById('time').textContent = "0.00";
}

function submitName() {
    userName = document.getElementById('userName').value.trim();
    if (!userName) {
        alert("Please enter your name to submit your score");
        return;
    }
    
    document.getElementById('nameModal').style.display = 'none';
    
    // Submit to Firebase if we have test data
    if (currentTestData) {
        submitToLeaderboard(currentTestData.time, currentTestData.accuracy);
        currentTestData = null;
    }
}

function highlightCode(userInput) {
    const codeSnippet = document.getElementById('codeSnippet');
    const reference = javaCode;
    let highlightedHTML = '';
    
    let i = 0, j = 0;
    while (i < userInput.length && j < reference.length) {
        if (userInput[i] === '\t' && reference[j] === ' ') {
            // Handle tab vs spaces comparison
            let spaceCount = 0;
            while (reference[j] === ' ' && spaceCount < 4 && j < reference.length) {
                if (spaceCount === 0) {
                    highlightedHTML += `<span class="char ${userInput[i] === '\t' ? 'correct' : 'incorrect'}">    </span>`;
                }
                spaceCount++;
                j++;
            }
            i++;
        } else if (userInput[i] === reference[j]) {
            highlightedHTML += `<span class="char correct">${escapeHtml(reference[j])}</span>`;
            i++;
            j++;
        } else {
            highlightedHTML += `<span class="char incorrect">${escapeHtml(reference[j])}</span>`;
            i++;
            j++;
        }
    }
    
    // Add remaining characters if reference is longer than user input
    while (j < reference.length) {
        highlightedHTML += `<span class="char">${escapeHtml(reference[j])}</span>`;
        j++;
    }
    
    codeSnippet.innerHTML = highlightedHTML;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showLeaderboard() {
    document.getElementById('leaderboardModal').style.display = 'flex';
    loadLeaderboard();
}

function closeLeaderboard() {
    document.getElementById('leaderboardModal').style.display = 'none';
}

function loadLeaderboard() {
    const leaderboardContent = document.getElementById('leaderboardContent');
    leaderboardContent.innerHTML = '<p>Loading leaderboard...</p>';
    
    database.ref('leaderboard/').once('value').then((snapshot) => {
        const entries = [];
        snapshot.forEach((childSnapshot) => {
            const entry = childSnapshot.val();
            entry.id = childSnapshot.key;
            entries.push(entry);
        });
        
        // Sort by accuracy (descending), then correctChars (descending), then time (ascending)
        entries.sort((a, b) => {
            if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
            if (b.correctChars !== a.correctChars) return b.correctChars - a.correctChars;
            return parseFloat(a.time) - parseFloat(b.time);
        });
        
        if (entries.length === 0) {
            leaderboardContent.innerHTML = '<p>No entries yet</p>';
            return;
        }
        
        let html = '<div class="table-container"><table>';
        html += `
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Time</th>
                    <th>Accuracy</th>
                    <th>Correct</th>
                    <th>Errors</th>
                    <th>Extra</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        entries.forEach((entry, index) => {
            const rank = index + 1;
            let trophy = '';
            let title = '';
            
            if (rank === 1) {
                trophy = '👑';
                title = 'Ultimate nerd (Touch some grass bro)';
            } else if (rank === 2) {
                trophy = '🥈';
                title = 'Almost there nerd';
            } else if (rank === 3) {
                trophy = '🥉';
                title = 'Getting good nerd';
            }
            
            const separator = rank === 4 ? '<tr class="leaderboard-separator"><td colspan="7"></td></tr>' : '';
            
            html += `
                ${separator}
                <tr class="${rank <= 3 ? 'top-three' : ''}">
                    <td><strong>${rank}</strong></td>
                    <td><strong>${entry.name} ${trophy}</strong><br>
                        ${title ? `<span class="rank-title">${title}</span>` : ''}
                    </td>
                    <td>${entry.time}s</td>
                    <td>${entry.accuracy}%</td>
                    <td>${entry.correctChars || '-'}</td>
                    <td>${entry.errors || '-'}</td>
                    <td>${entry.extraChars || '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        leaderboardContent.innerHTML = html;
    }).catch((error) => {
        leaderboardContent.innerHTML = '<p>Error loading leaderboard</p>';
        console.error("Error loading leaderboard: ", error);
    });
}

// Update the submitName function
function submitName() {
    const nameInput = document.getElementById('userName');
    const errorElement = document.getElementById('nameError');
    const name = nameInput.value.trim();
    
    // Reset previous error states
    nameInput.classList.remove('invalid');
    errorElement.style.display = 'none';
    
    // Validation rules
    if (!name) {
        showNameError("Please enter a name", nameInput, errorElement);
        return;
    }
    
    if (name.length > 20) {
        showNameError("Name must be 20 characters or less", nameInput, errorElement);
        return;
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(name)) {
        showNameError("Only letters and numbers are allowed", nameInput, errorElement);
        return;
    }
    
    // If validation passes
    userName = name;
    document.getElementById('nameModal').style.display = 'none';
    if (currentTestData) {
        submitToLeaderboard(currentTestData.time, currentTestData.accuracy).then(() => {
            // Refresh the app after successful submission
            location.reload();
        });
    }
}

function showNameError(message, inputElement, errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    inputElement.classList.add('invalid');
    inputElement.focus();
}

// Update the submitToLeaderboard function to return a Promise
function submitToLeaderboard(time, accuracy) {
    const leaderboardRef = database.ref('leaderboard/');
    const newEntry = {
        name: userName,
        time: time.toFixed(2),
        accuracy: accuracy,
        correctChars: correctChars,
        errors: errors,
        extraChars: extraChars,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    return leaderboardRef.push(newEntry)
        .then(() => {
            console.log("Data saved successfully");
            return true;
        })
        .catch((error) => {
            console.error("Error saving data: ", error);
            return false;
        });
}

// Update the window.onload function to ensure typing area is ready
window.onload = function() {
    // Make sure name modal is hidden
    document.getElementById('nameModal').style.display = 'none';
    // Enable typing area
    document.getElementById('typingArea').disabled = false;
    document.getElementById('checkButton').disabled = false;
    // Focus the typing area
    document.getElementById('typingArea').focus();
};