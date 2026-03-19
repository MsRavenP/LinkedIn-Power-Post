"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface PostVariationProps {
  label: string
  variation: string
  variationNumber: 1 | 2
  type: "personal" | "company"
}

export default function PostVariation({ label, variation, variationNumber, type }: PostVariationProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(variation)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn(
      "rounded-xl border-2 p-4 space-y-3",
      type === "personal" ? "border-blue-100 bg-blue-50/30" : "border-purple-100 bg-purple-50/30"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              type === "personal" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
            )}
          >
            {label}
          </Badge>
          <span className="text-xs text-muted-foreground">Variation {variationNumber}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-7 gap-1.5 text-xs"
        >
          {copied ? (
            <><Check className="h-3 w-3 text-green-600" /> Copied</>
          ) : (
            <><Copy className="h-3 w-3" /> Copy</>
          )}
        </Button>
      </div>
      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{variation}</p>
    </div>
  )
}
