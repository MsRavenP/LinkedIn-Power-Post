"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostRecord } from "@/types"
import { toast } from "sonner"
import { History, Copy, Check, Loader2, User, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied!")
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={copy}>
      {copied ? <><Check className="h-3 w-3 text-green-600" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
    </Button>
  )
}

function PostCard({ post }: { post: PostRecord }) {
  const hasPersonal = post.personal_variation1 || post.personal_variation2
  const hasCompany = post.company_variation1 || post.company_variation2
  const hasBoth = hasPersonal && hasCompany

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm line-clamp-2">{post.topic}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="secondary" className="text-xs capitalize">
                {post.tone?.replace("-", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasBoth ? (
          <Tabs defaultValue="personal">
            <TabsList className="mb-3">
              <TabsTrigger value="personal" className="gap-1.5 text-xs">
                <User className="h-3 w-3" /> Personal
              </TabsTrigger>
              <TabsTrigger value="company" className="gap-1.5 text-xs">
                <Building2 className="h-3 w-3" /> Company
              </TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="space-y-2">
              {post.personal_variation1 && (
                <div className="rounded-lg bg-blue-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-700">Variation 1</span>
                    <CopyButton text={post.personal_variation1} />
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-3">{post.personal_variation1}</p>
                </div>
              )}
              {post.personal_variation2 && (
                <div className="rounded-lg bg-blue-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-700">Variation 2</span>
                    <CopyButton text={post.personal_variation2} />
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-3">{post.personal_variation2}</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="company" className="space-y-2">
              {post.company_variation1 && (
                <div className="rounded-lg bg-purple-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-purple-700">Variation 1</span>
                    <CopyButton text={post.company_variation1} />
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-3">{post.company_variation1}</p>
                </div>
              )}
              {post.company_variation2 && (
                <div className="rounded-lg bg-purple-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-purple-700">Variation 2</span>
                    <CopyButton text={post.company_variation2} />
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-3">{post.company_variation2}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-2">
            {[
              { text: post.personal_variation1, label: "Personal V1", type: "personal" },
              { text: post.personal_variation2, label: "Personal V2", type: "personal" },
              { text: post.company_variation1, label: "Company V1", type: "company" },
              { text: post.company_variation2, label: "Company V2", type: "company" },
            ]
              .filter((v) => v.text)
              .map((v) => (
                <div
                  key={v.label}
                  className={cn(
                    "rounded-lg p-3 space-y-2",
                    v.type === "personal" ? "bg-blue-50" : "bg-purple-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-medium",
                      v.type === "personal" ? "text-blue-700" : "text-purple-700"
                    )}>{v.label}</span>
                    <CopyButton text={v.text!} />
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-3">{v.text}</p>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function HistoryPage() {
  const [posts, setPosts] = useState<PostRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-[#0077B5] rounded-lg p-2">
          <History className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Post History</h1>
          <p className="text-muted-foreground text-sm">Browse and reuse your previously generated posts</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0077B5]" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No posts yet</p>
          <p className="text-sm mt-1">Create your first post to see it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
