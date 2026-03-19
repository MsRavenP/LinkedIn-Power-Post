"use client"

import { GeneratedPosts } from "@/types"
import PostVariation from "./PostVariation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Building2 } from "lucide-react"

interface PostDisplayProps {
  posts: GeneratedPosts
}

export default function PostDisplay({ posts }: PostDisplayProps) {
  const hasBoth = posts.personal && posts.company

  if (!posts.personal && !posts.company) return null

  if (!hasBoth) {
    const type = posts.personal ? "personal" : "company"
    const data = posts.personal || posts.company!
    return (
      <div className="space-y-3">
        <PostVariation label={type === "personal" ? "Personal" : "Company"} variation={data.variation1} variationNumber={1} type={type} />
        <PostVariation label={type === "personal" ? "Personal" : "Company"} variation={data.variation2} variationNumber={2} type={type} />
      </div>
    )
  }

  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="w-full mb-4">
        <TabsTrigger value="personal" className="flex-1 gap-2">
          <User className="h-4 w-4" /> Personal
        </TabsTrigger>
        <TabsTrigger value="company" className="flex-1 gap-2">
          <Building2 className="h-4 w-4" /> Company
        </TabsTrigger>
      </TabsList>

      <TabsContent value="personal" className="space-y-3">
        <PostVariation label="Personal" variation={posts.personal!.variation1} variationNumber={1} type="personal" />
        <PostVariation label="Personal" variation={posts.personal!.variation2} variationNumber={2} type="personal" />
      </TabsContent>

      <TabsContent value="company" className="space-y-3">
        <PostVariation label="Company" variation={posts.company!.variation1} variationNumber={1} type="company" />
        <PostVariation label="Company" variation={posts.company!.variation2} variationNumber={2} type="company" />
      </TabsContent>
    </Tabs>
  )
}
