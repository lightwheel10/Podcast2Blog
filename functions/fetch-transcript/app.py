from flask import Flask, request, jsonify
from youtube_transcript_api import YouTubeTranscriptApi
import time
import random
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)

MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    # Add more user agents...
]

def get_random_user_agent():
    return random.choice(USER_AGENTS)

def get_transcript_with_retry(video_id):
    last_error = None
    
    for attempt in range(MAX_RETRIES):
        try:
            headers = {'User-Agent': get_random_user_agent()}
            
            # Add delay between retries
            if attempt > 0:
                time.sleep(RETRY_DELAY * attempt)
            
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
            
            if transcript:
                return {
                    'transcript': transcript.fetch(),
                    'originalLanguage': original_language
                }
                
        except Exception as e:
            last_error = str(e)
            logging.error(f"Attempt {attempt + 1} failed: {str(e)}")
            continue
            
    raise Exception(f"Failed after {MAX_RETRIES} attempts. Last error: {last_error}")

@app.route('/transcript', methods=['POST'])
def get_transcript():
    try:
        data = request.get_json()
        video_id = data.get('videoId')
        
        if not video_id:
            return jsonify({'error': 'No video ID provided'}), 400
            
        result = get_transcript_with_retry(video_id)
        
        return jsonify(result)
        
    except Exception as e:
        logging.error(f"Error processing request: {str(e)}")
        return jsonify({'error': f'Error processing request: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)