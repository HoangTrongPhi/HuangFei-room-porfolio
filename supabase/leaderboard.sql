-- Bảng xếp hạng mini game trong máy Switch (api/leaderboard.js).
-- Chạy 1 lần trong Supabase Dashboard → SQL Editor → New query → Run (chạy được nhiều lần, không lỗi).
--   * Trình duyệt không đọc/ghi trực tiếp được: mọi thao tác đi qua /api/leaderboard bằng secret key.
--   * Admin (bảng admins trong schema.sql) đọc và xoá được — vd. xoá tên không phù hợp.

create table if not exists public.leaderboard (
    id          bigint generated always as identity primary key,
    created_at  timestamptz not null default now(),
    game        text not null,              -- snake | breakout | stack | runner | rhythm
    name        text not null,              -- tên người chơi tự nhập (tối đa 14 ký tự)
    score       integer not null check (score > 0),
    ref         text,                       -- mã công ty trong link ?ref= (nếu có)
    ip          text                        -- chỉ dùng để giới hạn số lần gửi điểm
);

create index if not exists leaderboard_game_score_idx on public.leaderboard (game, score desc, created_at);
create index if not exists leaderboard_ip_time_idx on public.leaderboard (ip, created_at desc);

alter table public.leaderboard enable row level security;

drop policy if exists "admins read leaderboard" on public.leaderboard;
create policy "admins read leaderboard" on public.leaderboard
    for select to authenticated
    using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "admins delete leaderboard" on public.leaderboard;
create policy "admins delete leaderboard" on public.leaderboard
    for delete to authenticated
    using (exists (select 1 from public.admins a where a.user_id = auth.uid()));
