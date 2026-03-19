"use client"

import { useEffect, useRef } from "react"
import { ChatMessage } from "@/types"
import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"

interface ChatInterfaceProps {
  messages: ChatMessage[]
  isStreaming: boolean
  streamingText: string
}

export default function ChatInterface({ messages, isStreaming, streamingText }: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingText])

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.length === 0 && !isStreaming && (
        <div className="flex items-center justify-center h-full text-center text-muted-foreground py-12">
          <div>
            <Bot className="h-12 w-12 mx-auto mb-3 text-[#0077B5] opacity-50" />
            <p className="font-medium">Start by telling me what you want to post about</p>
            <p className="text-sm mt-1">I'll ask a few questions to make your post shine ✨</p>
          </div>
        </div>
      )}

      {messages.map((message, index) => (
        <div
          key={index}
          className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "flex-row")}
        >
          <div
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              message.role === "user" ? "bg-[#0077B5]" : "bg-gray-100"
            )}
          >
            {message.role === "user" ? (
              <User className="h-4 w-4 text-white" />
            ) : (
              <Bot className="h-4 w-4 text-gray-600" />
            )}
          </div>
          <div
            className={cn(
              "max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
              message.role === "user"
                ? "bg-[#0077B5] text-white rounded-tr-sm"
                : "bg-gray-100 text-gray-900 rounded-tl-sm"
            )}
          >
            {message.content}
          </div>
        </div>
      ))}

      {isStreaming && streamingText && (
        <div className="flex gap-3 flex-row">
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
            <Bot className="h-4 w-4 text-gray-600" />
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm whitespace-pre-wrap bg-gray-100 text-gray-900">
            {streamingText}
            <span className="inline-block w-2 h-4 bg-gray-400 ml-0.5 animate-pulse" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
