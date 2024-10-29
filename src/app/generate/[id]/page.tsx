import { VideoCard } from "@/src/components/video-card"
import { BlogEditor } from "@/src/components/blog-editor"
import { redirect } from "next/navigation"
import { supabase } from "@/src/lib/supabase"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function GenerateBlogPage({ params }: PageProps) {
  const { id } = await params
  
  const { data: video, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !video) {
    redirect('/')
  }

  return (
    <div className="container mx-auto pt-24 pb-12 px-4 space-y-8">
      <h1 className="text-3xl font-bold">Generate Blog Post</h1>
      
      <VideoCard
        title={video.title}
        duration={video.duration}
        videoId={video.video_id}
        id={video.id}
      />

      <BlogEditor
        transcript={video.transcript}
      />
    </div>
  )
} 