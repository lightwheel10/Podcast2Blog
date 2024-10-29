import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { YoutubeTranscript } from 'youtube-transcript';
import { getVideoDetails } from '@/src/lib/youtube-service';

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
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const videoDetails = await getVideoDetails(videoId);

    // Verify both data pieces exist before returning
    if (!transcript || !videoDetails) {
      throw new Error('Failed to fetch complete video data');
    }

    // Format transcript data
    const formattedTranscript = transcript.map(item => ({
      text: item.text || '',
      duration: item.duration || 0,
      offset: item.offset || 0
    }));

    return NextResponse.json(
      {
        transcript: formattedTranscript,
        videoDetails
      },
      {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
    
  } catch (error) {
    console.error('Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      videoId: videoId ?? 'unknown',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to fetch video data. Please try again.' 
      }, 
      { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
} 