// shared/supabase-config.js
// Thông tin Supabase dùng chung cho trình duyệt (src/) và Vercel Function (api/).
// Publishable key được thiết kế để công khai: quyền đọc/ghi thật sự do RLS trong supabase/schema.sql quyết định.
// Secret key KHÔNG đặt ở đây — chỉ nằm trong biến môi trường SUPABASE_SERVICE_ROLE_KEY trên Vercel.
export const SUPABASE_URL = "https://qiulwypcnhmbuerpcafq.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Tz4mjmobGM6HJ9rRn9Td3w_-XCuLX30";
