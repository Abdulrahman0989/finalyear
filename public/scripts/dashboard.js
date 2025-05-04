// Dashboard initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar toggle
    document.getElementById('sidebarCollapse').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Initialize charts
    initializeCharts();
    
    // Load user data
    loadUserData();
    
    // Setup event listeners
    setupEventListeners();
});

// Initialize Charts
function initializeCharts() {
    // Monthly Overview Chart
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Income',
                data: [1200, 1900, 1500, 1800, 2000, 1700],
                borderColor: '#6f42c1',
                tension: 0.1
            }, {
                label: 'Expenses',
                data: [1000, 1500, 1300, 1400, 1800, 1600],
                borderColor: '#8a5fff',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Category Chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['Housing', 'Food', 'Transport', 'Entertainment', 'Others'],
            datasets: [{
                data: [30, 20, 15, 10, 25],
                backgroundColor: [
                    '#6f42c1',
                    '#563d7c',
                    '#8a5fff',
                    '#b8a2ff',
                    '#d4c4ff'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Load user data
async function loadUserData() {
    try {
        const response = await fetch('/api/user/data');
        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Update dashboard with user data
function updateDashboard(data) {
    // Update total balance
    document.getElementById('totalBalance').textContent = 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
            .format(data.balance || 0);
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    });
}
