export interface VideoDetails {
  title: string;
  duration: number;
  videoId: string;
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
      const error = await response.json();
      throw new Error(error.message || 'Failed to process video');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw error;
  }
} 