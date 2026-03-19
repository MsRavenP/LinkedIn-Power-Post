export type Tone =
  | "thought-leadership"
  | "storytelling"
  | "educational"
  | "promotional"
  | "inspirational"
  | "conversational"

export type PostMode = "personal" | "company" | "both"

export type ImageType = "single" | "carousel"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface GeneratedPost {
  variation1: string
  variation2: string
}

export interface GeneratedPosts {
  personal?: GeneratedPost
  company?: GeneratedPost
}

export interface BrandProfile {
  id?: string
  company_name: string
  industry: string
  tone_description: string
  target_audience: string
  example_language: string
  taglines: string
  team_id?: string
}

export interface PostRecord {
  id: string
  created_at: string
  user_id: string
  topic: string
  tone: Tone
  mode: PostMode
  personal_variation1?: string
  personal_variation2?: string
  company_variation1?: string
  company_variation2?: string
  image_urls?: string[]
  image_type?: ImageType
}

export interface GenerateImageRequest {
  prompt: string
  type: ImageType
  slideCount?: number
}

export const TONE_OPTIONS: { value: Tone; label: string; description: string }[] = [
  {
    value: "thought-leadership",
    label: "Thought Leadership",
    description: "Position yourself as an expert with bold insights",
  },
  {
    value: "storytelling",
    label: "Storytelling",
    description: "Engage with personal narratives and experiences",
  },
  {
    value: "educational",
    label: "Educational",
    description: "Teach your audience something valuable",
  },
  {
    value: "promotional",
    label: "Promotional",
    description: "Highlight products, services, or achievements",
  },
  {
    value: "inspirational",
    label: "Inspirational",
    description: "Motivate and uplift your audience",
  },
  {
    value: "conversational",
    label: "Conversational",
    description: "Start a dialogue and spark engagement",
  },
]
