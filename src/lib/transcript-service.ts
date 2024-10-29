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

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Fetching transcript for video ${videoId}`);
      
      const response = await fetch('/api/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
        cache: 'no-cache',
        credentials: 'same-origin',
      });

      console.log(`Response status:`, response.status);
      const data = await response.json();
      console.log(`Response data:`, data);

      if (!response.ok || data.error) {
        console.error(`Attempt ${attempt} failed:`, data.error);
        
        if (attempt === MAX_RETRIES) {
          console.log('Trying direct YouTube API approach...');
          const transcriptData = await fetchYouTubeTranscript(videoId);
          if (transcriptData) {
            return transcriptData;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      if (!Array.isArray(data.transcript)) {
        throw new Error('Invalid transcript data received');
      }

      return data.transcript;
    } catch (error) {
      console.error(`Attempt ${attempt} error:`, error);
      
      if (attempt === MAX_RETRIES) {
        try {
          console.log('Trying direct YouTube API approach after error...');
          const transcriptData = await fetchYouTubeTranscript(videoId);
          if (transcriptData) {
            return transcriptData;
          }
        } catch (apiError) {
          console.error('Direct API approach failed:', apiError);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error('Failed to fetch transcript after all retries');
}

async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptItem[]> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YouTube API key is required');
  }

  const captionsResponse = await fetch(
    `https://youtube.googleapis.com/youtube/v3/captions?` +
    `part=snippet&videoId=${videoId}&key=${apiKey}`
  );

  if (!captionsResponse.ok) {
    throw new Error('Failed to fetch captions from YouTube API');
  }

  const captionsData = (await captionsResponse.json()) as YouTubeCaptionResponse;
  console.log('Available captions:', captionsData);

  // Get the first English caption track or any caption track if English isn't available
  const captionTrack = captionsData.items.find(
    (item: YouTubeCaptionItem) => item.snippet.language === 'en'
  ) || captionsData.items[0];

  if (!captionTrack) {
    throw new Error('No caption tracks found');
  }

  const transcriptResponse = await fetch(
    `https://youtube.googleapis.com/youtube/v3/captions/${captionTrack.id}?key=${apiKey}`
  );

  if (!transcriptResponse.ok) {
    throw new Error('Failed to fetch transcript content');
  }

  const transcriptData = await transcriptResponse.json();

  return [{
    text: transcriptData.text || '',
    duration: 0,
    offset: 0
  }];
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
