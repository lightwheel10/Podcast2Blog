export interface VideoDetails {
  title: string;
  duration: number;
  video_id: string;
  youtube_url: string;
  transcript: string;
}

export async function getVideoDetails(url: string): Promise<VideoDetails> {
  try {
    const response = await fetch('/api/transcript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to process video');
    }

    const data = await response.json();
    return data as VideoDetails;
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to process video');
  }
} 