import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { YoutubeTranscript } from 'youtube-transcript';

interface CaptionItem {
  snippet: {
    language: string;
    id?: string;
  };
}

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

    // First try YoutubeTranscript
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en'
      });

      if (transcript && transcript.length > 0) {
        return NextResponse.json(
          { transcript },
          { headers: corsHeaders(origin) }
        );
      }
    } catch (error) {
      // Log the error and continue to fallback
      console.log('Primary transcript method failed:', error instanceof Error ? error.message : 'Unknown error');
    }
      
    // If we get here, either no transcript was found or there was an error
    // Try YouTube API fallback
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const captionsResponse = await fetch(
      `https://youtube.googleapis.com/youtube/v3/captions?` +
      `part=snippet&videoId=${videoId}&key=${apiKey}`
    );

    if (!captionsResponse.ok) {
      throw new Error('Failed to fetch captions from YouTube API');
    }

    const captionsData = await captionsResponse.json();
    const captionTrack = captionsData.items?.find(
      (item: CaptionItem) => item.snippet.language === 'en'
    ) || captionsData.items?.[0];

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
    
    return NextResponse.json(
      { 
        transcript: [{
          text: transcriptData.text || '',
          duration: 0,
          offset: 0
        }]
      },
      { headers: corsHeaders(origin) }
    );
    
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