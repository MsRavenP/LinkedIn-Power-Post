import Groq from "groq-sdk"
import { NextRequest } from "next/server"
import { ChatMessage, Tone } from "@/types"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const QUESTION_SYSTEM_PROMPT = `You are a LinkedIn post creation assistant. Your job is to ask smart, targeted questions to help users craft powerful LinkedIn posts.

Ask ONE focused question at a time to extract the most valuable information. Focus on:
- The core message or insight they want to share
- Specific data, results, or metrics that support their story
- Their target audience
- The key takeaway or call-to-action
- Personal experiences or anecdotes that make it relatable

Keep questions concise and conversational. After 3-4 exchanges, you should have enough to generate great posts. When you feel ready, end your message with: "I have enough to create your posts! Click Generate below."

Do NOT generate the actual post yet — just ask questions.`

export async function POST(request: NextRequest) {
  const { messages, tone, mode }: { messages: ChatMessage[]; tone: Tone; mode: string } =
    await request.json()

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 1024,
    stream: true,
    messages: [
      {
        role: "system",
        content:
          QUESTION_SYSTEM_PROMPT +
          `\n\nThe user wants to create a ${tone} LinkedIn post for: ${
            mode === "both" ? "personal and company accounts" : `their ${mode} account`
          }.`,
      },
      ...messages.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
    ],
  })

  const encoder = new TextEncoder()
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ""
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  })
}
