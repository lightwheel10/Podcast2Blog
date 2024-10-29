import { NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  throw new Error('Missing YOUTUBE_API_KEY environment variable');
}

interface CaptionTrack {
  id: string;
  snippet: {
    language: string;
    trackKind: string;
    isAutoSynced?: boolean;
  };
}

interface CaptionResponse {
  items: CaptionTrack[];
  error?: {
    message: string;
  };
}

interface TranscriptItem {
  text: string;
  duration: number;
  start: number;
}

interface TranscriptResponse {
  items: TranscriptItem[];
}

export async function POST(req: Request) {
  try {
    const { videoId } = await req.json();
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // First get caption tracks
    const captionsListUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(captionsListUrl);
    const data = await response.json() as CaptionResponse;

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch captions');
    }

    // Get English captions or auto-generated
    const captionTrack = data.items?.find((item: CaptionTrack) => 
      item.snippet.language === 'en' || 
      item.snippet.language === 'en-US' ||
      item.snippet.trackKind === 'ASR'  // Auto-generated
    );

    if (!captionTrack) {
      throw new Error('No English captions available');
    }

    // Get transcript content
    const transcriptUrl = `https://www.googleapis.com/youtube/v3/captions/${captionTrack.id}?key=${YOUTUBE_API_KEY}`;
    const transcriptResponse = await fetch(transcriptUrl);
    const transcript = await transcriptResponse.json() as TranscriptResponse;

    const formattedTranscript = transcript.items.map((item: TranscriptItem) => ({
      text: item.text,
      duration: item.duration * 1000, // Convert to milliseconds
      offset: item.start * 1000
    }));

    return NextResponse.json({ transcript: formattedTranscript });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transcript' },
      { status: 400 }
    );
  }
} 