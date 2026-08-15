import { supabase } from "./supabaseClient";
import type { CloudDocType, CloudDocumentRow, CloudDocumentSummary } from "../types/cloud";
import type { GraphDocument } from "../types/graph";
import type { MapDocument } from "../types/map";
import { uploadTilesetImage, tilesetUrlToStoragePath, deleteTilesetImages } from "./tilesetStorage";

function requireClient() {
  if (!supabase) throw new Error("Chưa cấu hình Supabase — xem SUPABASE_SETUP.md.");
  return supabase;
}

/** Đợi session sẵn sàng (và tự refresh access token nếu sắp hết hạn) TRƯỚC khi gọi PostgREST.
 * Lúc mới load/reload trang, `authStore` set `user` ngay khi getSession() resolve — nhưng nếu code
 * gọi API (vd bấm "Mở Cloud") đúng lúc access token vừa hết hạn và client chưa kịp tự làm mới xong,
 * RLS sẽ âm thầm coi như chưa đăng nhập và trả về danh sách RỖNG (không báo lỗi gì) — giống hệt
 * "vẫn hiện đăng nhập nhưng không thấy dữ liệu Cloud" cho tới khi đăng xuất/đăng nhập lại (tạo
 * session mới hoàn toàn). Gọi getSession() ở đây đảm bảo token luôn mới trước mỗi query. */
async function requireSession(client: NonNullable<typeof supabase>) {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) throw new Error("Cần đăng nhập trước khi thao tác với Cloud.");
  return data.session;
}

// cache trong phiên hiện tại: tilesetId đã upload lên Storage rồi thì khỏi upload lại mỗi lần autosave
// (ảnh tileset gần như không đổi sau khi import, re-upload lại nguyên khối mỗi 4s là phí băng thông).
const uploadedTilesetUrlCache = new Map<string, string>();

/** Ảnh tileset đang là data: URL (base64) thì upload lên Supabase Storage rồi thay bằng URL — tránh
 * nhét cả chục MB base64 vào 1 cột jsonb. Ảnh đã là URL (đã upload trước đó / load lại từ Cloud) thì giữ nguyên. */
async function resolveMapImagesForCloud(doc: MapDocument): Promise<MapDocument> {
  const tilesets = await Promise.all(
    doc.tilesets.map(async (ts) => {
      if (!ts.imageDataUrl.startsWith("data:")) return ts;
      const cached = uploadedTilesetUrlCache.get(ts.id);
      const url = cached ?? (await uploadTilesetImage(ts.imageDataUrl, ts.id));
      uploadedTilesetUrlCache.set(ts.id, url);
      return { ...ts, imageDataUrl: url };
    })
  );
  return { ...doc, tilesets };
}

/** Lưu mới (chưa có cloudId) hoặc cập nhật (đã có cloudId) — trả về id của dòng đã lưu. */
export async function saveCloudDocument(params: {
  id: string | null;
  type: CloudDocType;
  name: string;
  data: MapDocument | GraphDocument;
}): Promise<string> {
  const client = requireClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) throw new Error("Cần đăng nhập trước khi lưu Cloud.");

  const data = params.type === "map" ? await resolveMapImagesForCloud(params.data as MapDocument) : params.data;

  if (params.id) {
    const { error } = await client
      .from("documents")
      .update({ name: params.name, data })
      .eq("id", params.id);
    if (error) throw new Error(error.message);
    return params.id;
  }

  const { data: inserted, error } = await client
    .from("documents")
    .insert({ owner: userData.user.id, type: params.type, name: params.name, data })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return inserted.id as string;
}

export async function listCloudDocuments(type: CloudDocType): Promise<CloudDocumentSummary[]> {
  const client = requireClient();
  await requireSession(client);
  const { data, error } = await client
    .from("documents")
    .select("id, name, updated_at")
    .eq("type", type)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as CloudDocumentSummary[];
}

export async function loadCloudDocument(id: string): Promise<CloudDocumentRow> {
  const client = requireClient();
  await requireSession(client);
  const { data, error } = await client.from("documents").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data as CloudDocumentRow;
}

export async function deleteCloudDocument(id: string): Promise<void> {
  const client = requireClient();
  await requireSession(client);

  // xoá document map thì dọn luôn ảnh tileset đã upload trong Storage, tránh rác tồn lại vĩnh viễn
  const { data: row } = await client.from("documents").select("type, data").eq("id", id).single();
  if (row?.type === "map") {
    const tilesets = (row.data as MapDocument).tilesets ?? [];
    const paths = tilesets.map((t) => tilesetUrlToStoragePath(t.imageDataUrl)).filter((p): p is string => p !== null);
    if (paths.length > 0) await deleteTilesetImages(paths);
  }

  const { error } = await client.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
