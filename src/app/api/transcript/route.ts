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

    console.log('Fetching transcript for video:', videoId);

    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en'  // Only specify language
      });

      console.log('Transcript fetch successful:', !!transcript);

      if (!transcript || !Array.isArray(transcript)) {
        throw new Error('Invalid transcript data received from YouTube');
      }

      // Format transcript data
      const formattedTranscript = transcript.map(item => ({
        text: item.text || '',
        duration: item.duration || 0,
        offset: item.offset || 0
      }));

      return NextResponse.json(
        { transcript: formattedTranscript },
        {
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );

    } catch (transcriptError) {
      console.error('Transcript fetch error:', transcriptError);
      
      // If transcript fetch fails, try YouTube API directly
      if (process.env.YOUTUBE_API_KEY) {
        try {
          console.log('Attempting YouTube API fallback...');
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/captions?` +
            `part=snippet&videoId=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.items?.[0]?.snippet) {
              return NextResponse.json(
                { 
                  transcript: [{
                    text: data.items[0].snippet.text || '',
                    duration: 0,
                    offset: 0
                  }]
                },
                {
                  headers: {
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                  }
                }
              );
            }
          }
        } catch (fallbackError) {
          console.error('YouTube API fallback failed:', fallbackError);
        }
      }
      
      throw transcriptError;
    }
    
  } catch (error) {
    console.error('API Error:', {
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