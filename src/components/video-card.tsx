"use client"

import { Card, CardContent } from "@/src/ui/card"
import { Button } from "@/src/ui/button"
import { TrashIcon, ExternalLinkIcon, ClockIcon } from "@radix-ui/react-icons"
import Image from "next/image"
import { useState } from "react"
import { deleteVideo } from "@/src/app/actions"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/ui/alert-dialog"
import { useRouter } from "next/navigation"

interface VideoCardProps {
  id: string
  title: string
  duration: number
  video_id: string
  thumbnailUrl: string | null
}

export function VideoCard({ id, title, duration, video_id, thumbnailUrl }: VideoCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const youtubeUrl = `https://youtube.com/watch?v=${video_id}`

  const displayTitle = title || 'Untitled Video'
  const displayDuration = duration ? Math.floor(duration / 60) : 0

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      router.push('/');
      
      const result = await deleteVideo(id)
      if (!result.success) {
        toast.error(result.error || "Failed to delete video")
        return
      }

      toast.success("Video deleted successfully")
    } catch {
      toast.error("An error occurred while deleting the video")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm max-w-1xl mx-auto">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative w-48 h-28 rounded-lg overflow-hidden group flex-shrink-0">
            <Image
              src={thumbnailUrl || '/placeholder.jpg'}
              alt={displayTitle}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white flex items-center gap-1 text-sm hover:text-blue-400 transition-colors"
              >
                Watch on YouTube
                <ExternalLinkIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h2 className="text-xl font-bold leading-tight truncate">
                {displayTitle}
              </h2>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled={isDeleting}
                    className="hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the video
                      and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <ClockIcon className="h-4 w-4" />
              <span>{displayDuration} minutes</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
