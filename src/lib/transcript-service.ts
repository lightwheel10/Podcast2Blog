interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

export async function fetchTranscript(videoId: string): Promise<TranscriptItem[]> {
  const MAX_RETRIES = 3;
  const BASE_URL = process.env.NEXT_PUBLIC_VERCEL_URL 
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` 
    : 'http://localhost:3000';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}/api/transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error(`Attempt ${attempt} failed:`, data.error);
        
        // Try fallback on last attempt
        if (attempt === MAX_RETRIES) {
          console.log('Attempting fallback method...');
          const fallbackData = await fetchTranscriptFallback(videoId);
          if (fallbackData) {
            return fallbackData;
          }
          throw new Error(data.error || 'Failed to fetch transcript');
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      // Verify transcript data exists and is an array
      if (!Array.isArray(data.transcript)) {
        throw new Error('Invalid transcript data received');
      }

      return data.transcript;
    } catch (error) {
      console.error(`Attempt ${attempt} error:`, error);
      
      // Try fallback on last attempt
      if (attempt === MAX_RETRIES) {
        try {
          console.log('Attempting fallback method after error...');
          const fallbackData = await fetchTranscriptFallback(videoId);
          if (fallbackData) {
            return fallbackData;
          }
        } catch (fallbackError) {
          console.error('Fallback method failed:', fallbackError);
        }
        throw error instanceof Error 
          ? error 
          : new Error('Failed to fetch transcript');
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error('Failed to fetch transcript after all retries');
}

// Make the fallback function private by removing 'async' keyword
function fetchTranscriptFallback(videoId: string): Promise<TranscriptItem[]> {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  return fetch(
    `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch captions from YouTube API');
      }
      const data = await response.json();
      const caption = data.items?.[0]?.snippet;
      
      if (!caption) {
        throw new Error('No captions found');
      }

      // Transform the YouTube API response to match TranscriptItem interface
      return [{
        text: caption.text || '',
        duration: 0, // YouTube API doesn't provide duration
        offset: 0    // YouTube API doesn't provide offset
      }];
    });
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
