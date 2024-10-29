"use client"

import { Button } from "@/src/ui/button"
import { Input } from "@/src/ui/input"
import { useState, useTransition } from "react"
import { motion } from "framer-motion"
import { getVideoDetails } from "@/src/lib/youtube-service"
import { supabase } from "@/src/lib/supabase"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/src/ui/loading-spinner"
import { fetchTranscript, calculateTotalDuration, extractTitleFromTranscript, extractVideoId } from "@/src/lib/transcript-service"

export function Hero() {
  const router = useRouter()
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [isPending, startTransition] = useTransition()
  const [videoId, setVideoId] = useState<number | null>(null)
  const [isProcessed, setIsProcessed] = useState(false)

  const handleConvert = async () => {
    if (!youtubeUrl) return;
    
    startTransition(async () => {
      try {
        const videoId = extractVideoId(youtubeUrl);
        if (!videoId) {
          throw new Error('Invalid YouTube URL');
        }

        const transcript = await fetchTranscript(videoId);
        const duration = calculateTotalDuration(transcript);
        const title = extractTitleFromTranscript(transcript);
        
        const { data, error } = await supabase
          .from('videos')
          .insert([
            {
              youtube_url: youtubeUrl,
              title,
              duration,
              video_id: videoId,
              transcript: JSON.stringify(transcript)
            }
          ])
          .select()
          .single();

        if (error) throw error;

        toast.success('Video processed successfully!');
        setVideoId(data.id);
        setIsProcessed(true);
        
      } catch (error) {
        console.error('Error processing video:', error);
        toast.error(
          error instanceof Error 
            ? error.message 
            : 'Failed to process video. Please try again.'
        );
      }
    });
  };

  const handleGenerateBlog = () => {
    if (videoId) {
      router.push(`/generate/${videoId}`)
    }
  }

  return (
    <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container relative px-4 md:px-6"
      >
        <div className="flex flex-col items-center space-y-8 text-center">
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent"
            >
              Transform Podcasts <br />into Engaging Blog Posts
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400"
            >
              Instantly convert any Podcast into a well-structured, SEO-friendly blog post using our advanced AI technology.
            </motion.p>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full max-w-md space-y-4"
          >
            <div className="flex space-x-2">
              <Input
                placeholder="Paste YouTube URL here..."
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="h-12"
                disabled={isPending || isProcessed}
              />
              {!isProcessed ? (
                <Button 
                  onClick={handleConvert}
                  size="lg"
                  className="px-8 min-w-[120px] flex items-center justify-center gap-2"
                  disabled={isPending || !youtubeUrl}
                >
                  {isPending && <LoadingSpinner />}
                  <span>{isPending ? 'Processing...' : 'Convert'}</span>
                </Button>
              ) : (
                <Button 
                  onClick={handleGenerateBlog}
                  size="lg"
                  className="px-8 min-w-[120px] bg-green-600 hover:bg-green-700 text-white"
                  disabled={isPending}
                >
                  Generate Blog
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
} 