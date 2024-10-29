import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { supabase } from '@/src/lib/supabase';

interface TranscriptItem {
  text: string;
  duration: number;
}

async function fetchTranscriptWithRetry(videoId: string, retries = 3): Promise<TranscriptItem[]> {
  for (let i = 0; i < retries; i++) {
    try {
      const methods = [
        () => YoutubeTranscript.fetchTranscript(videoId),
        () => YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' }),
        () => YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
      ];

      for (const method of methods) {
        try {
          const result = await method();
          if (result && result.length > 0) {
            return result;
          }
        } catch (error) {
          console.log(`Method failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          continue;
        }
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Failed to fetch transcript after multiple attempts');
}

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
    
    if (!oembedResponse.ok) {
      return NextResponse.json(
        { error: 'Video not found or inaccessible' },
        { status: 404 }
      );
    }

    const videoData = await oembedResponse.json();
    
    try {
      const transcript = await fetchTranscriptWithRetry(video_id);
      const transcriptText = transcript.map((item: TranscriptItem) => item.text).join(' ');
      const duration = transcript.reduce((acc: number, item: TranscriptItem) => acc + (item.duration || 0), 0);

      const videoDetails = {
        title: videoData.title,
        duration,
        video_id,
        youtube_url: url,
        transcript: transcriptText
      };

      const { error: dbError } = await supabase
        .from('videos')
        .insert([videoDetails]);

      if (dbError) throw dbError;

      return NextResponse.json(videoDetails);
    } catch (transcriptError) {
      console.error('Transcript Error:', transcriptError);
      return NextResponse.json(
        { error: 'Unable to fetch video transcript. Please ensure the video has captions enabled.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video' },
      { status: 500 }
    );
  }
}