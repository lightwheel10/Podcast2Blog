import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase';
import { extractVideoId } from '@/src/lib/youtube-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const youtubeUrl = body.youtubeUrl || body.videoId;
    
    // Extract video ID from URL or use directly if it's already an ID
    const videoId = extractVideoId(youtubeUrl) || youtubeUrl;
    
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL or video ID' }, { status: 400 });
    }

    // Call Cloud Run service
    const response = await fetch(process.env.NEXT_PUBLIC_CLOUD_RUN_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    });

    const transcriptData = await response.json();
    
    if (!response.ok || transcriptData.error) {
      throw new Error(transcriptData.error || 'Failed to fetch transcript');
    }

    // Store in Supabase
    const { data: videoData, error: dbError } = await supabase
      .from('videos')
      .insert([
        {
          youtube_url: youtubeUrl,
          video_id: videoId,
          transcript: JSON.stringify(transcriptData.transcript),
          original_language: transcriptData.originalLanguage
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      transcript: transcriptData.transcript,
      originalLanguage: transcriptData.originalLanguage,
      videoId: videoData.id
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video' },
      { status: 500 }
    );
  }
} 