import { NextRequest, NextResponse } from "next/server"

function stripEmojis(str: string): string {
  return str
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/[\u2600-\u27BF]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function extractKeyPoints(content: string, count: number): string[] {
  content = stripEmojis(content)
  const sentences = content
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 160)
  const points: string[] = []
  for (const s of sentences) {
    if (points.length >= count) break
    points.push(s)
  }
  while (points.length < count) {
    points.push(content.substring(0, 90).trim())
  }
  return points
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim())
      current = word
    } else {
      current = (current + " " + word).trim()
    }
  }
  if (current) lines.push(current.trim())
  return lines
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

type Theme = { bg1: string; bg2: string; accent: string; textSub: string }

function getTheme(content: string): Theme {
  const hash = content.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const themes: Theme[] = [
    { bg1: "#0F172A", bg2: "#1E3A5F", accent: "#38BDF8", textSub: "rgba(255,255,255,0.65)" },
    { bg1: "#1A0533", bg2: "#3B0764", accent: "#C084FC", textSub: "rgba(255,255,255,0.65)" },
    { bg1: "#022C22", bg2: "#0D4429", accent: "#34D399", textSub: "rgba(255,255,255,0.65)" },
    { bg1: "#1C0A00", bg2: "#431407", accent: "#FB923C", textSub: "rgba(255,255,255,0.65)" },
    { bg1: "#0A0F1E", bg2: "#0A3366", accent: "#FBBF24", textSub: "rgba(255,255,255,0.65)" },
  ]
  return themes[hash % themes.length]
}

function dotGrid(cols: number, rows: number, gap: number, color: string, opacity: number): string {
  const dots: string[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        `<circle cx="${c * gap + gap / 2}" cy="${r * gap + gap / 2}" r="1.8" fill="${color}" opacity="${opacity}"/>`
      )
    }
  }
  return dots.join("")
}

// ─── SINGLE IMAGE ────────────────────────────────────────────────────────────

function buildSingleSVG(content: string): string {
  const clean = stripEmojis(content)
  const points = extractKeyPoints(clean, 3)
  const theme = getTheme(clean)

  const headline = escapeXml(points[0].substring(0, 85))
  const headlineLines = wrapText(headline, 21)
  const sub = escapeXml(points[1]?.substring(0, 130) || "")
  const subLines = wrapText(sub, 40)

  const fs = headlineLines.length <= 2 ? 74 : 60
  const lineH = fs + 18
  // Center the headline block vertically around y=430
  const titleStartY = Math.round(430 - ((headlineLines.length - 1) * lineH) / 2)
  const dividerY = titleStartY + headlineLines.length * lineH + 24
  const subStartY = dividerY + 56

  const titleTextEls = headlineLines
    .map((l, i) => `<text x="80" y="${titleStartY + i * lineH}" font-family="Arial Black, Arial, sans-serif" font-size="${fs}" font-weight="900" fill="white">${l}</text>`)
    .join("\n  ")

  const subTextEls = subLines
    .map((l, i) => `<text x="80" y="${subStartY + i * 44}" font-family="Arial, sans-serif" font-size="28" fill="${theme.textSub}">${l}</text>`)
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

  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bg)"/>

  <!-- Dot grid -->
  ${dotGrid(12, 12, 88, theme.accent, 0.12)}

  <!-- Decorative arcs -->
  <circle cx="0" cy="0" r="320" fill="none" stroke="${theme.accent}" stroke-width="1.5" opacity="0.09"/>
  <circle cx="0" cy="0" r="200" fill="none" stroke="${theme.accent}" stroke-width="1" opacity="0.07"/>
  <circle cx="1024" cy="1024" r="380" fill="none" stroke="${theme.accent}" stroke-width="1.5" opacity="0.07"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="1024" height="7" fill="url(#acc)"/>

  <!-- Big decorative quote mark -->
  <text x="55" y="330" font-family="Georgia, serif" font-size="280" font-weight="900" fill="${theme.accent}" opacity="0.08">"</text>

  <!-- LinkedIn logo -->
  <rect x="900" y="38" width="68" height="68" rx="13" fill="${theme.accent}"/>
  <text x="934" y="89" font-family="Arial Black, Arial, sans-serif" font-size="42" font-weight="900" fill="${theme.bg1}" text-anchor="middle">in</text>

  <!-- Headline -->
  ${titleTextEls}

  <!-- Accent underline -->
  <rect x="80" y="${dividerY}" width="180" height="6" rx="3" fill="url(#acc)"/>

  <!-- Sub text -->
  ${subTextEls}

  <!-- Bottom bar -->
  <rect x="0" y="928" width="1024" height="96" fill="rgba(0,0,0,0.45)"/>
  <rect x="0" y="928" width="7" height="96" fill="${theme.accent}"/>
  <text x="36" y="984" font-family="Arial, sans-serif" font-size="21" font-weight="700" fill="${theme.accent}" letter-spacing="5">LINKEDIN POWER POST</text>
