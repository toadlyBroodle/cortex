import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_login import LoginManager, login_user, login_required, current_user
from flask_migrate import Migrate
from api_handlers.huggingface_handler import process_huggingface_request
from api_handlers.google_nlp_handler import process_google_nlp_request
from utils.rate_limiter import rate_limit
from models import db, User, APIUsage
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key')

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)
login_manager = LoginManager(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def hello():
    return "Hello, API Integration App is running!"

@app.route('/api/register', methods=['POST'])
def register():
    logger.info("Received registration request")
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    logger.info(f"Attempting to register user: {username}")

    if User.query.filter_by(username=username).first():
        logger.warning(f"Registration failed: Username '{username}' already exists")
        return jsonify({'error': 'Username already exists'}), 400
    if User.query.filter_by(email=email).first():
        logger.warning(f"Registration failed: Email '{email}' already exists")
        return jsonify({'error': 'Email already exists'}), 400

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    logger.info(f"User '{username}' registered successfully")
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    logger.info("Received login request")
    data = request.json
    user = User.query.filter_by(username=data.get('username')).first()
    if user and user.check_password(data.get('password')):
        login_user(user)
        logger.info(f"User '{user.username}' logged in successfully")
        return jsonify({'message': 'Logged in successfully'}), 200
    logger.warning("Login failed: Invalid username or password")
    return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/process', methods=['POST'])
@login_required
@rate_limit(limit=10, per=60)  # 10 requests per minute
def process_api_request():
    data = request.json
    api_choice = data.get('api')
    text = data.get('text')

    if not api_choice or not text:
        logger.warning("API request failed: Missing api choice or text")
        return jsonify({'error': 'Missing api choice or text'}), 400

    try:
        if api_choice == 'huggingface':
            result = process_huggingface_request(text)
        elif api_choice == 'google_nlp':
            result = process_google_nlp_request(text)
        else:
            logger.warning(f"API request failed: Invalid API choice '{api_choice}'")
            return jsonify({'error': 'Invalid API choice'}), 400

        # Track API usage
        current_user.api_calls += 1
        api_usage = APIUsage(user_id=current_user.id, api_name=api_choice, timestamp=datetime.utcnow())
        db.session.add(api_usage)
        db.session.commit()

        logger.info(f"API request processed successfully for user '{current_user.username}' using '{api_choice}'")
        return jsonify(result)
    except Exception as e:
        logger.error(f"API request failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
