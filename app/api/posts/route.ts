import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  // Explicitly pick only known columns so unknown fields don't cause PostgREST errors
  const record = {
    user_id: user.id,
    topic: body.topic ?? null,
    tone: body.tone ?? null,
    mode: body.mode ?? null,
    post_type: body.mode ?? "single",
    personal_variation1: body.personal_variation1 ?? null,
    personal_variation2: body.personal_variation2 ?? null,
    company_variation1: body.company_variation1 ?? null,
    company_variation2: body.company_variation2 ?? null,
    image_url: body.image_url ?? null,
    // content is nullable after migration — use first available variation as fallback
    content: body.content ?? body.personal_variation1 ?? body.company_variation1 ?? null,
  }

  const { data, error } = await supabase
    .from("posts")
    .insert(record)
    .select()
    .single()

  if (error) {
    console.error("POST /api/posts error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
