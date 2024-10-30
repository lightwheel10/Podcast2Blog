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
  videoDetails: {
    snippet: {
      title: string;
      description: string;
    };
    contentDetails: {
      duration: string;
    };
  };
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

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  try {
    const response = await fetch('/api/transcript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to process video');
    }

    const data = await response.json();
    return {
      title: data.videoDetails.snippet.title,
      duration: parseDuration(data.videoDetails.contentDetails.duration),
      video_id: videoId,
      youtube_url: `https://youtube.com/watch?v=${videoId}`,
      transcript: data.transcript,
      originalLanguage: data.originalLanguage,
      videoDetails: data.videoDetails
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to process video');
  }
}

function parseDuration(duration: string = 'PT0M0S'): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match?.[1] || '0H').slice(0, -1);
  const minutes = (match?.[2] || '0M').slice(0, -1);
  const seconds = (match?.[3] || '0S').slice(0, -1);
  
  return (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)) * 1000;
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

export function formatTranscriptForGemini(transcript: TranscriptItem[]): string {
  return transcript
    .map(item => item.text)
    .join('\n')
    .replace(/\[Music\]|\[Applause\]|\[Laughter\]/gi, '');
} 