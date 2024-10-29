"use client"

import { Button } from "@/src/ui/button"
import { Input } from "@/src/ui/input"
import { LoadingSpinner } from "@/src/ui/loading-spinner"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

export function UrlForm() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        const response = await fetch('/api/transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) throw new Error('Failed to process video')
        
        const data = await response.json()
        router.push(`/generate/${data.id}`)
      } catch (error) {
        console.error('Error:', error)
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
