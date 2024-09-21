import requests
import os

HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english"
HUGGINGFACE_API_KEY = os.environ.get("HUGGINGFACE_API_KEY")

def process_huggingface_request(text):
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
    payload = {"inputs": text}

    response = requests.post(HUGGINGFACE_API_URL, headers=headers, json=payload)
    response.raise_for_status()

    result = response.json()
    return {
        "api": "huggingface",
        "result": result[0]
    }
