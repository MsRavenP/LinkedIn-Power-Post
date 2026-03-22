import Groq from "groq-sdk"
import { NextRequest, NextResponse } from "next/server"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── AI CONTENT GENERATION ───────────────────────────────────────────────────

interface SingleImageContent {
  headline: string  // 4-8 words, punchy
  subtext: string   // 1 complete sentence, max 12 words
}

interface SlideContent {
  type: "cover" | "content" | "cta"
  title: string    // 3-7 words
  body?: string    // 1 complete sentence, max 15 words
  cta?: string     // CTA text for last slide
}

async function generateSingleContent(postContent: string): Promise<SingleImageContent> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 150,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You generate concise visual content for LinkedIn post images. Always respond with valid JSON only.",
      },
      {
        role: "user",
        content: `Based on this LinkedIn post, generate a bold visual headline and one supporting sentence for a graphic image.

Post:
${postContent}

Rules:
- headline: 4-8 words MAX, bold and punchy, captures the core message
- subtext: exactly 1 complete sentence, 10-14 words MAX, supports the headline

Return JSON: {"headline": "...", "subtext": "..."}`,
      },
    ],
  })
  const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}")
  return {
    headline: (raw.headline || "").substring(0, 60),
    subtext: (raw.subtext || "").substring(0, 100),
  }
}

async function generateCarouselContent(postContent: string, slideCount: number): Promise<SlideContent[]> {
  const contentSlides = slideCount - 2 // minus cover and CTA
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 600,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You generate concise slide content for LinkedIn carousel posts. Always respond with valid JSON only.",
      },
      {
        role: "user",
        content: `Based on this LinkedIn post, generate content for a ${slideCount}-slide carousel.

Post:
${postContent}

Rules:
- Cover slide: title is 3-7 words that capture the main topic
- Content slides (${contentSlides} slides): each has a title (3-6 words) and body (1 complete sentence, 10-15 words MAX). Each slide = one distinct insight or point from the post.
- CTA slide: a short follow/engage call-to-action (max 8 words)
- ALL text must be complete sentences or phrases — never cut off mid-word or mid-thought

Return JSON:
{
  "cover": { "title": "..." },
  "slides": [{ "title": "...", "body": "..." }, ...],
  "cta": "..."
}
(slides array should have exactly ${contentSlides} items)`,
      },
    ],
  })

  const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}")
  const result: SlideContent[] = []

  result.push({ type: "cover", title: (raw.cover?.title || "Key Insights").substring(0, 50) })

  const slides: { title: string; body: string }[] = raw.slides || []
  for (let i = 0; i < contentSlides; i++) {
    const s = slides[i] || { title: `Point ${i + 1}`, body: "" }
    result.push({
      type: "content",
      title: (s.title || "").substring(0, 50),
      body: (s.body || "").substring(0, 120),
    })
  }

  result.push({ type: "cta", cta: (raw.cta || "Follow for more insights").substring(0, 60) })
  return result
}

// ─── SVG UTILITIES ────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    if (lines.length >= maxLines) break
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines
}

type Theme = { bg1: string; bg2: string; accent: string; textSub: string }

function getTheme(content: string): Theme {
  const hash = content.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const themes: Theme[] = [
    { bg1: "#0F172A", bg2: "#1E3A5F", accent: "#38BDF8", textSub: "rgba(255,255,255,0.70)" },
    { bg1: "#1A0533", bg2: "#3B0764", accent: "#C084FC", textSub: "rgba(255,255,255,0.70)" },
    { bg1: "#022C22", bg2: "#0D4429", accent: "#34D399", textSub: "rgba(255,255,255,0.70)" },
    { bg1: "#1C0A00", bg2: "#431407", accent: "#FB923C", textSub: "rgba(255,255,255,0.70)" },
    { bg1: "#0A0F1E", bg2: "#0A3366", accent: "#FBBF24", textSub: "rgba(255,255,255,0.70)" },
  ]
  return themes[hash % themes.length]
}

function dotGrid(cols: number, rows: number, gap: number, color: string, opacity: number): string {
  const dots: string[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(`<circle cx="${c * gap + gap / 2}" cy="${r * gap + gap / 2}" r="1.8" fill="${color}" opacity="${opacity}"/>`)
    }
  }
  return dots.join("")
}

// ─── SINGLE IMAGE ─────────────────────────────────────────────────────────────

