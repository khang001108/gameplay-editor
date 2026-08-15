-- Chạy toàn bộ file này trong Supabase SQL Editor (New query -> dán -> Run).
-- Nếu bảng documents đã tồn tại và bạn chỉ cần fix lỗi "permission denied for table documents",
-- kéo xuống cuối file và chạy riêng dòng "grant ..." là đủ, không cần chạy lại từ đầu.

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('map', 'gameplay')),
  name text not null default 'Untitled',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table documents enable row level security;

-- RLS policy chỉ quyết định ĐƯỢC ĐỘNG VÀO DÒNG NÀO — vẫn cần GRANT quyền thao tác trên bảng trước,
-- nếu thiếu dòng này sẽ gặp lỗi "permission denied for table documents" dù policy đã đúng.
grant select, insert, update, delete on table documents to authenticated;

drop policy if exists "Users can view own documents" on documents;
create policy "Users can view own documents"
  on documents for select
  using (auth.uid() = owner);

drop policy if exists "Users can insert own documents" on documents;
create policy "Users can insert own documents"
  on documents for insert
  with check (auth.uid() = owner);

drop policy if exists "Users can update own documents" on documents;
create policy "Users can update own documents"
  on documents for update
  using (auth.uid() = owner);

drop policy if exists "Users can delete own documents" on documents;
create policy "Users can delete own documents"
  on documents for delete
  using (auth.uid() = owner);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists documents_set_updated_at on documents;
create trigger documents_set_updated_at
  before update on documents
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Fix nhanh nếu bảng documents đã có sẵn từ trước và chỉ bị lỗi
-- "permission denied for table documents" -> chạy riêng đúng dòng dưới đây:
-- ---------------------------------------------------------------------------
-- grant select, insert, update, delete on table documents to authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket cho ảnh tileset — lúc "Lưu Cloud", ảnh tileset (có thể vài chục MB nếu import
-- cả folder) được upload vào đây thay vì nhét base64 vào cột documents.data (jsonb), tránh làm
-- phình DB và tránh phải re-upload lại nguyên khối ảnh mỗi lần autosave.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('tileset-images', 'tileset-images', true)
on conflict (id) do nothing;

-- Mỗi user chỉ upload/sửa/xoá được file trong đúng thư mục riêng của mình: "{user_id}/...".
-- (storage.foldername(name))[1] = phần đầu tiên của path, vd path "abc-123/tileset_1.png" -> "abc-123".
drop policy if exists "Users can upload own tileset images" on storage.objects;
create policy "Users can upload own tileset images"
  on storage.objects for insert
  with check (bucket_id = 'tileset-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update own tileset images" on storage.objects;
create policy "Users can update own tileset images"
  on storage.objects for update
  using (bucket_id = 'tileset-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own tileset images" on storage.objects;
create policy "Users can delete own tileset images"
  on storage.objects for delete
  using (bucket_id = 'tileset-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Bucket public nên ai có URL cũng xem được ảnh (cần thiết để <img>/canvas load ảnh lúc mở map đã
-- Lưu Cloud) — không lộ gì nhạy cảm vì chỉ là ảnh tileset, không phải dữ liệu riêng tư.
drop policy if exists "Public can view tileset images" on storage.objects;
create policy "Public can view tileset images"
  on storage.objects for select
  using (bucket_id = 'tileset-images');
