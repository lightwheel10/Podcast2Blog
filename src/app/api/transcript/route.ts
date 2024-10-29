import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  throw new Error('Missing YOUTUBE_API_KEY environment variable');
}

interface VideoDetails {
  snippet: {
    title: string;
    description: string;
  };
  contentDetails: {
    duration: string;
  };
}

export async function POST(req: Request) {
  let requestVideoId: string | undefined;
  
  try {
    const { videoId } = await req.json();
    requestVideoId = videoId;
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // 1. Fetch video details from YouTube API
    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const videoResponse = await fetch(videoUrl);
    const videoData = await videoResponse.json();

    if (!videoResponse.ok || !videoData.items?.[0]) {
      throw new Error('Failed to fetch video details');
    }

    const videoDetails: VideoDetails = videoData.items[0];

    // 2. Fetch transcript using youtube-transcript with error handling
    let transcript;
    try {
      transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en',
      });

      // Verify transcript data
      if (!Array.isArray(transcript)) {
        throw new Error('Invalid transcript format');
      }

    } catch (transcriptError) {
      console.error('Transcript error:', transcriptError);
      throw new Error('Failed to fetch transcript. Please ensure the video has captions enabled.');
    }

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

    return NextResponse.json({
      transcript: formattedTranscript,
      videoDetails
    });
    
  } catch (error) {
    console.error('Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      videoId: requestVideoId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to fetch video data. Please try again.' 
      }, 
      { status: 400 }
    );
  }
} 