function buildSingleSVG(content: SingleImageContent, postContent: string): string {
  const theme = getTheme(postContent)

  const headlineLines = wrapText(escapeXml(content.headline), 20, 3)
  const subtextLines = wrapText(escapeXml(content.subtext), 38, 3)

  // Scale headline font based on length
  const fs = headlineLines.length === 1 ? 76 : headlineLines.length === 2 ? 68 : 58
  const lineH = fs + 20

  const titleStartY = Math.round(400 - ((headlineLines.length - 1) * lineH) / 2)
  const dividerY = titleStartY + headlineLines.length * lineH + 28
  const subStartY = dividerY + 52

  const titleEls = headlineLines
    .map((l, i) => `<text x="80" y="${titleStartY + i * lineH}" font-family="Arial Black, Arial, sans-serif" font-size="${fs}" font-weight="900" fill="white">${l}</text>`)
    .join("\n  ")

  const subEls = subtextLines
    .map((l, i) => `<text x="80" y="${subStartY + i * 46}" font-family="Arial, sans-serif" font-size="28" fill="${theme.textSub}">${l}</text>`)
    .join("\n  ")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.bg1}"/>
      <stop offset="100%" style="stop-color:${theme.bg2}"/>
    </linearGradient>
    <linearGradient id="acc" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${theme.accent}"/>
      <stop offset="100%" style="stop-color:${theme.accent};stop-opacity:0.6"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  ${dotGrid(12, 12, 88, theme.accent, 0.12)}
  <circle cx="0" cy="0" r="320" fill="none" stroke="${theme.accent}" stroke-width="1.5" opacity="0.09"/>
  <circle cx="1024" cy="1024" r="380" fill="none" stroke="${theme.accent}" stroke-width="1.5" opacity="0.07"/>
  <rect x="0" y="0" width="1024" height="7" fill="url(#acc)"/>
  <text x="55" y="330" font-family="Georgia, serif" font-size="280" font-weight="900" fill="${theme.accent}" opacity="0.08">"</text>
  <rect x="900" y="38" width="68" height="68" rx="13" fill="${theme.accent}"/>
  <text x="934" y="89" font-family="Arial Black, Arial, sans-serif" font-size="42" font-weight="900" fill="${theme.bg1}" text-anchor="middle">in</text>
  ${titleEls}
  <rect x="80" y="${dividerY}" width="180" height="6" rx="3" fill="url(#acc)"/>
  ${subEls}
  <rect x="0" y="928" width="1024" height="96" fill="rgba(0,0,0,0.45)"/>
  <rect x="0" y="928" width="7" height="96" fill="${theme.accent}"/>
  <text x="36" y="984" font-family="Arial, sans-serif" font-size="21" font-weight="700" fill="${theme.accent}" letter-spacing="5">LINKEDIN POWER POST</text>
</svg>`
}

// ─── CAROUSEL SLIDES ──────────────────────────────────────────────────────────

function buildCoverSlideSVG(slide: SlideContent, total: number, theme: Theme): string {
  const titleLines = wrapText(escapeXml(slide.title), 18, 3)
  const fs = titleLines.length === 1 ? 84 : titleLines.length === 2 ? 74 : 64
  const lineH = fs + 16
  const titleY = Math.round(420 - ((titleLines.length - 1) * lineH) / 2)

  const titleEls = titleLines
    .map((l, i) => `<text x="80" y="${titleY + i * lineH}" font-family="Arial Black, Arial, sans-serif" font-size="${fs}" font-weight="900" fill="white">${l}</text>`)
    .join("\n  ")

  const afterTitle = titleY + titleLines.length * lineH

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.bg1}"/>
      <stop offset="100%" style="stop-color:${theme.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  ${dotGrid(11, 11, 96, theme.accent, 0.11)}
  <polygon points="0,700 350,1024 0,1024" fill="${theme.accent}" opacity="0.08"/>
  <rect x="0" y="0" width="1024" height="7" fill="${theme.accent}"/>
  <text x="80" y="96" font-family="Arial, sans-serif" font-size="22" fill="${theme.accent}" letter-spacing="3" opacity="0.85">1 / ${total}</text>
  <rect x="790" y="56" width="174" height="48" rx="24" fill="${theme.accent}" opacity="0.18"/>
  <rect x="790" y="56" width="174" height="48" rx="24" fill="none" stroke="${theme.accent}" stroke-width="1.5" opacity="0.5"/>
  <text x="877" y="87" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="${theme.accent}" text-anchor="middle" letter-spacing="2">SWIPE &gt;&gt;</text>
  ${titleEls}
  <rect x="80" y="${afterTitle + 20}" width="200" height="7" rx="3.5" fill="${theme.accent}"/>
  <text x="80" y="${afterTitle + 86}" font-family="Arial, sans-serif" font-size="24" fill="${theme.accent}" opacity="0.8" letter-spacing="4">KEY INSIGHTS &amp; TAKEAWAYS</text>
  <rect x="80" y="916" width="60" height="60" rx="11" fill="${theme.accent}" opacity="0.9"/>
  <text x="110" y="960" font-family="Arial Black, Arial, sans-serif" font-size="36" font-weight="900" fill="${theme.bg1}" text-anchor="middle">in</text>
</svg>`
}

