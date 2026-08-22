import { getSupabaseAdmin } from "./supabase";

const BUCKET = "bug-evidence";

export async function storagePut(key: string, content: Buffer, contentType: string) {
  const { error } = await getSupabaseAdmin().storage.from(BUCKET).upload(key, content, { contentType, upsert: false });
  if (error) throw new Error(`Evidence upload failed: ${error.message}`);
  return { key };
}

export async function storageGetSignedUrl(key: string) {
  const { data, error } = await getSupabaseAdmin().storage.from(BUCKET).createSignedUrl(key, 120);
  if (error || !data?.signedUrl) throw new Error(`Evidence access failed: ${error?.message ?? "no URL returned"}`);
  return data.signedUrl;
}
