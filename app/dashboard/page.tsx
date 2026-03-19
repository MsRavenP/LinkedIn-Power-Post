import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PenSquare, History, Settings, Zap, TrendingUp, Users } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id ?? "")

  const name = user?.user_metadata?.full_name?.split(" ")[0] ?? "there"

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hey, {name}! 👋</h1>
        <p className="text-muted-foreground mt-1">Ready to create your next powerful LinkedIn post?</p>
      </div>

      {/* Quick action */}
      <div className="mb-8">
        <Link href="/create">
          <Button size="lg" className="bg-[#0077B5] hover:bg-[#006097] gap-2">
            <PenSquare className="h-5 w-5" />
            Create New Post
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <Zap className="h-6 w-6 text-[#0077B5]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{postCount ?? 0}</p>
                <p className="text-sm text-muted-foreground">Posts Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">2x</p>
                <p className="text-sm text-muted-foreground">Variations per Post</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Post Versions (Personal + Company)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/create">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-[#0077B5]">
            <CardHeader>
              <PenSquare className="h-8 w-8 text-[#0077B5] mb-2" />
              <CardTitle className="text-base">Create Post</CardTitle>
              <CardDescription>Chat with AI to generate personal & company LinkedIn posts with images</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/history">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-[#0077B5]">
            <CardHeader>
              <History className="h-8 w-8 text-[#0077B5] mb-2" />
              <CardTitle className="text-base">Post History</CardTitle>
              <CardDescription>Browse and reuse your previously generated LinkedIn posts</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/settings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-[#0077B5]">
            <CardHeader>
              <Settings className="h-8 w-8 text-[#0077B5] mb-2" />
              <CardTitle className="text-base">Brand Profile</CardTitle>
              <CardDescription>Set your company voice, tone, and industry for consistent posts</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
