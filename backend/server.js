// backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config();

const Transaction = require('./models/Transaction');
const User = require('./models/User');

const app = express();
const PORT = 3000;

// Gmail configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: '2004abdulrahmanomar@gmail.com',  // Your Gmail address
        pass: 'eeru eytr nqfd xtrd'  // Your Gmail App Password
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Debugging middleware
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Add a route to serve the register page
app.get('/register.html', (req, res) => {
    console.log('Attempting to serve register.html');
    const filePath = path.join(__dirname, '../public/register.html');
    console.log('File path:', filePath);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error serving register.html:', err);
            res.status(500).send('Error serving file');
        }
    });
});

// Add a route to serve the index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// MongoDB connection using environment variable
mongoose.connect('mongodb://127.0.0.1:27017/finalY', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('MongoDB connected successfully!');
  // Verify the connection
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  db.once('open', () => {
    console.log('MongoDB connection is open and ready');
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const user = new User({
            email,
            username,
            password,
            verificationCode
        });

        await user.save();
        await sendVerificationEmail(email, verificationCode);
        res.status(201).json({ message: 'Registration successful. Please check your email for verification code.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/verify', async (req, res) => {
    try {
        console.log('Verification request received:', req.body);
        const { email, code } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found for verification:', email);
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.verificationCode !== code) {
            console.log('Invalid verification code for:', email);
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        user.isVerified = true;
        user.verificationCode = null;
        await user.save();
        
        console.log('User verified successfully:', email);
        res.json({ message: 'Verification successful' });
    } catch (err) {
        console.error('Error during verification:', err);
        res.status(500).json({ error: 'Verification failed', details: err.message });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ error: 'Please verify your email first' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        res.json({ 
            message: 'Login successful',
            username: user.username
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/transactions', async (req, res) => {
  try {
    console.log('Received transaction data:', JSON.stringify(req.body, null, 2));
    
    // Extract and validate data
    const description = req.body.description?.trim();
    const amount = parseFloat(req.body.amount);
    const date = req.body.date ? new Date(req.body.date) : new Date();
    const type = req.body.type?.toLowerCase();
    const category = req.body.category?.trim();

    // Log each field for debugging
    console.log('Parsed fields:', {
      description,
      amount,
      date: date.toISOString(),
      type,
      category
    });

    // Create transaction
    const transaction = new Transaction({
      description,
      amount,
      date,
      type,
      category
    });

    console.log('Attempting to save transaction:', JSON.stringify(transaction, null, 2));

    // Save transaction
    const savedTransaction = await transaction.save();
    console.log('Transaction saved successfully:', JSON.stringify(savedTransaction, null, 2));
    
    res.status(201).json(savedTransaction);
  } catch (err) {
    console.error('Error saving transaction:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors 
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      error: 'Failed to save transaction', 
      details: err.message 
    });
  }
});

// Get all transactions
app.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Budget endpoints
app.post('/budget', async (req, res) => {
    try {
        console.log('Budget item request received:', req.body);
        const { description, amount, type, category, date } = req.body;
        
        const budgetItem = new Transaction({
            description,
            amount,
            type,
            category,
            date: date || new Date()
        });
        
        await budgetItem.save();
        console.log('Budget item saved successfully');
        res.json({ message: 'Budget item added successfully', item: budgetItem });
    } catch (err) {
        console.error('Error adding budget item:', err);
        res.status(500).json({ error: 'Failed to add budget item', details: err.message });
    }
});

app.get('/budget', async (req, res) => {
    try {
        const budgetItems = await Transaction.find().sort({ date: -1 });
        res.json(budgetItems);
    } catch (err) {
        console.error('Error fetching budget items:', err);
        res.status(500).json({ error: 'Failed to fetch budget items', details: err.message });
    }
});

app.delete('/budget/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Transaction.findByIdAndDelete(id);
        res.json({ message: 'Budget item deleted successfully' });
    } catch (err) {
        console.error('Error deleting budget item:', err);
        res.status(500).json({ error: 'Failed to delete budget item', details: err.message });
    }
});

app.get('/check-auth', async (req, res) => {
    try {
        // In a real application, you would verify the token here
        // For this example, we'll just return the username if it exists
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // In a real application, you would decode the token and get the user ID
        // For this example, we'll just return a mock response
        res.json({ username: 'User' });
    } catch (error) {
        console.error('Error checking auth:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
