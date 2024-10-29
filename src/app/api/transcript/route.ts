import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { supabase } from '@/src/lib/supabase';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    const video_id = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    
    if (!video_id) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    const oembedResponse = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${video_id}&format=json`
    );
    
    const videoData = await oembedResponse.json();
    const transcript = await YoutubeTranscript.fetchTranscript(video_id);
    const transcriptText = transcript.map(item => item.text).join(' ');
    const duration = transcript.reduce((acc, item) => acc + (item.duration || 0), 0);

    const videoDetails = {
      title: videoData.title,
      duration: duration,
      video_id: video_id,
      youtube_url: url,
      transcript: transcriptText
    };

    const { error: dbError } = await supabase
      .from('videos')
      .insert([videoDetails]);

    if (dbError) {
      console.error('Database Error:', dbError);
      throw dbError;
    }

    return NextResponse.json(videoDetails);
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video' },
      { status: 500 }
    );
  }
}