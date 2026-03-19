"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Image as ImageIcon, Loader2, Download, ChevronLeft, ChevronRight, LayoutGrid, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageGeneratorProps {
  postContent: string
}

export default function ImageGenerator({ postContent }: ImageGeneratorProps) {
  const [type, setType] = useState<"single" | "carousel">("single")
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestingSlides, setSuggestingSlides] = useState(false)
  const [slideCount, setSlideCount] = useState<number | null>(null)
  const [slideReason, setSlideReason] = useState("")
  const [currentSlide, setCurrentSlide] = useState(0)

  async function suggestSlides() {
    setSuggestingSlides(true)
    try {
      const res = await fetch("/api/suggest-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postContent }),
      })
      const data = await res.json()
      setSlideCount(data.slideCount)
      setSlideReason(data.reason)
      toast.info(`Suggested ${data.slideCount} slides: ${data.reason}`)
    } catch {
      toast.error("Could not suggest slides")
    } finally {
      setSuggestingSlides(false)
    }
  }

  async function handleGenerate() {
    if (!postContent.trim()) {
      toast.error("Generate a post first before creating images")
      return
    }

    setLoading(true)
    setImages([])

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postContent,
          type,
          slideCount: slideCount ?? 5,
        }),
      })

      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
      } else {
        setImages(data.images)
        setCurrentSlide(0)
        toast.success(`${type === "single" ? "Image" : `${data.images.length} slides`} generated!`)
      }
    } catch {
      toast.error("Image generation failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function downloadImage(url: string, index: number) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = `linkedin-post-${type === "carousel" ? `slide-${index + 1}` : "image"}.png`
      a.click()
      URL.revokeObjectURL(objectUrl)
      toast.success("Image downloaded!")
    } catch {
      toast.error("Download failed. Try right-clicking the image instead.")
    }
  }

  function downloadAll() {
    images.forEach((img, i) => downloadImage(img, i))
  }

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setType("single")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
            type === "single"
              ? "border-[#0077B5] bg-blue-50 text-[#0077B5]"
              : "border-border text-gray-600 hover:border-gray-300"
          )}
        >
          <Square className="h-4 w-4" /> Single Image
        </button>
        <button
          onClick={() => {
            setType("carousel")
            if (!slideCount) suggestSlides()
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
            type === "carousel"
              ? "border-[#0077B5] bg-blue-50 text-[#0077B5]"
              : "border-border text-gray-600 hover:border-gray-300"
          )}
        >
          <LayoutGrid className="h-4 w-4" /> Carousel
        </button>
      </div>

      {/* Slide count suggestion */}
      {type === "carousel" && (
        <div className="flex items-center gap-2 text-sm">
          {suggestingSlides ? (
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Suggesting slides...
            </span>
          ) : slideCount ? (
            <span className="text-muted-foreground">
              Suggested: <Badge variant="secondary">{slideCount} slides</Badge>
              <span className="ml-1 text-xs">{slideReason}</span>
            </span>
          ) : null}
        </div>
      )}

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-[#0077B5] hover:bg-[#006097] gap-2"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Generating{type === "carousel" ? " carousel..." : " image..."}</>
        ) : (
          <><ImageIcon className="h-4 w-4" /> Generate {type === "carousel" ? "Carousel" : "Image"}</>
        )}
      </Button>

      {/* Image preview */}
      {images.length > 0 && (
        <div className="space-y-3">
          {type === "single" ? (
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[0]} alt="Generated LinkedIn post image" className="w-full rounded-lg border" />
              <Button
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-1.5"
                onClick={() => downloadImage(images[0], 0)}
              >
                <Download className="h-3 w-3" /> Download
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[currentSlide]}
                  alt={`Slide ${currentSlide + 1}`}
                  className="w-full rounded-lg border"
                />
                {images.length > 1 && (
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 opacity-80 hover:opacity-100"
                      onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
                      disabled={currentSlide === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 opacity-80 hover:opacity-100"
                      onClick={() => setCurrentSlide((p) => Math.min(images.length - 1, p + 1))}
                      disabled={currentSlide === images.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Slide {currentSlide + 1} of {images.length}</span>
                <div className="flex gap-1">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        i === currentSlide ? "bg-[#0077B5]" : "bg-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full gap-2" onClick={downloadAll}>
                <Download className="h-4 w-4" /> Download All {images.length} Slides
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
