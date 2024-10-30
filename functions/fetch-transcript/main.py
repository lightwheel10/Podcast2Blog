import functions_framework
from flask import jsonify
import requests
import re
import json
import logging
from bs4 import BeautifulSoup
import time
from urllib.parse import parse_qs, urlparse

logging.basicConfig(level=logging.INFO)

def get_video_info(video_id):
    # Rotate between different user agents
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0'
    ]
    
    for user_agent in user_agents:
        try:
            headers = {
                'User-Agent': user_agent,
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
            
            # First try with embed URL
            embed_url = f"https://www.youtube.com/embed/{video_id}"
            response = requests.get(embed_url, headers=headers, timeout=10)
            if response.ok:
                return response.text
                
            # If embed fails, try regular URL
            url = f"https://www.youtube.com/watch?v={video_id}"
            response = requests.get(url, headers=headers, timeout=10)
            if response.ok:
                return response.text
                
            time.sleep(1)  # Add delay between attempts
            
        except Exception as e:
            logging.error(f"Error with user agent {user_agent}: {str(e)}")
            continue
            
    return None

def extract_transcript_data(html_content):
    if not html_content:
        return None
        
    try:
        # Method 1: Try to find caption data in player response
        player_response_pattern = r'"captions":({.*?})]}'
        match = re.search(player_response_pattern, html_content)
        if match:
            captions_data = json.loads(match.group(1) + '}]}')
            if 'playerCaptionsTracklistRenderer' in captions_data:
                tracks = captions_data['playerCaptionsTracklistRenderer']['captionTracks']
                for track in tracks:
                    if track.get('languageCode') == 'en':
                        url = track['baseUrl']
                        response = requests.get(url)
                        if response.ok:
                            soup = BeautifulSoup(response.text, 'html.parser')
                            transcript = []
                            for text in soup.find_all('text'):
                                transcript.append({
                                    'text': text.get_text().strip(),
                                    'duration': float(text.get('dur', 0)) * 1000,
                                    'offset': float(text.get('start', 0)) * 1000
                                })
                            return transcript

        # Method 2: Try alternative data extraction
        alternative_pattern = r'ytInitialPlayerResponse\s*=\s*({.+?});'
        match = re.search(alternative_pattern, html_content)
        if match:
            player_data = json.loads(match.group(1))
            captions = player_data.get('captions', {})
            if captions:
                caption_tracks = captions.get('playerCaptionsTracklistRenderer', {}).get('captionTracks', [])
                for track in caption_tracks:
                    if track.get('languageCode') == 'en':
                        url = track['baseUrl']
                        response = requests.get(url)
                        if response.ok:
                            soup = BeautifulSoup(response.text, 'html.parser')
                            transcript = []
                            for text in soup.find_all('text'):
                                transcript.append({
                                    'text': text.get_text().strip(),
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