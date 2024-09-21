from google.cloud import language_v1
import os

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/path/to/your/google-credentials.json"

def process_google_nlp_request(text):
    client = language_v1.LanguageServiceClient()
    document = language_v1.Document(content=text, type_=language_v1.Document.Type.PLAIN_TEXT)

    sentiment = client.analyze_sentiment(request={'document': document}).document_sentiment
    entities = client.analyze_entities(request={'document': document}).entities

    return {
        "api": "google_nlp",
        "result": {
            "sentiment": {
                "score": sentiment.score,
                "magnitude": sentiment.magnitude
            },
            "entities": [
                {
                    "name": entity.name,
                    "type": language_v1.Entity.Type(entity.type_).name,
                    "salience": entity.salience
                }
                for entity in entities[:5]  # Limit to top 5 entities
            ]
        }
    }