</svg>`
}

// ─── CAROUSEL SLIDES ─────────────────────────────────────────────────────────

function buildCoverSlide(content: string, total: number, theme: Theme): string {
  const points = extractKeyPoints(content, 3)
  const headline = escapeXml(points[0].substring(0, 65))
  const headlineLines = wrapText(headline, 18)
  const lineH = 92
  const titleY = 400 - Math.round(((headlineLines.length - 1) * lineH) / 2)

  const titleEls = headlineLines
    .map((l, i) => `<text x="80" y="${titleY + i * lineH}" font-family="Arial Black, Arial, sans-serif" font-size="82" font-weight="900" fill="white">${l}</text>`)
    .join("\n  ")

  const afterTitle = titleY + headlineLines.length * lineH

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.bg1}"/>
      <stop offset="100%" style="stop-color:${theme.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>

  <!-- Dot grid -->
  ${dotGrid(11, 11, 96, theme.accent, 0.11)}

  <!-- Diagonal fill -->
  <polygon points="0,700 350,1024 0,1024" fill="${theme.accent}" opacity="0.08"/>

  <!-- Top bar -->
  <rect x="0" y="0" width="1024" height="7" fill="${theme.accent}"/>

  <!-- Slide counter -->
  <text x="80" y="96" font-family="Arial, sans-serif" font-size="22" fill="${theme.accent}" letter-spacing="3" opacity="0.85">1 / ${total}</text>

  <!-- Swipe pill -->
  <rect x="790" y="56" width="174" height="48" rx="24" fill="${theme.accent}" opacity="0.18"/>
  <rect x="790" y="56" width="174" height="48" rx="24" fill="none" stroke="${theme.accent}" stroke-width="1.5" opacity="0.5"/>
  <text x="877" y="87" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="${theme.accent}" text-anchor="middle" letter-spacing="2">SWIPE &gt;&gt;</text>

  <!-- Big faded "1" watermark -->
  <text x="960" y="820" font-family="Arial Black, Arial, sans-serif" font-size="750" font-weight="900" fill="${theme.accent}" opacity="0.04" text-anchor="middle">1</text>

  <!-- Headline -->
  ${titleEls}

  <!-- Accent line -->
  <rect x="80" y="${afterTitle + 18}" width="200" height="7" rx="3.5" fill="${theme.accent}"/>

  <!-- Subtitle label -->
  <text x="80" y="${afterTitle + 84}" font-family="Arial, sans-serif" font-size="24" fill="${theme.accent}" opacity="0.8" letter-spacing="4">KEY INSIGHTS &amp; TAKEAWAYS</text>

  <!-- LinkedIn logo bottom -->
  <rect x="80" y="916" width="60" height="60" rx="11" fill="${theme.accent}" opacity="0.9"/>
  <text x="110" y="960" font-family="Arial Black, Arial, sans-serif" font-size="36" font-weight="900" fill="${theme.bg1}" text-anchor="middle">in</text>
</svg>`
}

