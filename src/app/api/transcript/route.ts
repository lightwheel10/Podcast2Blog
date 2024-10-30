import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase';

const CLOUD_RUN_URL = process.env.CLOUD_RUN_URL!;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (retries > 0 && (response.status === 429 || response.status >= 500)) {
        const delay = INITIAL_RETRY_DELAY * (MAX_RETRIES - retries + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1);
      }
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      const delay = INITIAL_RETRY_DELAY * (MAX_RETRIES - retries + 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { videoId, youtubeUrl } = body;
    
    if (!videoId || !youtubeUrl) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Check cache first
    const { data: existingVideo } = await supabase
      .from('videos')
      .select('*')
      .eq('video_id', videoId)
      .single();

    if (existingVideo) {
      return NextResponse.json({
        success: true,
        transcript: existingVideo.transcript,
        originalLanguage: existingVideo.original_language,
        videoId: existingVideo.id
      });
    }

    // Fetch from Cloud Run with retries
    const transcriptResponse = await fetchWithRetry(CLOUD_RUN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    });

    const transcriptData = await transcriptResponse.json();

    // Store in Supabase
    const { data: videoData, error: dbError } = await supabase
      .from('videos')
      .insert({
        youtube_url: youtubeUrl,
        video_id: videoId,
        transcript: transcriptData.transcript,
        original_language: transcriptData.originalLanguage || 'en'
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
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