"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Building2, Save, Loader2 } from "lucide-react"
import { BrandProfile } from "@/types"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [profile, setProfile] = useState<BrandProfile>({
    company_name: "",
    industry: "",
    tone_description: "",
    target_audience: "",
    example_language: "",
    taglines: "",
  })

  useEffect(() => {
    fetch("/api/brand-profile")
      .then((r) => r.json())
      .then((data) => {
        if (data) setProfile(data)
      })
      .finally(() => setFetching(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/brand-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })

      if (res.ok) {
        toast.success("Brand profile saved!")
      } else {
        throw new Error("Save failed")
      }
    } catch {
      toast.error("Failed to save brand profile")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#0077B5]" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-[#0077B5] rounded-lg p-2">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Brand Profile</h1>
        </div>
        <p className="text-muted-foreground">
          Set your company&apos;s brand voice to ensure consistent messaging across all company LinkedIn posts.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>
              This information will be used to generate company posts in your brand voice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  placeholder="Acme Corp"
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="Technology / SaaS"
                  value={profile.industry}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone_description">Brand Tone & Voice</Label>
              <Input
                id="tone_description"
                placeholder="Professional yet approachable, innovative, data-driven"
                value={profile.tone_description}
                onChange={(e) => setProfile({ ...profile, tone_description: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Describe how your company communicates</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Input
                id="target_audience"
                placeholder="B2B decision makers, CTOs, enterprise teams"
                value={profile.target_audience}
                onChange={(e) => setProfile({ ...profile, target_audience: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taglines">Company Taglines / Key Messages</Label>
              <Textarea
                id="taglines"
                placeholder="e.g. 'Build faster, scale smarter' — include any phrases or messages you use frequently"
                value={profile.taglines}
                onChange={(e) => setProfile({ ...profile, taglines: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="example_language">Example Language / Phrases to Avoid or Use</Label>
              <Textarea
                id="example_language"
                placeholder="Use: 'empower', 'streamline', 'ROI'\nAvoid: buzzwords like 'synergy', 'disrupt'"
                value={profile.example_language}
                onChange={(e) => setProfile({ ...profile, example_language: e.target.value })}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0077B5] hover:bg-[#006097] gap-2"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4" /> Save Brand Profile</>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
