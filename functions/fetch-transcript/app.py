from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
import time
import random
from fake_useragent import UserAgent
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

MAX_RETRIES = int(os.getenv('MAX_RETRIES', 3))
RETRY_DELAY = int(os.getenv('RETRY_DELAY', 2))

def get_random_user_agent():
    ua = UserAgent()
    return ua.random

def get_transcript_with_retry(video_id):
    last_error = None
    
    for attempt in range(MAX_RETRIES):
        try:
            headers = {'User-Agent': get_random_user_agent()}
            
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = None
            original_language = None
            
            # Try different methods to get transcript
            try:
                transcript = transcript_list.find_manually_created_transcript(['en'])
                original_language = 'en (manual)'
            except Exception:
                try:
                    transcript = transcript_list.find_generated_transcript(['en'])
                    original_language = 'en (auto-generated)'
                except Exception:
                    try:
                        transcript = next(iter(transcript_list._manually_created_transcripts.values()))
                        original_language = f"{transcript.language_code} (manual)"
                        transcript = transcript.translate('en')
                    except Exception:
                        transcript = next(iter(transcript_list._generated_transcripts.values()))
                        original_language = f"{transcript.language_code} (auto-generated)"
                        transcript = transcript.translate('en')

            transcript_data = transcript.fetch()
            
            return {
                'transcript': [{
                    'text': entry['text'],
                    'duration': entry['duration'] * 1000,
                    'offset': entry['start'] * 1000
                } for entry in transcript_data],
                'originalLanguage': original_language
            }

        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))  # Exponential backoff
                continue
            raise last_error

@app.route('/fetch-transcript', methods=['POST', 'OPTIONS'])
def get_transcript():
    if request.method == 'OPTIONS':
        return ('', 204)

    try:
        data = request.json
        video_id = data.get('videoId')
        
        if not video_id:
            return jsonify({'error': 'No video ID provided'}), 400

        result = get_transcript_with_retry(video_id)
        return jsonify(result)

    except Exception as e:
        error_message = str(e)
        print(f"Error processing request: {error_message}")
        return jsonify({'error': f'Error processing request: {error_message}'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port) 