function buildContentSlide(content: string, slideNum: number, total: number, theme: Theme, points: string[]): string {
  const pointIndex = slideNum - 1
  const point = escapeXml(points[Math.min(pointIndex, points.length - 1)] || content.substring(0, 100))
  const lines = wrapText(point, 27)
  const lineH = 80
  const textStartY = 360 - Math.round(((lines.length - 1) * lineH) / 2)

  const textEls = lines
    .map((l, i) => `<text x="80" y="${textStartY + i * lineH}" font-family="Arial Black, Arial, sans-serif" font-size="60" font-weight="900" fill="white">${l}</text>`)
    .join("\n  ")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg${slideNum}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.bg1}"/>
      <stop offset="100%" style="stop-color:${theme.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg${slideNum})"/>

  <!-- Dot grid -->
  ${dotGrid(9, 9, 115, theme.accent, 0.09)}

  <!-- Faded number watermark -->
  <text x="900" y="820" font-family="Arial Black, Arial, sans-serif" font-size="650" font-weight="900" fill="${theme.accent}" opacity="0.05" text-anchor="middle">${slideNum - 1}</text>

  <!-- Top bar -->
  <rect x="0" y="0" width="1024" height="7" fill="${theme.accent}"/>

  <!-- Slide counter -->
  <text x="80" y="96" font-family="Arial, sans-serif" font-size="22" fill="${theme.accent}" letter-spacing="3" opacity="0.85">${slideNum} / ${total}</text>

  <!-- Numbered box -->
  <rect x="80" y="140" width="84" height="84" rx="16" fill="${theme.accent}" opacity="0.14"/>
  <rect x="80" y="140" width="84" height="84" rx="16" fill="none" stroke="${theme.accent}" stroke-width="2" opacity="0.5"/>
  <text x="122" y="200" font-family="Arial Black, Arial, sans-serif" font-size="46" font-weight="900" fill="${theme.accent}" text-anchor="middle">${slideNum - 1}</text>

  <!-- Content text -->
  ${textEls}

  <!-- Accent underline -->
  <rect x="80" y="${textStartY + lines.length * lineH + 28}" width="130" height="5" rx="2.5" fill="${theme.accent}" opacity="0.65"/>

  <!-- LinkedIn logo -->
  <rect x="80" y="924" width="52" height="52" rx="9" fill="${theme.accent}" opacity="0.85"/>
  <text x="106" y="962" font-family="Arial Black, Arial, sans-serif" font-size="31" font-weight="900" fill="${theme.bg1}" text-anchor="middle">in</text>
</svg>`
}

function buildCtaSlide(slideNum: number, total: number, theme: Theme): string {
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

  <!-- Concentric rings -->
  <circle cx="512" cy="500" r="380" fill="none" stroke="${theme.accent}" stroke-width="1.5" opacity="0.1"/>
  <circle cx="512" cy="500" r="290" fill="none" stroke="${theme.accent}" stroke-width="1" opacity="0.08"/>
  <circle cx="512" cy="500" r="200" fill="none" stroke="${theme.accent}" stroke-width="1" opacity="0.06"/>

  <!-- Top bar -->
  <rect x="0" y="0" width="1024" height="7" fill="${theme.accent}"/>

  <!-- Slide counter -->
  <text x="80" y="96" font-family="Arial, sans-serif" font-size="22" fill="${theme.accent}" letter-spacing="3" opacity="0.85">${slideNum} / ${total}</text>

  <!-- Main message -->
  <text x="512" y="390" font-family="Arial Black, Arial, sans-serif" font-size="80" font-weight="900" fill="white" text-anchor="middle">Thanks for</text>
  <text x="512" y="482" font-family="Arial Black, Arial, sans-serif" font-size="80" font-weight="900" fill="white" text-anchor="middle">reading!</text>

  <!-- Divider -->
  <rect x="312" y="520" width="400" height="6" rx="3" fill="${theme.accent}"/>

  <!-- CTA text -->
  <text x="512" y="598" font-family="Arial, sans-serif" font-size="30" fill="${theme.accent}" text-anchor="middle">Follow for more insights like this</text>

  <!-- Big LinkedIn logo -->
  <rect x="432" y="660" width="160" height="160" rx="28" fill="${theme.accent}"/>
  <text x="512" y="774" font-family="Arial Black, Arial, sans-serif" font-size="96" font-weight="900" fill="${theme.bg1}" text-anchor="middle">in</text>
  <text x="512" y="870" font-family="Arial, sans-serif" font-size="24" fill="${theme.accent}" text-anchor="middle" opacity="0.75" letter-spacing="3">LINKEDIN POWER POST</text>
</svg>`
}

function buildSlideSVG(content: string, slideNum: number, total: number, isFirst: boolean, isLast: boolean): string {
  const clean = stripEmojis(content)
  const theme = getTheme(clean)
  const points = extractKeyPoints(clean, total + 2)

  if (isFirst) return buildCoverSlide(clean, total, theme)
  if (isLast) return buildCtaSlide(slideNum, total, theme)
  return buildContentSlide(clean, slideNum, total, theme, points)
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

export async function POST(request: NextRequest) {
  const { postContent, type, slideCount }: { postContent: string; type: "single" | "carousel"; slideCount?: number } =
    await request.json()

  if (type === "single") {
    return NextResponse.json({ images: [svgToDataUrl(buildSingleSVG(postContent))], type: "single" })
  }

  const count = Math.max(3, slideCount || 5)
  const images = Array.from({ length: count }, (_, i) =>
    svgToDataUrl(buildSlideSVG(postContent, i + 1, count, i === 0, i === count - 1))
  )
  return NextResponse.json({ images, type: "carousel" })
}
