import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase';
import { extractVideoId } from '@/src/lib/youtube-service';

const CLOUD_RUN_URL = 'https://fetch-transcript-227301753523.asia-south1.run.app/fetch-transcript';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received request body:', body);

    const youtubeUrl = body.youtubeUrl || body.videoId;
    const videoId = extractVideoId(youtubeUrl) || youtubeUrl;
    
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL or video ID' }, { status: 400 });
    }

    console.log('Fetching transcript for video:', videoId);

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

    // Check for existing video
    const { data: existingVideo } = await supabase
      .from('videos')
      .select('*')
      .eq('video_id', videoId)
      .single();

    if (existingVideo) {
      return NextResponse.json({
        success: true,
        transcript: transcriptData.transcript,
        originalLanguage: transcriptData.originalLanguage,
        videoId: existingVideo.id
      });
    }

    // Insert new record matching your table schema
    const { data: videoData, error: dbError } = await supabase
      .from('videos')
      .insert({
        youtube_url: youtubeUrl,
        video_id: videoId,
        transcript: transcriptData.transcript,
        original_language: transcriptData.originalLanguage,
        created_at: new Date().toISOString(),
        title: null,
        duration: null
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase error:', dbError);
      throw dbError;
    }

    if (!videoData) {
      throw new Error('Failed to insert video data');
    }

    return NextResponse.json({
      success: true,
      transcript: transcriptData.transcript,
      originalLanguage: transcriptData.originalLanguage,
      videoId: videoData.id
    });

  } catch (error: unknown) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video' },
      { status: 500 }
    );
  }
} 