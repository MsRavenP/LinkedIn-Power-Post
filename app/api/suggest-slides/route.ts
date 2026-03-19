import Groq from "groq-sdk"
import { NextRequest, NextResponse } from "next/server"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: NextRequest) {
  const { postContent }: { postContent: string } = await request.json()

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 128,
    messages: [
      {
        role: "user",
        content: `Based on this LinkedIn post content, suggest the ideal number of carousel slides (between 3 and 10).
Return ONLY a JSON object: {"slideCount": number, "reason": "brief reason"}

Post: ${postContent.substring(0, 500)}`,
      },
    ],
  })

  const text = completion.choices[0]?.message?.content ?? ""
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return NextResponse.json(JSON.parse(jsonMatch[0]))
  }

  return NextResponse.json({ slideCount: 5, reason: "Standard carousel length" })
}
