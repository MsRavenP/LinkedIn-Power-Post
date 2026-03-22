"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { UserCircle2, Save, Loader2 } from "lucide-react"
import { UserProfile } from "@/types"

const emptyProfile: UserProfile = {
  full_name: "",
  job_title: "",
  industry: "",
  writing_style: "",
  personality_traits: "",
  target_audience: "",
  topics_of_expertise: "",
  personal_values: "",
  signature_phrases: "",
  words_to_avoid: "",
  example_posts: "",
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [profile, setProfile] = useState<UserProfile>(emptyProfile)

  useEffect(() => {
    fetch("/api/user-profile")
      .then((r) => r.json())
      .then((data) => {
        if (data) setProfile({ ...emptyProfile, ...data })
      })
      .finally(() => setFetching(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        toast.success("Voice profile saved!")
      } else {
        throw new Error("Save failed")
      }
    } catch {
      toast.error("Failed to save voice profile")
    } finally {
      setLoading(false)
    }
  }

  function set(field: keyof UserProfile, value: string) {
    setProfile((p) => ({ ...p, [field]: value }))
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
            <UserCircle2 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">My Voice Profile</h1>
        </div>
        <p className="text-muted-foreground">
          Tell us about your personal brand so every LinkedIn post sounds authentically like you.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* About You */}
        <Card>
          <CardHeader>
            <CardTitle>About You</CardTitle>
            <CardDescription>Basic info that helps the AI understand who you are.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Your Name</Label>
                <Input
                  id="full_name"
                  placeholder="Raven P."
                  value={profile.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title / Role</Label>
                <Input
                  id="job_title"
                  placeholder="Founder, Marketing Director, Coach..."
                  value={profile.job_title}
                  onChange={(e) => set("job_title", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry / Niche</Label>
              <Input
                id="industry"
                placeholder="e.g. Tech, Real Estate, Personal Development, Finance..."
                value={profile.industry}
                onChange={(e) => set("industry", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_audience">Who You Speak To</Label>
              <Input
                id="target_audience"
                placeholder="e.g. Early-stage founders, corporate professionals, working moms..."
                value={profile.target_audience}
                onChange={(e) => set("target_audience", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topics_of_expertise">Topics You Post About</Label>
              <Input
                id="topics_of_expertise"
                placeholder="e.g. Leadership, AI tools, productivity, mental health at work..."
                value={profile.topics_of_expertise}
                onChange={(e) => set("topics_of_expertise", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Your Voice */}
        <Card>
          <CardHeader>
            <CardTitle>Your Writing Voice</CardTitle>
            <CardDescription>Help the AI match how you naturally communicate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="writing_style">Writing Style</Label>
              <Input
                id="writing_style"
                placeholder="e.g. Casual and direct, storytelling-heavy, data-driven but warm..."
                value={profile.writing_style}
                onChange={(e) => set("writing_style", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Describe the overall feel of your writing</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="personality_traits">Personality Traits</Label>
              <Input
                id="personality_traits"
                placeholder="e.g. Bold, empathetic, no-BS, optimistic, analytical..."
                value={profile.personality_traits}
                onChange={(e) => set("personality_traits", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personal_values">Core Values / Beliefs</Label>
              <Input
                id="personal_values"
                placeholder="e.g. Authenticity over perfection, community over competition..."
                value={profile.personal_values}
                onChange={(e) => set("personal_values", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signature_phrases">Phrases You Often Use</Label>
              <Textarea
                id="signature_phrases"
                placeholder={'e.g. "Let\'s be real...", "Here\'s what nobody tells you:", "Real talk:"'}
                value={profile.signature_phrases}
                onChange={(e) => set("signature_phrases", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="words_to_avoid">Words / Phrases to Avoid</Label>
              <Textarea
                id="words_to_avoid"
                placeholder={'e.g. "Excited to announce", "hustle", "grind", corporate jargon...'}
                value={profile.words_to_avoid}
                onChange={(e) => set("words_to_avoid", e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Example Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Example Posts</CardTitle>
            <CardDescription>
              Paste 1–3 of your best LinkedIn posts. This is the most powerful way to train the AI on your voice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="example_posts"
              placeholder="Paste your real LinkedIn posts here, separated by a blank line between each one..."
              value={profile.example_posts}
              onChange={(e) => set("example_posts", e.target.value)}
              rows={8}
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full bg-[#0077B5] hover:bg-[#006097] gap-2"
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4" /> Save Voice Profile</>
          )}
        </Button>
      </form>
    </div>
  )
}
