import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { supabase } from '@/src/lib/supabase';

interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

// Add this function to extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
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

function calculateTotalDuration(transcript: TranscriptItem[]): number {
  return transcript.reduce((total, item) => {
    return total + (item.duration || 0);
  }, 0);
}

function extractTitleFromTranscript(transcript: TranscriptItem[]): string {
  // Try to find a good title from the first few transcript items
  const firstFewLines = transcript.slice(0, 3).map(item => item.text);
  const possibleTitle = firstFewLines.find(text => 
    text.length > 20 && 
    !text.toLowerCase().includes('subscribe') && 
    !text.toLowerCase().includes('like')
  );
  
  return possibleTitle || 'Untitled Video';
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    // Calculate total duration and extract title from transcript
    const duration = calculateTotalDuration(transcript);
    const title = extractTitleFromTranscript(transcript);

    // Store in Supabase
    const { data, error } = await supabase
      .from('videos')
      .insert([
        {
          youtube_url: url,
          video_id: videoId,
          title,
          duration,
          transcript: JSON.stringify(transcript)
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to store video data' }, { status: 500 });
    }

    return NextResponse.json({
      transcript,
      video_id: videoId,
      title,
      duration,
      ...data
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video' },
      { status: 400 }
    );
  }
}