// settings.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize settings
    initializeSettings();
    
    // Setup event listeners for all settings
    setupEventListeners();
});

function initializeSettings() {
    // Load saved settings
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedNotifications = JSON.parse(localStorage.getItem('notifications')) || {
        email: true,
        push: false
    };
    
    // Apply theme
    applyTheme(savedTheme);
    document.getElementById('themeToggle').checked = savedTheme === 'dark';
    
    // Apply notification settings
    document.getElementById('emailAlerts').checked = savedNotifications.email;
    document.getElementById('pushNotifications').checked = savedNotifications.push;
    
    // Load user email
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        document.getElementById('userEmail').value = userEmail;
    }
}

function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('change', function() {
        const newTheme = this.checked ? 'dark' : 'light';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    // Notification toggles
    const emailAlerts = document.getElementById('emailAlerts');
    const pushNotifications = document.getElementById('pushNotifications');
    
    [emailAlerts, pushNotifications].forEach(toggle => {
        toggle.addEventListener('change', function() {
            const notifications = {
                email: emailAlerts.checked,
                push: pushNotifications.checked
            };
            localStorage.setItem('notifications', JSON.stringify(notifications));
            showToast('Notification settings saved!');
        });
    });
    
    // Save account changes
    const saveAccountBtn = document.getElementById('saveAccountBtn');
    saveAccountBtn.addEventListener('click', async function() {
        const email = document.getElementById('userEmail').value;
        const newPassword = document.getElementById('newPassword').value;
        
        if (email) {
            localStorage.setItem('userEmail', email);
        }
        
        if (newPassword) {
            // Here you would typically make an API call to update the password
            document.getElementById('newPassword').value = '';
        }
        
        showToast('Account settings saved!');
    });
    
    // Delete account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    deleteAccountBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            // Here you would typically make an API call to delete the account
            showToast('Account deleted successfully');
            setTimeout(() => {
                window.location.href = '/register.html';
            }, 2000);
        }
    });
}

function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    
    // Store the theme preference
    localStorage.setItem('theme', theme);
    
    // Apply theme to all iframes (if any)
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        try {
            iframe.contentDocument.documentElement.setAttribute('data-theme', theme);
        } catch (e) {
            console.log('Cannot access iframe');
        }
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
