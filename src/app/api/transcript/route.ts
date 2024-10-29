import { YoutubeTranscript } from 'youtube-transcript';
import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    // Extract video ID from URL
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Fetch video details from YouTube API
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${process.env.GOOGLE_API_KEY}`
    );
    
    const data = await response.json();
    
    if (!data.items?.length) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Get video transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const transcriptText = transcript
      .map(item => item.text)
      .join(' ');

    // Save to Supabase
    const { data: video, error } = await supabase
      .from('videos')
      .insert([
        {
          youtube_url: url,
          video_id: videoId,
          title: data.items[0].snippet.title,
          duration: data.items[0].contentDetails.duration,
          transcript: transcriptText
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(video);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process video' },
      { status: 500 }
    );
  }
}