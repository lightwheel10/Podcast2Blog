import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase';
import { extractVideoId } from '@/src/lib/youtube-service';

// Hardcode the URL as fallback
const CLOUD_RUN_URL = 'https://fetch-transcript-227301753523.asia-south1.run.app/fetch-transcript';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const youtubeUrl = body.youtubeUrl || body.videoId;
    
    const videoId = extractVideoId(youtubeUrl) || youtubeUrl;
    
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL or video ID' }, { status: 400 });
    }

    console.log('Fetching transcript for video:', videoId);

    try {
      const transcriptResponse = await fetch(CLOUD_RUN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      });

      if (!transcriptResponse.ok) {
        const errorData = await transcriptResponse.json();
        throw new Error(errorData.error || 'Failed to fetch from Cloud Run');
      }

      const transcriptData = await transcriptResponse.json();
      console.log('Received transcript data');

      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert([{
          youtube_url: youtubeUrl,
          video_id: videoId,
          transcript: transcriptData.transcript,
          original_language: transcriptData.originalLanguage
        }])
        .select()
        .single();

      if (dbError) {
        console.error('Supabase error:', dbError);
        throw dbError;
      }

      return NextResponse.json({
        success: true,
        transcript: transcriptData.transcript,
        originalLanguage: transcriptData.originalLanguage,
        videoId: videoData.id
      });

    } catch (error: unknown) {
      console.error('Cloud Run fetch error:', error);
      
      // Type guard for Error objects
      if (error instanceof Error) {
        throw new Error(`Failed to fetch transcript: ${error.message}`);
      }
      
      // Fallback for unknown error types
      throw new Error('Failed to fetch transcript: Unknown error');
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video' },
      { status: 500 }
    );
  }
} 