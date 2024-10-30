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
      
      if (attempt === MAX_RETRIES) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError || new Error('Failed to fetch transcript after all retries');
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
