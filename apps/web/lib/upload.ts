import { createClient } from "@/lib/supabase/client";

export const REPORT_MEDIA_BUCKET = "report-media";

export async function uploadReportImage(userId: string, blob: Blob): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await createClient()
    .storage.from(REPORT_MEDIA_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error("Fotoğraf yüklenemedi");
  return path;
}
