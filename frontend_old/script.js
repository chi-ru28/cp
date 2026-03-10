/**
 * AgriAssist Chatbot Logic
 */

// DOM Elements
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const welcomeScreen = document.getElementById('welcome-screen');
const historyList = document.getElementById('history-list');
const newChatBtn = document.getElementById('new-chat-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const suggestionCards = document.querySelectorAll('.suggestion-card');
const themeToggleBtn = document.getElementById('theme-toggle');
const sidebar = document.querySelector('.sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');

// Constants
// Use the hosted or local API endpoint
const API_BASE_URL = 'http://localhost:8000'; // Make sure uvicorn is running on this port and CORS is allowed
let MOCK_MODE = false; // Fallback if API is unreachable

// We will use a mockup JWT for authorization, given how the backend expects it.
// Assuming get_current_user requires Bearer token or simply doesn't crash if we provide mock headers?
// Wait, looking at the code, in AI Chatbot: "verify_token removed since we use global get_current_user".
// We will grab the token from localStorage if it exists, else we'll mock or leave blank depending on your auth setup.
const token = localStorage.getItem('agriassist_token') || 'dummy_token_for_local_testing';

// Initialize
function init() {
    setupEventListeners();
    fetchHistory();
}

function setupEventListeners() {
    // Auto-resize textarea
    chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.scrollHeight > 200) {
            this.style.overflowY = 'auto';
        } else {
            this.style.overflowY = 'hidden';
        }

        // Enable/disable send button
        if (this.value.trim().length > 0) {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }
    });

    // Handle Enter key for submitting
    chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim().length > 0) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // Form Submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        // UI Reset
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');

        hideWelcomeScreen();

        // Add User Message
        addMessageToChat('user', message);

        // Add Bot Loading Indicator
        const loadingId = addTypingIndicator();

        // Scroll to bottom
        scrollToBottom();

        try {
            const formData = {
                message: message,
                role: 'farmer',
                location: 'Ranuj'
            };

            const response = await fetch(`${API_BASE_URL}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();

            // Remove loading
            document.getElementById(loadingId).remove();

            // Add Bot Message
            addMessageToChat('bot', data.reply);

            // Optionally, refresh history to show the new chat
            fetchHistory();

        } catch (error) {
            console.error('Error:', error);
            document.getElementById(loadingId).remove();
            addMessageToChat('bot', 'Sorry, I am having trouble connecting to the server. Please check if the backend is running.');
        }
    });

    // Suggestions
    suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            chatInput.value = prompt;
            chatInput.dispatchEvent(new Event('input'));
            chatInput.focus();
        });
    });

    // New Chat
    newChatBtn.addEventListener('click', () => {
        chatMessages.innerHTML = '';
        showWelcomeScreen();
    });

    // Clear History
    clearHistoryBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to clear your chat history?")) {
            try {
                const response = await fetch(`${API_BASE_URL}/history`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    historyList.innerHTML = '';
                    chatMessages.innerHTML = '';
                    showWelcomeScreen();
                }
            } catch (err) {
                console.error("Failed to clear history", err);
                alert("Failed to clear history. Make sure Backend is running.");
            }
        }
    });

    // Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const icon = themeToggleBtn.querySelector('i');
        if (document.body.classList.contains('light-theme')) {
            icon.classList.remove('bx-sun');
            icon.classList.add('bx-moon');
        } else {
            icon.classList.remove('bx-moon');
            icon.classList.add('bx-sun');
        }
    });

    // Mobile Sidebar Toggle
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            e.target !== toggleSidebarBtn &&
            !toggleSidebarBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// History Fetcher
async function fetchHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/history`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("History fetch failed");

        const data = await response.json();
        renderHistory(data.history || []);

    } catch (err) {
        console.warn("Could not fetch history:", err);
        // Fallback UI or silent error
        historyList.innerHTML = '<li style="color:var(--text-secondary); text-align:center; padding-top:20px;">No history available</li>';
    }
}

function renderHistory(chats) {
    historyList.innerHTML = '';

    // Reverse to show newest first, assuming backend sorting is oldest first
    const recentChats = [...chats].reverse().slice(0, 15);

    if (recentChats.length === 0) {
        historyList.innerHTML = '<li style="color:var(--text-secondary); text-align:center; padding-top:20px;">No past chats</li>';
        return;
    }

    recentChats.forEach(chat => {
        const li = document.createElement('li');
        li.innerHTML = `<i class='bx bx-message-dots'></i> <span>${escapeHTML(chat.message)}</span>`;
        li.title = chat.message;
        li.addEventListener('click', () => {
            // Load this chat context into view (simplified to just displaying it)
            chatMessages.innerHTML = '';
            hideWelcomeScreen();

            addMessageToChat('user', chat.message);
            addMessageToChat('bot', chat.reply);

            // Highlight in sidebar
            document.querySelectorAll('.history-list li').forEach(el => el.classList.remove('active'));
            li.classList.add('active');

            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
        historyList.appendChild(li);
    });
}

// UI Helpers
function hideWelcomeScreen() {
    welcomeScreen.style.display = 'none';
    chatMessages.classList.remove('hidden');
}

function showWelcomeScreen() {
    chatMessages.classList.add('hidden');
    welcomeScreen.style.display = 'flex';
    document.querySelectorAll('.history-list li').forEach(el => el.classList.remove('active'));
}

function scrollToBottom() {
    const container = document.querySelector('.chat-container');
    container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
    });
}

function addMessageToChat(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    let contentHtml = '';

    if (role === 'user') {
        contentHtml = `<div class="message-content">${escapeHTML(text)}</div>`;
    } else {
        // Simple Markdown parsing for bot
        const parsedText = formatBotReply(text);
        contentHtml = `
            <div class="message-avatar"><i class='bx bx-bot'></i></div>
            <div class="message-content">${parsedText}</div>
        `;
    }

    msgDiv.innerHTML = contentHtml;
    chatMessages.appendChild(msgDiv);
    scrollToBottom();
}

function addTypingIndicator() {
    const id = 'typing-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.className = `message bot`;
    msgDiv.id = id;

    msgDiv.innerHTML = `
        <div class="message-avatar"><i class='bx bx-bot'></i></div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;

    chatMessages.appendChild(msgDiv);
    scrollToBottom();
    return id;
}

// Basic utilities
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function formatBotReply(text) {
    let formatted = escapeHTML(text);

    // Basic bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Basic italics
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Newlines
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    formatted = formatted.replace(/\n/g, '<br>');

    // Wrap in p
    if (!formatted.startsWith('<p>')) {
        formatted = '<p>' + formatted + '</p>';
    }

    return formatted;
}

// Run
document.addEventListener('DOMContentLoaded', init);
