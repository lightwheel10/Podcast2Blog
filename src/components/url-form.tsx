"use client"

import { Button } from "@/src/ui/button"
import { Input } from "@/src/ui/input"
import { LoadingSpinner } from "@/src/ui/loading-spinner"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { YoutubeTranscript } from 'youtube-transcript'
import { supabase } from "@/src/lib/supabase"
import { toast } from "sonner"

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

export function UrlForm() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        const videoId = extractVideoId(url);
        if (!videoId) {
          toast.error('Invalid YouTube URL');
          return;
        }

        // Fetch transcript
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        // Calculate duration and title
        const duration = transcript.reduce((total, item) => total + (item.duration || 0), 0);
        const title = transcript.slice(0, 3)
          .map(item => item.text)
          .find(text => text.length > 20 && !text.toLowerCase().includes('subscribe')) || 'Untitled Video';

        // Save to Supabase
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
          toast.error('Failed to save video data');
          return;
        }

        if (!data?.id) {
          toast.error('Failed to get video ID');
          return;
        }

        toast.success('Video processed successfully!');
        router.push(`/generate/${data.id}`);
        
      } catch (error) {
        console.error('Error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to process video');
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="url"
        placeholder="Enter YouTube URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={isPending}
      />
      <Button 
        type="submit" 
        disabled={isPending || !url}
        className="w-full"
      >
        {isPending ? (
          <>
            <LoadingSpinner className="mr-2" />
            Converting...
          </>
        ) : (
          'Convert to Blog'
        )}
      </Button>
    </form>
  )
}
