from flask import Flask, request, jsonify, render_template, url_for
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
import re
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def extract_video_id(url):
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu.be\/)([\w-]+)',
        r'(?:youtube\.com\/embed\/)([\w-]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

@app.route('/fetch-transcript', methods=['POST'])  
def get_transcript():
    try:
        data = request.json
        video_id = data.get('videoId')  
        
        if not video_id:
            return jsonify({'error': 'No video ID provided'}), 400

        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = None
            original_language = None
            
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
            
            formatted_transcript = [{
                'text': entry['text'],
                'duration': entry['duration'] * 1000,  # Convert to milliseconds
                'offset': entry['start'] * 1000       # Convert to milliseconds
            } for entry in transcript_data]
            
            return jsonify({
                'transcript': formatted_transcript,
                'originalLanguage': original_language
            })

        except Exception as e:
            available_transcripts = YouTubeTranscriptApi.list_transcripts(video_id)
            manual_langs = [f"{lang}" for lang in available_transcripts._manually_created_transcripts.keys()]
            auto_langs = [f"{lang}" for lang in available_transcripts._generated_transcripts.keys()]
            
            error_message = f"Error getting transcript. Available languages:\n"
            if manual_langs:
                error_message += f"\nManual transcripts: {', '.join(manual_langs)}"
            if auto_langs:
                error_message += f"\nAuto-generated transcripts: {', '.join(auto_langs)}"
                
            return jsonify({'error': error_message}), 500

    except Exception as e:
        return jsonify({'error': f'Error processing request: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080))) 