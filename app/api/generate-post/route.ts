import Groq from "groq-sdk"
import { NextRequest, NextResponse } from "next/server"
import { ChatMessage, Tone, PostMode, GeneratedPosts } from "@/types"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

function buildPersonalPrompt(conversation: string, tone: Tone): string {
  return `Based on this conversation, write 2 variations of a LinkedIn post for a PERSONAL account.

Conversation:
${conversation}

Requirements:
- Write in FIRST PERSON (I, my, we)
- Tone: ${tone}
- Length: 150-300 words
- Include relevant emojis
- End with a question or call-to-action to drive engagement
- Use line breaks for readability (LinkedIn formatting)
- Do NOT include hashtags (user will add their own)

Return a JSON object with exactly this structure (no extra keys):
{"variation1": "full post text here", "variation2": "full post text here"}`
}

function buildCompanyPrompt(conversation: string, tone: Tone, brandProfile?: string): string {
  return `Based on this conversation, write 2 variations of a LinkedIn post for a COMPANY account.

Conversation:
${conversation}

${brandProfile ? `Company Brand Profile:\n${brandProfile}\n` : ""}

Requirements:
- Write in a professional brand voice (use "we", "our team", or company name if provided)
- Tone: ${tone}
- Length: 150-300 words
- Include relevant emojis
- End with a question or call-to-action
- Use line breaks for readability (LinkedIn formatting)
- Do NOT include hashtags (user will add their own)

Return a JSON object with exactly this structure (no extra keys):
{"variation1": "full post text here", "variation2": "full post text here"}`
}

export async function POST(request: NextRequest) {
  const {
    messages,
    tone,
    mode,
    brandProfile,
  }: {
    messages: ChatMessage[]
    tone: Tone
    mode: PostMode
    brandProfile?: string
  } = await request.json()

  const conversation = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n")

  const results: GeneratedPosts = {}
  const promises: Promise<void>[] = []

  if (mode === "personal" || mode === "both") {
    promises.push(
      (async () => {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          max_tokens: 2048,
          // JSON mode forces the model to return valid, well-formed JSON
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are a LinkedIn post writer. Always respond with valid JSON only.",
            },
            { role: "user", content: buildPersonalPrompt(conversation, tone) },
          ],
        })
        const text = completion.choices[0]?.message?.content ?? ""
        results.personal = JSON.parse(text)
      })()
    )
  }

  if (mode === "company" || mode === "both") {
    promises.push(
      (async () => {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          max_tokens: 2048,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are a LinkedIn post writer. Always respond with valid JSON only.",
            },
            { role: "user", content: buildCompanyPrompt(conversation, tone, brandProfile) },
          ],
        })
        const text = completion.choices[0]?.message?.content ?? ""
        results.company = JSON.parse(text)
      })()
    )
  }

  try {
    await Promise.all(promises)
  } catch (err) {
    console.error("generate-post error:", err)
    return NextResponse.json({ error: "Failed to generate posts" }, { status: 500 })
  }

  if (!results.personal && !results.company) {
    return NextResponse.json({ error: "No posts generated" }, { status: 500 })
  }

  return NextResponse.json(results)
}
