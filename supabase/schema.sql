-- Chạy 1 lần trong Supabase Dashboard → SQL Editor → New query → Run.
-- Tạo bảng lưu lượt truy cập + bảng admin, bật Row Level Security:
--   * Không ai ghi trực tiếp được từ trình duyệt (chỉ /api/track dùng secret key mới ghi được).
--   * Chỉ user có trong bảng admins mới đọc được dữ liệu.

create table if not exists public.visits (
    id          bigint generated always as identity primary key,
    created_at  timestamptz not null default now(),
    event       text not null,          -- visit | enter | click
    target      text,                   -- nút được click: mywork, contact, github...
    ref         text,                   -- mã công ty trong link ?ref=
    session_id  text,                   -- id ngẫu nhiên theo tab trình duyệt
    ip          text,
    country     text,
    region      text,
    city        text,
    user_agent  text,
    referrer    text
);

create index if not exists visits_created_at_idx on public.visits (created_at desc);
create index if not exists visits_ref_idx on public.visits (ref);

create table if not exists public.admins (
    user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.visits enable row level security;
alter table public.admins enable row level security;

drop policy if exists "admins read visits" on public.visits;
create policy "admins read visits" on public.visits
    for select to authenticated
    using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "admins delete visits" on public.visits;
create policy "admins delete visits" on public.visits
    for delete to authenticated
    using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "admin reads own row" on public.admins;
create policy "admin reads own row" on public.admins
    for select to authenticated
    using (user_id = auth.uid());

-- Cấp quyền admin cho (các) tài khoản đang có ở Authentication → Users.
-- Hãy tạo tài khoản admin của bạn TRƯỚC khi chạy file này. Vì đã tắt đăng ký,
-- sẽ không ai khác tự tạo được tài khoản để thành admin.
insert into public.admins (user_id)
select id from auth.users
on conflict do nothing;
