import { supabase } from "./supabaseClient";
import type { CloudDocType, CloudDocumentRow, CloudDocumentSummary } from "../types/cloud";
import type { GraphDocument } from "../types/graph";
import type { MapDocument } from "../types/map";

function requireClient() {
  if (!supabase) throw new Error("Chưa cấu hình Supabase — xem SUPABASE_SETUP.md.");
  return supabase;
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

  if (params.id) {
    const { error } = await client
      .from("documents")
      .update({ name: params.name, data: params.data })
      .eq("id", params.id);
    if (error) throw new Error(error.message);
    return params.id;
  }

  const { data: inserted, error } = await client
    .from("documents")
    .insert({ owner: userData.user.id, type: params.type, name: params.name, data: params.data })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return inserted.id as string;
}

export async function listCloudDocuments(type: CloudDocType): Promise<CloudDocumentSummary[]> {
  const client = requireClient();
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
  const { data, error } = await client.from("documents").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data as CloudDocumentRow;
}

export async function deleteCloudDocument(id: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
