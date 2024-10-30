import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase';
import { extractVideoId } from '@/src/lib/transcript-service';

const CLOUD_RUN_URL = 'https://fetch-transcript-227301753523.asia-south1.run.app/fetch-transcript';

export async function POST(req: Request) {
  try {
    const { youtubeUrl } = await req.json();
    
    // Extract video ID
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Fetch transcript from Cloud Run
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
          transcript: JSON.stringify(transcriptData.transcript)
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      transcript: transcriptData.transcript,
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