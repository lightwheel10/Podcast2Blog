import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase';
import { extractVideoId } from '@/src/lib/youtube-service';

// Type assertion for environment variable
const CLOUD_RUN_URL = process.env.CLOUD_RUN_URL as string;

// Runtime check
if (!CLOUD_RUN_URL) {
  throw new Error('Missing CLOUD_RUN_URL environment variable');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const youtubeUrl = body.youtubeUrl || body.videoId;
    
    const videoId = extractVideoId(youtubeUrl) || youtubeUrl;
    
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL or video ID' }, { status: 400 });
    }

    // TypeScript now knows this is definitely a string
    const transcriptResponse = await fetch(CLOUD_RUN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    });

    const transcriptData = await transcriptResponse.json();
    
    if (!transcriptResponse.ok || transcriptData.error) {
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