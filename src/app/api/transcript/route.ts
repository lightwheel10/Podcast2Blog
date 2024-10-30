import { NextResponse } from 'next/server';
import { processVideo } from '@/src/lib/youtube-service';

export async function POST(req: Request) {
  try {
    const { youtubeUrl } = await req.json();
    const videoDetails = await processVideo(youtubeUrl);
    
    return NextResponse.json({
      success: true,
      ...videoDetails
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video' },
      { status: 500 }
    );
  }
} 