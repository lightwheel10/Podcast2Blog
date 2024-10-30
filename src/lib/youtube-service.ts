import { supabase } from '@/src/lib/supabase';

interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

export interface TranscriptResponse {
  transcript: TranscriptItem[];
  originalLanguage: string;
}

export interface VideoDetails {
  title: string;
  duration: number;
  video_id: string;
  youtube_url: string;
  transcript: TranscriptItem[];
  originalLanguage: string;
  id: number;
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:v=|\/)([\w-]{11})(?:\S+)?$/,
    /(?:embed\/)([\w-]{11})(?:\S+)?$/,
    /(?:watch\?v=)([\w-]{11})(?:\S+)?$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Single function to handle transcript fetching and storage
export async function processVideo(youtubeUrl: string): Promise<VideoDetails> {
  try {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Call Cloud Run service
    const response = await fetch(process.env.CLOUD_RUN_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch transcript');
    }

    const data = await response.json();

    // Store in Supabase
    const { data: videoData, error: dbError } = await supabase
      .from('videos')
      .insert([{
        youtube_url: youtubeUrl,
        video_id: videoId,
        transcript: data.transcript,
        original_language: data.originalLanguage
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    return {
      title: videoData.title || 'Untitled Video',
      duration: calculateDuration(data.transcript),
      video_id: videoId,
      youtube_url: youtubeUrl,
      transcript: data.transcript,
      originalLanguage: data.originalLanguage,
      id: videoData.id
    };
  } catch (error) {
    console.error('Error processing video:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to process video');
  }
}

function calculateDuration(transcript: TranscriptItem[]): number {
  return transcript.reduce((total, item) => total + item.duration, 0);
} 