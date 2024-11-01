import { BlogEditor } from '@/src/components/blog-editor';
import { VideoCard } from '@/src/components/video-card';
import { supabase } from '@/src/lib/supabase';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function GeneratePage({ 
  params,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  searchParams 
}: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  if (!id || typeof id !== 'string') {
    return notFound();
  }

  const { data: video, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !video) {
    console.error('Error fetching video:', error);
    redirect('/');
  }

  const thumbnailUrl = video.video_id 
    ? `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`
    : null;

  return (
    <div className="container mx-auto pt-24 pb-12 px-4 space-y-8">
      <h1 className="text-3xl font-bold">Generate Blog Post</h1>
      
      <VideoCard
        title={video.title || 'Untitled Video'}
        duration={video.duration || 0}
        video_id={video.video_id}
        id={video.id.toString()}
        thumbnailUrl={thumbnailUrl}
      />

      <BlogEditor
        transcript={video.transcript}
      />
    </div>
  );
} 