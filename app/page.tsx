"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Bot, ImageIcon, Loader2 } from "lucide-react"

export default function ImageChat() {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [conversation, setConversation] = useState<
    Array<{
      role: "user" | "assistant"
      content: string
      imageUrl?: string
    }>
  >([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    setError("")

    // Add user message
    setConversation((prev) => [...prev, { role: "user", content: prompt }])

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image")
      }

      if (!data.imageUrl) {
        throw new Error("No image URL received")
      }

      console.log("Received image URL:", data.imageUrl) // Debug log

      // Add assistant response with image
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Here's your generated image:",
          imageUrl: Array.isArray(data.imageUrl) ? data.imageUrl[0] : data.imageUrl,
        },
      ])
    } catch (err) {
      console.error("Error:", err) // Debug log
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
      setPrompt("")
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center h-16 px-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-6 h-6" />
          <h1 className="font-semibold">Flux Image Generator</h1>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="container max-w-4xl py-4 space-y-4">
          {conversation.map((message, index) => (
            <div key={index} className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <Card className="max-w-[80%] p-4 space-y-2">
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5" />
                    <span className="font-medium">Assistant</span>
                  </div>
                )}
                <p>{message.content}</p>
                {message.imageUrl && (
                  <>
                    <img
                      src={message.imageUrl || "/placeholder.svg"}
                      alt="Generated image"
                      className="mt-2 rounded-lg w-full h-auto"
                      loading="lazy"
                      onError={(e) => {
                        console.error("Image failed to load:", message.imageUrl)
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      If the image doesn't load, you can view it directly at:{" "}
                      <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        link
                      </a>
                    </p>
                  </>
                )}
              </Card>
            </div>
          ))}

          {error && <Card className="p-4 text-red-500 bg-red-50">{error}</Card>}
        </div>
      </main>

      <footer className="sticky bottom-0 border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="container max-w-4xl flex gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !prompt.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
          </Button>
        </form>
      </footer>
    </div>
  )
}

