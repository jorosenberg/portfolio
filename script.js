/* jshint esversion: 8 */
// --- NAVIGATION LOGIC ---

// API Configuration for Global Counter
const API_URL = "/friend-counter";

/**
 * Handles page transitions with fade effects
 * @param {string} pageId - The ID of the section to show
 */
function navigateTo(pageId) {
    const currentSection = document.querySelector('.page-section.active');
    const target = document.getElementById(pageId);

    if (currentSection && currentSection.id === pageId) return;

    const showTarget = () => {
        const sections = document.querySelectorAll('.page-section');

        sections.forEach(section => {
            section.classList.remove('active', 'animate-fade-out', 'animate-fade-in');
            section.style.display = 'none';
        });

        if (target) {
            target.style.display = 'flex';
            target.classList.add('active', 'animate-fade-in');

            if (pageId === 'nice-message') {
                getNiceMessage();
            }
        }
        window.scrollTo(0, 0);
    };

    if (currentSection) {
        currentSection.classList.remove('animate-fade-in');
        currentSection.classList.add('animate-fade-out');
        setTimeout(() => { showTarget(); }, 500);
    } else {
        showTarget();
    }
}

/**
 * Fetches and updates the global visitor/friend count from AWS Lambda.
 * Fixed: Removed the local +1 to prevent double-counting in the UI.
 */
async function updateFriendCount() {
    const display = document.getElementById('friend-count');

    // 1. Show the last known count immediately so it's not "Loading..."
    const cachedCount = localStorage.getItem('last_known_count');
    if (display && cachedCount) {
        display.innerText = cachedCount;
    }

    try {
        // 2. Tell the server a new friend has arrived
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        // 3. Update the UI with the actual incremented count from the server
        if (display && data.count) {
            display.innerText = data.count;
            localStorage.setItem('last_known_count', data.count);
        }
    } catch (err) {
        console.error('Failed to fetch count:', err);
        if (display && (!display.innerText || display.innerText === 'Loading...')) {
            display.innerText = '---';
        }
    }
}

/**
 * Generates and displays a random message.
 */
function getNiceMessage() {
    const niceMessageList = [
        "Roses are red,\nViolets are blue,\nI’m deeply honored,\nto be chosen by you.",
        "The stars are bright,\nthe sky is deep,\nyour friendship is a promise,\nI’m honored to keep.",
        "Violets are sweet,\nand morning is new,\nit’s a privilege,\nto be friends with you.",
        "Stories are told,\n and truth is a blend,\n but it’s a high honor,\n to be your friend.",
        "Like rain on the leaves,\n or the morning dew,\n I’m graced by the honor,\n of knowing you.",
        "A path in the woods,\n a bend in the stream,\n to be your friend,\n is like a dream.",
        "As clear as the tide,\n as steady as blue,\n I’m honored to walk,\n this life with you.",
        "Like a song in the wind,\n or a sky turning bright,\n being your friend,\n is my delight.",
        "The garden of life,\n has many a trend,\n but I’m lucky to be,\n your chosen friend.",
        "Words are just breath,\n but the feeling is true,\n I hold so much honor,\n in being with you.",
        "Life is a journey,\n with a long, winding end,\n and I’m honored to walk it,\n as your loyal friend.",
        "Not everyone finds,\n a bond that is true,\n I’m touched by the honor,\n of being with you.",
        "My heart is quite full,\n as the days ascend,\n for the pride that I feel,\n to be called your friend.",
        "Though time may move fast,\n and the seasons may mend,\n I cherish the honor,\n of being your friend."
    ];

    const randomIndex = Math.floor(Math.random() * niceMessageList.length);
    const randomMessage = niceMessageList[randomIndex];

    const selectors = ['#message-display', '.message-display', '.nice-message-text', '.nice-message-display'];

    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
            el.textContent = randomMessage;
            break;
        }
    }
}

// Initialize Site
document.addEventListener('DOMContentLoaded', () => {
    navigateTo('home');
    updateFriendCount();
    if (typeof loadDefaultVideo === 'function') loadDefaultVideo();
});