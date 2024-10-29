interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

// YouTube API response interfaces
interface YouTubeCaptionSnippet {
  language: string;
  name: string;
  audioTrackType: string;
  isAutoSynced: boolean;
  isCC: boolean;
  isDraft: boolean;
  isEasyReader: boolean;
  isLarge: boolean;
  status: string;
  trackKind: string;
}

interface YouTubeCaptionItem {
  kind: string;
  etag: string;
  id: string;
  snippet: YouTubeCaptionSnippet;
}

interface YouTubeCaptionResponse {
  kind: string;
  etag: string;
  items: YouTubeCaptionItem[];
}

export async function fetchTranscript(videoId: string): Promise<TranscriptItem[]> {
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Fetching transcript for video ${videoId}`);
      
      const response = await fetch('/api/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch transcript');
      }

      if (!data.transcript || !Array.isArray(data.transcript)) {
        throw new Error('Invalid transcript data received');
      }

      return data.transcript;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Attempt ${attempt} failed:`, lastError.message);
      
      // Try YouTube API fallback on last attempt
      if (attempt === MAX_RETRIES) {
        try {
          console.log('Attempting YouTube API fallback...');
          return await fetchYouTubeTranscript(videoId);
        } catch (fallbackError) {
          console.error('YouTube API fallback failed:', fallbackError);
          throw lastError;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError || new Error('Failed to fetch transcript after all retries');
}

async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptItem[]> {
  // Use NEXT_PUBLIC_ prefix since this runs on client
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.error('YouTube API key not found in environment');
    throw new Error('YouTube API configuration error');
  }

  try {
    // First, get the caption tracks
    const captionsResponse = await fetch(
      `https://youtube.googleapis.com/youtube/v3/captions?` +
      `part=snippet&videoId=${videoId}&key=${apiKey}`
    );

    if (!captionsResponse.ok) {
      const errorData = await captionsResponse.json();
      console.error('YouTube API Error:', errorData);
      throw new Error('Failed to fetch captions from YouTube API');
    }

    const captionsData = await captionsResponse.json() as YouTubeCaptionResponse;
    console.log('Available captions:', captionsData);

    // Get the first English caption track or any caption track if English isn't available
    const captionTrack = captionsData.items?.find(
      (item) => item.snippet.language === 'en'
    ) || captionsData.items?.[0];

    if (!captionTrack) {
      throw new Error('No caption tracks found');
    }

    // Get the actual transcript content
    const transcriptResponse = await fetch(
      `https://youtube.googleapis.com/youtube/v3/captions/${captionTrack.id}?key=${apiKey}`
    );

    if (!transcriptResponse.ok) {
      throw new Error('Failed to fetch transcript content');
    }

    const transcriptData = await transcriptResponse.json();

    // Format the response to match TranscriptItem interface
    return [{
      text: transcriptData.text || '',
      duration: 0, // YouTube API doesn't provide duration
      offset: 0    // YouTube API doesn't provide offset
    }];
  } catch (error) {
    console.error('YouTube API call failed:', error);
    throw error;
  }
}

export function calculateTotalDuration(transcript: TranscriptItem[]): number {
  return transcript.reduce((total, item) => total + (item.duration || 0), 0);
}

export function extractTitleFromTranscript(transcript: TranscriptItem[]): string {
  const firstFewLines = transcript.slice(0, 3).map(item => item.text);
  const possibleTitle = firstFewLines.find(text => 
    text.length > 20 && 
    !text.toLowerCase().includes('subscribe') && 
    !text.toLowerCase().includes('like')
  );
  
  return possibleTitle || 'Untitled Video';
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

export function formatTranscriptForGemini(transcript: TranscriptItem[]): string {
  return transcript
    .map(item => item.text)
    .join('\n')
    .replace(/\[Music\]|\[Applause\]|\[Laughter\]/gi, '');
}
