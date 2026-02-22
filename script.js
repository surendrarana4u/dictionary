// DOM Elements
const wordInput = document.getElementById('word-input');
const searchBtn = document.getElementById('search-btn');
const resultSection = document.getElementById('result-section');
const historyList = document.getElementById('history-list');
const pronunciationAudio = document.getElementById('pronunciation-audio');

// API Base URL
const API_BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// Search history array
let searchHistory = JSON.parse(localStorage.getItem('dictionaryHistory')) || [];

// Initialize the app
function initApp() {
    // Display search history
    displaySearchHistory();
    
    // Add event listeners
    searchBtn.addEventListener('click', performSearch);
    wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Add event listeners to suggestion tags
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const word = tag.getAttribute('data-word');
            wordInput.value = word;
            performSearch();
        });
    });
}

// Perform word search
async function performSearch() {
    const word = wordInput.value.trim().toLowerCase();
    
    // Validate input
    if (!word) {
        showError('Please enter a word to search.');
        return;
    }
    
    // Clear previous results
    resultSection.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    
    try {
        // Make API request
        const response = await fetch(`${API_BASE_URL}${word}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Word not found');
            } else {
                throw new Error('API request failed');
            }
        }
        
        const data = await response.json();
        
        // Display the word information
        displayWordInfo(data[0]);
        
        // Add to search history
        addToSearchHistory(word);
        
    } catch (error) {
        if (error.message === 'Word not found') {
            showError(`"${word}" not found. Please try another word.`);
        } else {
            showError('Something went wrong. Please try again later.');
        }
        console.error('Error:', error);
    }
}

// Display word information
function displayWordInfo(wordData) {
    const { word, phonetic, phonetics, meanings } = wordData;
    
    // Get phonetic pronunciation
    let phoneticText = phonetic || 'Not available';
    
    // Get audio URL if available
    let audioUrl = null;
    if (phonetics && phonetics.length > 0) {
        const audioPhonetic = phonetics.find(p => p.audio);
        if (audioPhonetic) {
            audioUrl = audioPhonetic.audio;
        }
    }
    
    // Get first meaning and example
    let partOfSpeech = '';
    let definition = '';
    let example = '';
    
    if (meanings && meanings.length > 0) {
        const firstMeaning = meanings[0];
        partOfSpeech = firstMeaning.partOfSpeech || '';
        
        if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
            const firstDefinition = firstMeaning.definitions[0];
            definition = firstDefinition.definition || '';
            example = firstDefinition.example || '';
        }
    }
    
    // Determine icon for part of speech
    const posIcon = getPartOfSpeechIcon(partOfSpeech);
    
    // Create the HTML for the result
    const resultHTML = `
        <div class="word-result">
            <div class="word-header">
                <h2 class="word-title">${word}</h2>
                <div class="phonetic-section">
                    <div class="phonetic">${phoneticText}</div>
                    ${audioUrl ? 
                        `<button class="audio-btn" onclick="playPronunciation('${audioUrl}')">
                            <i class="fas fa-volume-up"></i>
                        </button>` 
                        : 
                        `<button class="audio-btn" disabled>
                            <i class="fas fa-volume-mute"></i>
                        </button>`
                    }
                </div>
            </div>
            
            <div class="meaning-section">
                <div class="part-of-speech">
                    <i class="${posIcon}"></i>
                    ${partOfSpeech ? partOfSpeech.charAt(0).toUpperCase() + partOfSpeech.slice(1) : 'Not specified'}
                </div>
                
                <div class="meaning">
                    ${definition || 'Definition not available'}
                </div>
                
                <div class="${example ? 'example' : 'example-not-available'}">
                    ${example ? `"${example}"` : 'Example not available'}
                </div>
            </div>
            
            <div class="additional-info">
                <p><i class="fas fa-info-circle"></i> For more detailed information, check other sources.</p>
            </div>
        </div>
    `;
    
    resultSection.innerHTML = resultHTML;
}

// Get appropriate icon for part of speech
function getPartOfSpeechIcon(pos) {
    const iconMap = {
        'noun': 'fas fa-landmark',
        'verb': 'fas fa-running',
        'adjective': 'fas fa-adjust',
        'adverb': 'fas fa-bolt',
        'pronoun': 'fas fa-user',
        'preposition': 'fas fa-arrows-alt',
        'conjunction': 'fas fa-link',
        'interjection': 'fas fa-exclamation'
    };
    
    return iconMap[pos] || 'fas fa-font';
}

// Play pronunciation audio
function playPronunciation(audioUrl) {
    pronunciationAudio.src = audioUrl;
    pronunciationAudio.play().catch(e => {
        console.error('Error playing audio:', e);
        alert('Unable to play audio. The audio file may be unavailable.');
    });
}

// Show error message
function showError(message) {
    const errorHTML = `
        <div class="error-message">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h2>Oops!</h2>
            <p>${message}</p>
            <div style="margin-top: 20px;">
                <button id="try-again-btn" style="padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Try Another Word
                </button>
            </div>
        </div>
    `;
    
    resultSection.innerHTML = errorHTML;
    
    // Add event listener to the try again button
    document.getElementById('try-again-btn').addEventListener('click', () => {
        wordInput.value = '';
        wordInput.focus();
        showWelcomeMessage();
    });
}

// Show welcome message
function showWelcomeMessage() {
    const welcomeHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">
                <i class="fas fa-search"></i>
            </div>
            <h2>Welcome to LexiSearch</h2>
            <p>Enter a word above to get its definition, pronunciation, and example sentences.</p>
            <div class="suggestions">
                <p>Try these words:</p>
                <div class="suggestion-tags">
                    <span class="tag" data-word="dictionary">dictionary</span>
                    <span class="tag" data-word="eloquent">eloquent</span>
                    <span class="tag" data-word="serendipity">serendipity</span>
                    <span class="tag" data-word="ubiquitous">ubiquitous</span>
                </div>
            </div>
        </div>
    `;
    
    resultSection.innerHTML = welcomeHTML;
    
    // Re-attach event listeners to suggestion tags
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const word = tag.getAttribute('data-word');
            wordInput.value = word;
            performSearch();
        });
    });
}

// Add word to search history
function addToSearchHistory(word) {
    // Remove if already exists
    searchHistory = searchHistory.filter(item => item !== word);
    
    // Add to beginning
    searchHistory.unshift(word);
    
    // Keep only last 5 searches
    if (searchHistory.length > 5) {
        searchHistory.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('dictionaryHistory', JSON.stringify(searchHistory));
    
    // Update display
    displaySearchHistory();
}

// Display search history
function displaySearchHistory() {
    if (searchHistory.length === 0) {
        historyList.innerHTML = '<p class="no-history">No recent searches</p>';
        return;
    }
    
    let historyHTML = '';
    searchHistory.forEach(word => {
        historyHTML += `<span class="history-item" data-word="${word}">${word}</span>`;
    });
    
    historyList.innerHTML = historyHTML;
    
    // Add event listeners to history items
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const word = item.getAttribute('data-word');
            wordInput.value = word;
            performSearch();
        });
    });
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);