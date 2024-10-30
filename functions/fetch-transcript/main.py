import functions_framework
from flask import jsonify
import requests
import re
import json
import logging
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO)

def get_video_info(video_id):
    url = f"https://www.youtube.com/watch?v={video_id}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.text
    except Exception as e:
        logging.error(f"Error fetching video info: {str(e)}")
        return None

def extract_transcript_data(html_content):
    if not html_content:
        return None
        
    try:
        # Find the transcript data in the page source
        pattern = r'\"captions\":.+?\"playerCaptionsTracklistRenderer\":(.+?)}\]'
        match = re.search(pattern, html_content)
        if not match:
            logging.error("No caption data found in HTML")
            return None
            
        json_data = json.loads(match.group(1) + '}]')
        caption_url = None
        
        # Extract the caption URL
        for track in json_data.get('captionTracks', []):
            if track.get('languageCode') == 'en':
                caption_url = track.get('baseUrl')
                break
                
        if not caption_url:
            logging.error("No English captions found")
            return None
            
        # Fetch the actual transcript
        transcript_response = requests.get(caption_url)
        transcript_response.raise_for_status()
        
        soup = BeautifulSoup(transcript_response.text, 'html.parser')
        
        transcript = []
        for text in soup.find_all('text'):
            transcript.append({
                'text': text.get_text(),
                'duration': float(text.get('dur', 0)) * 1000,
                'offset': float(text.get('start', 0)) * 1000
            })
            
        return transcript
        
    except Exception as e:
        logging.error(f"Error extracting transcript: {str(e)}")
        return None

@functions_framework.http
def handle_request(request):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
    
    if request.method == 'OPTIONS':
        return ('', 204, headers)

    try:
        request_json = request.get_json(silent=True)
        if not request_json or 'videoId' not in request_json:
            return (jsonify({'error': 'Video ID is required'}), 400, headers)

        video_id = request_json['videoId']
        logging.info(f"Processing video ID: {video_id}")

        html_content = get_video_info(video_id)
        if not html_content:
            return (jsonify({'error': 'Failed to fetch video info'}), 400, headers)
        
        transcript = extract_transcript_data(html_content)
        if not transcript:
            return (jsonify({'error': 'No transcript available for this video'}), 400, headers)

        return (jsonify({'transcript': transcript}), 200, headers)

    except Exception as e:
        logging.error(f"Server error: {str(e)}")
        return (jsonify({'error': str(e)}), 500, headers) 