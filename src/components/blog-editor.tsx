"use client"

import { Card, CardContent } from "@/src/ui/card"
import { Button } from "@/src/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/ui/select"
import { Label } from "@/src/ui/label"
import { ScrollArea } from "@/src/ui/scroll-area"
import { LoadingSpinner } from "@/src/ui/loading-spinner"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { generateBlogPost } from "@/src/lib/gemini"
import { Copy } from "lucide-react"

export interface GenerateOptions {
  style: string
  tone: string
  length: string
  language: string
}

interface BlogEditorProps {
  transcript: string
}

export function BlogEditor({ transcript }: BlogEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [generatedBlog, setGeneratedBlog] = useState<string>("")
  const [options, setOptions] = useState<GenerateOptions>({
    style: "professional",
    tone: "informative",
    length: "medium",
    language: "english"
  })

  const handleGenerate = async () => {
    startTransition(async () => {
      try {
        const content = await generateBlogPost({
          ...options,
          transcript,
        });
        
        if (!content) {
          throw new Error('No content generated');
        }
        
        setGeneratedBlog(content);
        toast.success('Blog post generated successfully');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate blog post';
        console.error('Error generating blog:', error);
        toast.error(errorMessage);
      }
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedBlog)
      toast.success('Blog content copied to clipboard')
    } catch {
      toast.error('Failed to copy content')
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
      {/* Left Panel - Options */}
      <Card className="h-full">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="style">Writing Style</Label>
              <Select 
                value={options.style}
                onValueChange={(value) => setOptions({ ...options, style: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual & Conversational</SelectItem>
                  <SelectItem value="technical">Technical & Detailed</SelectItem>
                  <SelectItem value="storytelling">Storytelling</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Content Tone</Label>
              <Select 
                value={options.tone}
                onValueChange={(value) => setOptions({ ...options, tone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informative">Informative</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                  <SelectItem value="analytical">Analytical</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="authoritative">Authoritative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="length">Content Length</Label>
              <Select 
                value={options.length}
                onValueChange={(value) => setOptions({ ...options, length: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (~500 words)</SelectItem>
                  <SelectItem value="medium">Medium (~1000 words)</SelectItem>
                  <SelectItem value="long">Long (~1500 words)</SelectItem>
                  <SelectItem value="detailed">Detailed (~2000 words)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Target Language</Label>
              <Select 
                value={options.language}
                onValueChange={(value) => setOptions({ ...options, language: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={isPending}
              className="w-full mt-4"
            >
              {isPending ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Generating...
                </>
              ) : (
                'Generate Blog'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Preview */}
      <Card className="h-full">
        <CardContent className="p-6 h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            {generatedBlog && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="h-8 w-8"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
          <ScrollArea className="h-[calc(100vh-20rem)] w-full rounded-md border p-4">
            {generatedBlog ? (
              <div 
                className="prose prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedBlog }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Generated blog content will appear here
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
