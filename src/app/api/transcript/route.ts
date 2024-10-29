import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { YoutubeTranscript } from 'youtube-transcript';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  let videoId: string | undefined;
  let origin: string = '*';
  
  try {
    const headersList = await headers();
    origin = headersList.get('origin') || '*';

    const body = await req.json();
    videoId = body.videoId;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    console.log('Attempting to fetch transcript for:', videoId);
    
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (!transcript || transcript.length === 0) {
        throw new Error('No transcript data available');
      }

      console.log('Transcript fetch successful, length:', transcript.length);

      const formattedTranscript = transcript.map(item => ({
        text: item.text,
        duration: item.duration,
        offset: item.offset
      }));

      return NextResponse.json(
        { transcript: formattedTranscript },
        { headers: corsHeaders(origin) }
      );

    } catch (transcriptError) {
      console.error('YouTube transcript fetch failed:', transcriptError);
      throw transcriptError;
    }
    
  } catch (error) {
    console.error('API Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      videoId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transcript' },
      { status: 400, headers: corsHeaders(origin) }
    );
  }
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
} 