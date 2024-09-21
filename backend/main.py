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
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy import func
import jwt
from functools import wraps

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
def load_user(user_id: int) -> User:
    return User.query.get(int(user_id))

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            token = token.split()[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'error': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/')
def hello():
    return "Hello, API Integration App is running!"

@app.route('/api/register', methods=['POST'])
def register():
    logger.info("Received registration request")
    data: Dict[str, Any] = request.json or {}
    username = data.get('username', '')
    email = data.get('email', '')
    password = data.get('password', '')

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
    data: Dict[str, Any] = request.json or {}
    user = User.query.filter_by(username=data.get('username', '')).first()
    if user and user.check_password(data.get('password', '')):
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        logger.info(f"User '{user.username}' logged in successfully")
        return jsonify({'message': 'Logged in successfully', 'token': token}), 200
    logger.warning("Login failed: Invalid username or password")
    return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/process', methods=['POST'])
@token_required
@rate_limit(limit=10, per=60)  # 10 requests per minute
def process_api_request(current_user):
    data: Dict[str, Any] = request.json or {}
    api_choice = data.get('api', '')
    text = data.get('text', '')

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

@app.route('/api/update_profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    logger.info(f"Received profile update request for user '{current_user.username}'")
    data: Dict[str, Any] = request.json or {}

    try:
        if 'huggingface_api_key' in data:
            current_user.huggingface_api_key = data['huggingface_api_key']
        if 'google_nlp_api_key' in data:
            current_user.google_nlp_api_key = data['google_nlp_api_key']

        db.session.commit()
        logger.info(f"Profile updated successfully for user '{current_user.username}'")
        return jsonify({'message': 'Profile updated successfully'}), 200
    except Exception as e:
        logger.error(f"Profile update failed for user '{current_user.username}': {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    logger.info(f"Received profile request for user '{current_user.username}'")
    return jsonify({
        'username': current_user.username,
        'email': current_user.email,
        'api_calls': current_user.api_calls,
        'has_huggingface_api_key': bool(current_user.huggingface_api_key),
        'has_google_nlp_api_key': bool(current_user.google_nlp_api_key)
    }), 200

@app.route('/api/usage', methods=['GET'])
@token_required
def get_usage(current_user):
    logger.info(f"Received usage data request for user '{current_user.username}'")
    try:
        usage_data = db.session.query(
            APIUsage.api_name,
            func.count(APIUsage.id).label('usage_count'),
            func.max(APIUsage.timestamp).label('last_used')
        ).filter_by(user_id=current_user.id).group_by(APIUsage.api_name).all()

        result = [
            {
                'api_name': item.api_name,
                'usage_count': item.usage_count,
                'last_used': item.last_used.isoformat()
            }
            for item in usage_data
        ]

        logger.info(f"Usage data retrieved successfully for user '{current_user.username}': {result}")
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Failed to retrieve usage data for user '{current_user.username}': {str(e)}")
        return jsonify({'error': 'Failed to retrieve usage data'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
