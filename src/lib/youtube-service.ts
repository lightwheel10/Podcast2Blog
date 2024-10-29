export interface VideoDetails {
  title: string;
  duration: number;
  video_id: string;
  youtube_url: string;
  transcript: string;
  videoDetails: {
    snippet: {
      title: string;
      description: string;
    };
    contentDetails: {
      duration: string;
    };
  };
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  try {
    const response = await fetch('/api/transcript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to process video');
    }

    const data = await response.json();
    return {
      title: data.videoDetails.snippet.title,
      duration: parseDuration(data.videoDetails.contentDetails.duration),
      video_id: videoId,
      youtube_url: `https://youtube.com/watch?v=${videoId}`,
      transcript: JSON.stringify(data.transcript),
      videoDetails: data.videoDetails
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to process video');
  }
}

function parseDuration(duration: string = 'PT0M0S'): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match?.[1] || '0H').slice(0, -1);
  const minutes = (match?.[2] || '0M').slice(0, -1);
  const seconds = (match?.[3] || '0S').slice(0, -1);
  
  return (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)) * 1000;
} 