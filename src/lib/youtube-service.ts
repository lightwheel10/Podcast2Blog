interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

export interface TranscriptResponse {
  transcript: TranscriptItem[];
  originalLanguage: string;
}

export interface VideoDetails {
  title: string;
  duration: number;
  video_id: string;
  youtube_url: string;
  transcript: TranscriptItem[];
  originalLanguage: string;
  id: number;
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:v=|\/)([\w-]{11})(?:\S+)?$/,
    /(?:embed\/)([\w-]{11})(?:\S+)?$/,
    /(?:watch\?v=)([\w-]{11})(?:\S+)?$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (retries > 0 && (response.status === 429 || response.status >= 500)) {
        const delay = INITIAL_RETRY_DELAY * (MAX_RETRIES - retries + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      const delay = INITIAL_RETRY_DELAY * (MAX_RETRIES - retries + 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function processVideo(youtubeUrl: string): Promise<VideoDetails> {
  try {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const response = await fetchWithRetry('/api/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        youtubeUrl
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch transcript');
    }

    return data;
  } catch (error) {
    console.error('Error processing video:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to process video');
  }
}