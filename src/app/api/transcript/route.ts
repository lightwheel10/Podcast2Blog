import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export async function POST(req: Request) {
  try {
    const { videoId } = await req.json();
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    // Transform the response to match our TranscriptItem interface
    const formattedTranscript = transcript.map(item => ({
      text: item.text,
      duration: item.duration,
      offset: item.offset
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