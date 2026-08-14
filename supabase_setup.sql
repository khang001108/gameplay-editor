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

create policy "Users can view own documents"
  on documents for select
  using (auth.uid() = owner);

create policy "Users can insert own documents"
  on documents for insert
  with check (auth.uid() = owner);

create policy "Users can update own documents"
  on documents for update
  using (auth.uid() = owner);

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

create trigger documents_set_updated_at
  before update on documents
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Fix nhanh nếu bảng documents đã có sẵn từ trước và chỉ bị lỗi
-- "permission denied for table documents" -> chạy riêng đúng dòng dưới đây:
-- ---------------------------------------------------------------------------
-- grant select, insert, update, delete on table documents to authenticated;
