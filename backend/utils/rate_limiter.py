from flask import request, jsonify
from functools import wraps
import time
from collections import defaultdict

# Simple in-memory rate limiter
request_counts = defaultdict(list)

def rate_limit(limit, per):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            now = time.time()
            client_ip = request.remote_addr

            # Remove old requests
            request_counts[client_ip] = [t for t in request_counts[client_ip] if now - t < per]

            if len(request_counts[client_ip]) >= limit:
                return jsonify({'error': 'Rate limit exceeded'}), 429

            request_counts[client_ip].append(now)
            return f(*args, **kwargs)
        return wrapped
    return decorator
