import { supabase } from "./supabaseClient";

const BUCKET = "tileset-images";

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } {
  const commaIndex = dataUrl.indexOf(",");
  const header = dataUrl.slice(0, commaIndex);
  const base64 = dataUrl.slice(commaIndex + 1);
  const mime = header.match(/data:([^;]+);base64/)?.[1] ?? "image/png";
  const ext = mime.split("/")[1]?.split("+")[0] ?? "png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { blob: new Blob([bytes], { type: mime }), ext };
}

/** upload 1 ảnh tileset (data URL) lên Supabase Storage, trả về URL public — dùng path
 * "{userId}/{tilesetId}.ext" nên user chỉ đụng được file trong thư mục riêng của mình (xem RLS trong supabase_setup.sql). */
export async function uploadTilesetImage(dataUrl: string, tilesetId: string): Promise<string> {
  if (!supabase) throw new Error("Chưa cấu hình Supabase — xem SUPABASE_SETUP.md.");
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Cần đăng nhập trước khi lưu Cloud.");

  const { blob, ext } = dataUrlToBlob(dataUrl);
  const path = `${userData.user.id}/${tilesetId}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: blob.type });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** đổi ngược 1 URL public trong bucket tileset-images thành path lưu trữ (để xoá) — trả về null nếu
 * không phải URL của bucket này (vd ảnh chưa từng lưu Cloud, vẫn còn là data: URL). */
export function tilesetUrlToStoragePath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export async function deleteTilesetImages(paths: string[]): Promise<void> {
  if (!supabase || paths.length === 0) return;
  await supabase.storage.from(BUCKET).remove(paths);
}
