"use client"

import { Tone, TONE_OPTIONS } from "@/types"
import { cn } from "@/lib/utils"

interface ToneSelectorProps {
  value: Tone
  onChange: (tone: Tone) => void
}

export default function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {TONE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "p-3 rounded-lg border-2 text-left transition-all",
            value === option.value
              ? "border-[#0077B5] bg-blue-50 text-[#0077B5]"
              : "border-border hover:border-gray-300 text-gray-600 hover:bg-gray-50"
          )}
        >
          <p className="font-medium text-sm">{option.label}</p>
          <p className="text-xs mt-0.5 opacity-70">{option.description}</p>
        </button>
      ))}
    </div>
  )
}
