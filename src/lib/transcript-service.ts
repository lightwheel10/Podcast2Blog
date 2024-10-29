interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

export async function fetchTranscript(videoId: string): Promise<TranscriptItem[]> {
  try {
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

    // Verify transcript data exists and is an array
    if (!Array.isArray(data.transcript)) {
      throw new Error('Invalid transcript data received');
    }

    return data.transcript;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to fetch transcript');
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

async function fetchTranscriptFallback(videoId: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch captions from YouTube API');
  }
  
  const data = await response.json();
  return data.items?.[0]?.snippet;
}
