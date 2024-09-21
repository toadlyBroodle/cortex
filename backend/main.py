import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_login import LoginManager, login_user, login_required, current_user
from flask_migrate import Migrate
from api_handlers.huggingface_handler import process_huggingface_request
from api_handlers.google_nlp_handler import process_google_nlp_request
from utils.rate_limiter import rate_limit
from models import db, User, APIUsage
from datetime import datetime

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
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data.get('username')).first()
    if user and user.check_password(data.get('password')):
        login_user(user)
        return jsonify({'message': 'Logged in successfully'}), 200
    return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/process', methods=['POST'])
@login_required
@rate_limit(limit=10, per=60)  # 10 requests per minute
def process_api_request():
    data = request.json
    api_choice = data.get('api')
    text = data.get('text')

    if not api_choice or not text:
        return jsonify({'error': 'Missing api choice or text'}), 400

    try:
        if api_choice == 'huggingface':
            result = process_huggingface_request(text)
        elif api_choice == 'google_nlp':
            result = process_google_nlp_request(text)
        else:
            return jsonify({'error': 'Invalid API choice'}), 400

        # Track API usage
        current_user.api_calls += 1
        api_usage = APIUsage(user_id=current_user.id, api_name=api_choice, timestamp=datetime.utcnow())
        db.session.add(api_usage)
        db.session.commit()

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