function buildContentSlideSVG(slide: SlideContent, slideNum: number, total: number, theme: Theme): string {
  const titleLines = wrapText(escapeXml(slide.title), 22, 2)
  const bodyLines = wrapText(escapeXml(slide.body || ""), 32, 4)

  const titleFs = titleLines.length === 1 ? 64 : 56
  const titleLineH = titleFs + 16
  const titleY = 220

  const bodyStartY = titleY + titleLines.length * titleLineH + 50

  const titleEls = titleLines
    .map((l, i) => `<text x="80" y="${titleY + i * titleLineH}" font-family="Arial Black, Arial, sans-serif" font-size="${titleFs}" font-weight="900" fill="white">${l}</text>`)
    .join("\n  ")

  const bodyEls = bodyLines
    .map((l, i) => `<text x="80" y="${bodyStartY + i * 52}" font-family="Arial, sans-serif" font-size="34" fill="rgba(255,255,255,0.80)">${l}</text>`)
    .join("\n  ")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg${slideNum}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.bg1}"/>
      <stop offset="100%" style="stop-color:${theme.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg${slideNum})"/>
  ${dotGrid(9, 9, 115, theme.accent, 0.09)}
  <text x="900" y="820" font-family="Arial Black, Arial, sans-serif" font-size="600" font-weight="900" fill="${theme.accent}" opacity="0.05" text-anchor="middle">${slideNum - 1}</text>
  <rect x="0" y="0" width="1024" height="7" fill="${theme.accent}"/>
  <text x="80" y="96" font-family="Arial, sans-serif" font-size="22" fill="${theme.accent}" letter-spacing="3" opacity="0.85">${slideNum} / ${total}</text>
  <rect x="80" y="130" width="84" height="84" rx="16" fill="${theme.accent}" opacity="0.14"/>
  <rect x="80" y="130" width="84" height="84" rx="16" fill="none" stroke="${theme.accent}" stroke-width="2" opacity="0.5"/>
  <text x="122" y="190" font-family="Arial Black, Arial, sans-serif" font-size="46" font-weight="900" fill="${theme.accent}" text-anchor="middle">${slideNum - 1}</text>
  ${titleEls}
  <rect x="80" y="${titleY + titleLines.length * titleLineH + 16}" width="130" height="5" rx="2.5" fill="${theme.accent}" opacity="0.8"/>
  ${bodyEls}
  <rect x="80" y="924" width="52" height="52" rx="9" fill="${theme.accent}" opacity="0.85"/>
  <text x="106" y="962" font-family="Arial Black, Arial, sans-serif" font-size="31" font-weight="900" fill="${theme.bg1}" text-anchor="middle">in</text>
</svg>`
}

function buildCtaSlideSVG(slide: SlideContent, slideNum: number, total: number, theme: Theme): string {
  const ctaLines = wrapText(escapeXml(slide.cta || "Follow for more insights"), 28, 2)

  const ctaEls = ctaLines
    .map((l, i) => `<text x="512" y="${598 + i * 52}" font-family="Arial, sans-serif" font-size="32" fill="${theme.accent}" text-anchor="middle">${l}</text>`)
    .join("\n  ")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bgCta" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.bg1}"/>
      <stop offset="100%" style="stop-color:${theme.bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${theme.accent};stop-opacity:0.18"/>
      <stop offset="100%" style="stop-color:${theme.accent};stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bgCta)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <circle cx="512" cy="500" r="380" fill="none" stroke="${theme.accent}" stroke-width="1.5" opacity="0.1"/>
  <circle cx="512" cy="500" r="290" fill="none" stroke="${theme.accent}" stroke-width="1" opacity="0.08"/>
  <rect x="0" y="0" width="1024" height="7" fill="${theme.accent}"/>
  <text x="80" y="96" font-family="Arial, sans-serif" font-size="22" fill="${theme.accent}" letter-spacing="3" opacity="0.85">${slideNum} / ${total}</text>
  <text x="512" y="390" font-family="Arial Black, Arial, sans-serif" font-size="80" font-weight="900" fill="white" text-anchor="middle">Thanks for</text>
  <text x="512" y="482" font-family="Arial Black, Arial, sans-serif" font-size="80" font-weight="900" fill="white" text-anchor="middle">reading!</text>
  <rect x="312" y="520" width="400" height="6" rx="3" fill="${theme.accent}"/>
  ${ctaEls}
  <rect x="432" y="676" width="160" height="160" rx="28" fill="${theme.accent}"/>
  <text x="512" y="790" font-family="Arial Black, Arial, sans-serif" font-size="96" font-weight="900" fill="${theme.bg1}" text-anchor="middle">in</text>
  <text x="512" y="880" font-family="Arial, sans-serif" font-size="24" fill="${theme.accent}" text-anchor="middle" opacity="0.75" letter-spacing="3">LINKEDIN POWER POST</text>
</svg>`
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { postContent, type, slideCount }: { postContent: string; type: "single" | "carousel"; slideCount?: number } =
    await request.json()

  if (type === "single") {
    const content = await generateSingleContent(postContent)
    return NextResponse.json({ images: [svgToDataUrl(buildSingleSVG(content, postContent))], type: "single" })
  }

  const count = Math.max(3, slideCount || 5)
  const slides = await generateCarouselContent(postContent, count)
  const theme = getTheme(postContent)

  const images = slides.map((slide, i) => {
    if (slide.type === "cover") return svgToDataUrl(buildCoverSlideSVG(slide, count, theme))
    if (slide.type === "cta") return svgToDataUrl(buildCtaSlideSVG(slide, i + 1, count, theme))
    return svgToDataUrl(buildContentSlideSVG(slide, i + 1, count, theme))
  })

  return NextResponse.json({ images, type: "carousel" })
}
