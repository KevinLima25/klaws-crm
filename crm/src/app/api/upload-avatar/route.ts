import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const ext = file.name.split(".").pop() || "png"
  const fileName = `${userId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage.from("avatars").upload(fileName, buffer, {
    contentType: file.type,
    upsert: true,
  })

  if (uploadError) {
    // Bucket might not exist - try creating it
    const { error: bucketError } = await admin.storage.createBucket("avatars", {
      public: true,
    })
    if (bucketError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { error: retryError } = await admin.storage.from("avatars").upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    })
    if (retryError) return NextResponse.json({ error: retryError.message }, { status: 500 })
  }

  const { data: urlData } = admin.storage.from("avatars").getPublicUrl(fileName)
  const avatarUrl = urlData?.publicUrl || ""

  await admin.from("profiles").upsert(
    { id: userId, avatar_url: avatarUrl },
    { onConflict: "id" }
  )

  return NextResponse.json({ avatar_url: avatarUrl })
}
