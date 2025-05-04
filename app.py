from flask import Flask, render_template, request, jsonify, send_from_directory, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
from flask_cors import CORS
import random
import string
from flask_mail import Mail, Message
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import jwt
from functools import wraps

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finance.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = '2004abdulrahmanomar@gmail.com'  # Your Gmail address should be here
app.config['MAIL_PASSWORD'] = 'eeru eytr nqfd xtrd'     # Your App Password should be here

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this to a secure secret key
jwt = JWTManager(app)

db = SQLAlchemy(app)
mail = Mail(app)

# Initialize LoginManager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# User model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100))
    transactions = db.relationship('Transaction', backref='user', lazy=True)
    budgets = db.relationship('Budget', backref='user', lazy=True)

# Transaction model
class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))
    date = db.Column(db.DateTime, default=datetime.utcnow)
    type = db.Column(db.String(20), nullable=False)  # 'income' or 'expense'
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# Budget model
class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    spent = db.Column(db.Float, default=0.0)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.args.get('token')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400

    verification_token = jwt.encode(
        {'email': email, 'exp': datetime.utcnow() + timedelta(hours=24)},
        app.config['SECRET_KEY'],
        algorithm="HS256"
    )
    user = User(email=email, password=generate_password_hash(password), verification_token=verification_token)
    db.session.add(user)
    db.session.commit()

    # Send verification email
    try:
        msg = Message('Verify Your Email',
                    sender=app.config['MAIL_USERNAME'],
                    recipients=[email])
        msg.body = f'Click the following link to verify your email: http://localhost:8000/verify/{verification_token}'
        mail.send(msg)
        return jsonify({'message': 'Registration successful. Please check your email to verify your account.'}), 200
    except Exception as e:
        print(f"Error sending email: {e}")
        return jsonify({'error': 'Failed to send verification email'}), 500

@app.route('/verify', methods=['POST'])
def verify():
    data = request.json
    email = data.get('email')
    token = data.get('token')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        user.is_verified = True
        user.verification_token = None
        db.session.commit()
        return jsonify({'message': 'Email verified successfully', 'redirect': 'login.html'}), 200
    except Exception as e:
        return jsonify({'error': 'Invalid verification token'}), 400

# Serve static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    if not path:
        return send_from_directory('public', 'index.html')
    try:
        return send_from_directory('public', path)
    except:
        return send_from_directory('public', 'index.html')

# API Routes
@app.route('/transactions', methods=['GET'])
def get_transactions():
    transactions = Transaction.query.all()
    return jsonify([t.to_dict() for t in transactions])

@app.route('/transactions', methods=['POST'])
def add_transaction():
    try:
        data = request.json
        transaction = Transaction(
            amount=float(data['amount']),
            category=data['category'],
            description=data['description'],
            type=data['type'],
            user_id=current_user.id
        )
        db.session.add(transaction)
        db.session.commit()
        return jsonify(transaction.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        if not user.is_verified:
            return jsonify({'error': 'Please verify your email first'}), 401
        
        access_token = create_access_token(identity=email)
        login_user(user)
        return jsonify({'token': access_token}), 200
    
    return jsonify({'error': 'Invalid email or password'}), 401

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/budgets', methods=['GET', 'POST'])
@login_required
def handle_budgets():
    if request.method == 'POST':
        data = request.json
        new_budget = Budget(
            category=data['category'],
            amount=data['amount'],
            month=data['month'],
            year=data['year'],
            user_id=current_user.id
        )
        db.session.add(new_budget)
        db.session.commit()
        return jsonify({'message': 'Budget added successfully'}), 201
    
    budgets = Budget.query.filter_by(user_id=current_user.id).all()
    return jsonify([{
        'id': b.id,
        'category': b.category,
        'amount': b.amount,
        'spent': b.spent,
        'month': b.month,
        'year': b.year
    } for b in budgets])

@app.route('/reports/monthly', methods=['GET'])
@login_required
def monthly_report():
    month = request.args.get('month', datetime.now().month)
    year = request.args.get('year', datetime.now().year)
    
    transactions = Transaction.query.filter(
        Transaction.user_id == current_user.id,
        db.extract('month', Transaction.date) == month,
        db.extract('year', Transaction.date) == year
    ).all()
    
    total_income = sum(t.amount for t in transactions if t.type == 'income')
    total_expenses = sum(t.amount for t in transactions if t.type == 'expense')
    
    category_expenses = {}
    for t in transactions:
        if t.type == 'expense':
            category_expenses[t.category] = category_expenses.get(t.category, 0) + t.amount
    
    return jsonify({
        'total_income': total_income,
        'total_expenses': total_expenses,
        'net_savings': total_income - total_expenses,
        'category_expenses': category_expenses
    })

if __name__ == '__main__':
    with app.app_context():
        db.drop_all()  # This will delete all tables
        db.create_all()  # This will create fresh tables
    app.run(debug=True, host='0.0.0.0', port=8000) 