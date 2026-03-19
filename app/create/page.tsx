"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import ToneSelector from "@/components/post/ToneSelector"
import ChatInterface from "@/components/chat/ChatInterface"
import PostDisplay from "@/components/post/PostDisplay"
import ImageGenerator from "@/components/image/ImageGenerator"
import { ChatMessage, GeneratedPosts, PostMode, Tone } from "@/types"
import { toast } from "sonner"
import { Loader2, Sparkles, RotateCcw, User, Building2, Users, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Step = "setup" | "chat" | "posts" | "images"

export default function CreatePage() {
  const [step, setStep] = useState<Step>("setup")
  const [tone, setTone] = useState<Tone>("thought-leadership")
  const [mode, setMode] = useState<PostMode>("both")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPosts | null>(null)
  const [bestPostContent, setBestPostContent] = useState("")

  async function handleStartChat() {
    if (messages.length === 0) {
      // Trigger the first assistant question
      await sendToChat([], "Let's create a great LinkedIn post! What's the topic or idea you want to share?")
    }
    setStep("chat")
  }

  async function sendToChat(currentMessages: ChatMessage[], initialMessage?: string) {
    const userMessage: ChatMessage | null = initialMessage
      ? null
      : { role: "user", content: userInput }

    const newMessages = userMessage ? [...currentMessages, userMessage] : currentMessages

    if (!initialMessage) {
      setMessages(newMessages)
      setUserInput("")
    }

    setIsStreaming(true)
    setStreamingText("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: initialMessage
            ? [{ role: "user", content: initialMessage }]
            : newMessages,
          tone,
          mode,
        }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        fullText += chunk
        setStreamingText(fullText)
      }

      const assistantMessage: ChatMessage = { role: "assistant", content: fullText }
      const finalMessages = [...newMessages, assistantMessage]
      setMessages(finalMessages)
      setStreamingText("")

      // Check if AI indicated it's ready to generate
      if (fullText.toLowerCase().includes("click generate below") ||
          fullText.toLowerCase().includes("i have enough")) {
        toast.info("Ready to generate! Click 'Generate Posts' when you're ready.")
      }
    } catch {
      toast.error("Connection error. Please try again.")
    } finally {
      setIsStreaming(false)
    }
  }

  async function handleSendMessage() {
    if (!userInput.trim() || isStreaming) return
    await sendToChat(messages)
  }

  async function handleGeneratePosts() {
    if (messages.length < 2) {
      toast.error("Please have a conversation first before generating posts.")
      return
    }

    setIsGenerating(true)

    try {
      // Fetch brand profile for company posts
      let brandProfile: string | undefined
      if (mode === "company" || mode === "both") {
        const bpRes = await fetch("/api/brand-profile")
        const bp = await bpRes.json()
        if (bp) {
          brandProfile = `Company: ${bp.company_name}, Industry: ${bp.industry}, Tone: ${bp.tone_description}, Audience: ${bp.target_audience}`
        }
      }

      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, tone, mode, brandProfile }),
      })

      const data: GeneratedPosts = await res.json()
      setGeneratedPosts(data)

      // Set best post content for image generation
      const content = data.personal?.variation1 || data.company?.variation1 || ""
      setBestPostContent(content)

      // Save to history
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: messages[0]?.content?.substring(0, 100) ?? "LinkedIn Post",
          tone,
          mode,
          personal_variation1: data.personal?.variation1,
          personal_variation2: data.personal?.variation2,
          company_variation1: data.company?.variation1,
          company_variation2: data.company?.variation2,
        }),
      })

      setStep("posts")
      toast.success("Posts generated successfully!")
    } catch {
      toast.error("Failed to generate posts. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  function handleReset() {
    setStep("setup")
    setMessages([])
    setUserInput("")
    setGeneratedPosts(null)
    setBestPostContent("")
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Create Post</h1>
          <div className="flex items-center gap-2 mt-1">
            {["setup", "chat", "posts", "images"].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  s === step ? "bg-[#0077B5]" : ["setup", "chat", "posts", "images"].indexOf(s) < ["setup", "chat", "posts", "images"].indexOf(step) ? "bg-green-500" : "bg-gray-200"
                )} />
                {i < 3 && <div className="w-4 h-px bg-gray-200" />}
              </div>
            ))}
            <span className="text-xs text-muted-foreground ml-1 capitalize">{step}</span>
          </div>
        </div>
        {step !== "setup" && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2 text-gray-500">
            <RotateCcw className="h-4 w-4" /> Start over
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left panel */}
        <div className={cn(
          "flex flex-col border-r border-border bg-white",
          step === "chat" ? "w-1/2" : "w-full max-w-2xl mx-auto"
        )}>
          {step === "setup" && (
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Post Mode */}
              <div>
                <h2 className="font-semibold mb-3">Post for</h2>
                <div className="flex gap-3">
                  {[
                    { value: "personal" as PostMode, label: "Personal", icon: User },
                    { value: "company" as PostMode, label: "Company", icon: Building2 },
                    { value: "both" as PostMode, label: "Both", icon: Users },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setMode(value)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-2 py-4 rounded-lg border-2 transition-all",
                        mode === value
                          ? "border-[#0077B5] bg-blue-50 text-[#0077B5]"
                          : "border-border text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Tone */}
              <div>
                <h2 className="font-semibold mb-3">Select Tone</h2>
                <ToneSelector value={tone} onChange={setTone} />
              </div>

              <Separator />

              <Button
                onClick={handleStartChat}
                size="lg"
                className="w-full bg-[#0077B5] hover:bg-[#006097] gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Start Creating
              </Button>
            </div>
          )}

          {step === "chat" && (
            <>
              {/* Settings summary */}
              <div className="px-4 py-2 border-b border-border flex items-center gap-2 bg-gray-50">
                <Badge variant="secondary" className="text-xs">{tone.replace("-", " ")}</Badge>
                <Badge variant="secondary" className="text-xs capitalize">{mode}</Badge>
              </div>

              <ChatInterface
                messages={messages}
                isStreaming={isStreaming}
                streamingText={streamingText}
              />

              {/* Input */}
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex gap-2">
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Share your idea or answer the question..."
                    className="resize-none min-h-[80px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    disabled={isStreaming}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isStreaming}
                    className="flex-1"
                  >
                    {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                  </Button>
                  <Button
                    onClick={handleGeneratePosts}
                    disabled={messages.length < 2 || isGenerating || isStreaming}
                    className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                  >
                    {isGenerating ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Generate Posts</>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {(step === "posts" || step === "images") && generatedPosts && (
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Your Posts</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("images")}
                  className="gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  {step === "images" ? "Viewing images" : "Add images"}
                </Button>
              </div>
              <PostDisplay posts={generatedPosts} />
            </div>
          )}
        </div>

        {/* Right panel — Image Generator (only on posts/images step) */}
        {(step === "posts" || step === "images") && (
          <div className="flex-1 p-6 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-[#0077B5]" />
                  Generate Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageGenerator postContent={bestPostContent} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
