from flask import Flask, request, jsonify
from flask_cors import CORS
from api_handlers.huggingface_handler import process_huggingface_request
from api_handlers.google_nlp_handler import process_google_nlp_request
from utils.rate_limiter import rate_limit

app = Flask(__name__)
CORS(app)

@app.route('/')
def hello():
    return "Hello, API Integration App is running!"

@app.route('/api/process', methods=['POST'])
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

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
