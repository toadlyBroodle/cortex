import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def process_openai_request(text):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": text}
            ],
            max_tokens=150
        )
        
        return {
            "api": "openai",
            "result": {
                "text": response.choices[0].message.content.strip()
            }
        }
    except Exception as e:
        return {
            "api": "openai",
            "error": str(e)
        }
