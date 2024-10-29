"use client"

import { Card, CardContent } from "@/src/ui/card"
import { Button } from "@/src/ui/button"
import { TrashIcon, ExternalLinkIcon } from "@radix-ui/react-icons"
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
  videoId: string
}

export function VideoCard({ id, title, duration, videoId }: VideoCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  const youtubeUrl = `https://youtube.com/watch?v=${videoId}`

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteVideo(id)
      if (!result.success) {
        toast.error(result.error || "Failed to delete video")
        return
      }

      toast.success("Video deleted successfully")
      router.replace('/')
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
              src={thumbnailUrl}
              alt={title}
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
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h2 className="text-lg font-semibold leading-tight truncate">{title}</h2>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled={isDeleting}
                    className="hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <TrashIcon className="h-3 w-3" />
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
            <p className="text-xs text-muted-foreground mt-1">
              Duration: {Math.floor(duration / 60)} minutes
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
