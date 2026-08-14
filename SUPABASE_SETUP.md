# Cấu hình Supabase cho tính năng "Lưu Cloud"

Editor lưu map/graph lên Supabase để mở lại được từ trình duyệt hoặc máy khác — có đăng nhập,
mỗi tài khoản chỉ thấy map/graph của chính mình. Chưa làm bước dưới thì nút **☁ Lưu Cloud** /
**Đăng nhập** trên TopBar sẽ tự ẩn (app vẫn chạy bình thường, Export/Load JSON local không bị ảnh hưởng).

## 1. Tạo project Supabase

1. Vào [supabase.com](https://supabase.com) → đăng ký/đăng nhập → **New project**.
2. Đặt tên, chọn vùng gần bạn, đặt mật khẩu database (không cần nhớ, chỉ dùng nếu sau này truy cập DB trực tiếp).
3. Đợi project khởi tạo xong (~1-2 phút).

## 2. Tạo bảng `documents`

Vào **SQL Editor** (menu bên trái) → **New query** → dán đoạn SQL sau → **Run**:

```sql
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('map', 'gameplay')),
  name text not null default 'Untitled',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table documents enable row level security;

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
```

Row Level Security (RLS) đảm bảo mỗi tài khoản chỉ đọc/sửa/xoá được dòng do chính mình tạo — kể cả
khi ai đó có được `anon key` cũng không xem được dữ liệu người khác.

## 3. (Tuỳ chọn) Tắt xác nhận email khi đăng ký — để test nhanh

Mặc định Supabase bắt xác nhận email trước khi đăng nhập được. Muốn test nhanh không cần hòm thư:

**Authentication** → **Providers** → **Email** → tắt **Confirm email** → **Save**.

(Bật lại nếu deploy thật để tránh spam đăng ký ảo.)

## 4. Lấy URL + anon key

**Project Settings** (biểu tượng bánh răng) → **API**:

- **Project URL** → dán vào `VITE_SUPABASE_URL`
- **anon public** key (trong mục Project API keys) → dán vào `VITE_SUPABASE_ANON_KEY`

## 5. Điền vào `.env.local`

Copy `.env.example` thành `.env.local` (file này đã bị `.gitignore` bỏ qua, không commit lên git) rồi điền:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Chạy lại `npm run dev` — nút **Đăng nhập** và **☁ Lưu Cloud** sẽ xuất hiện trên TopBar.

## Cách hoạt động trong app

- **Đăng nhập/Đăng ký**: form nhỏ ở góc phải TopBar (email + mật khẩu).
- **☁ Lưu Cloud**: lưu map/graph hiện tại lên Supabase — lần đầu tạo dòng mới, những lần sau
  bấm lại sẽ **cập nhật** đúng dòng đó (không tạo bản trùng).
- **Mở Cloud**: liệt kê các map/graph đã lưu (đúng loại đang mở — Map Editor chỉ thấy map, Gameplay
  Editor chỉ thấy graph), bấm vào tên để tải lại.
- **Autosave**: sau khi đã "☁ Lưu Cloud" ít nhất 1 lần, mọi thay đổi tiếp theo tự lưu lại sau ~4 giây
  ngừng thao tác — không cần bấm tay liên tục.
- Bấm **New** sẽ tạo tài liệu mới, không còn gắn với bản Cloud cũ (lưu Cloud lần tới sẽ tạo dòng mới).
