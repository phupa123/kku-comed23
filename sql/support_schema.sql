-- ============================================================================
-- COMED KKU SMART SUPPORT DESK SCHEMA (Supabase Cloud Database)
-- สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น
-- ============================================================================

-- 1. Create table for Support Tickets (ห้องติดต่อสอบถาม)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code VARCHAR(32) UNIQUE NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    user_phone VARCHAR(50),
    student_id VARCHAR(50),
    topic VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    mode VARCHAR(50) DEFAULT 'ai', -- 'ai', 'human_requested', 'human_active'
    assigned_admin VARCHAR(255),
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    closed_by VARCHAR(50), -- 'user', 'admin'
    rating INT, -- 1 to 5
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS closed_by VARCHAR(50);
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS rating INT;

-- 2. Create table for Support Messages (ข้อความในห้องแชท)
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL, -- 'user', 'ai', 'admin', 'system'
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255),
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    voice_transcription TEXT, -- ข้อความถอดเสียงภาษาไทย
    voice_duration INT, -- ความยาวเสียง (วินาที)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure voice columns exist if table was already created
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS voice_transcription TEXT;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS voice_duration INT;

-- 3. Create table for Admin Presence & Toggle Status (สถานะแอดมินพร้อมให้บริการ)
CREATE TABLE IF NOT EXISTS public.admin_presence (
    admin_id VARCHAR(255) PRIMARY KEY,
    admin_name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'busy', 'offline'
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create table for Knowledge Base Articles (คลังข้อมูลทางการของสาขาวิชา)
CREATE TABLE IF NOT EXISTS public.kb_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL, -- 'activities', 'payments', 'calendar', 'documents', 'professors', 'general'
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT true,
    view_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

-- 6. Policies for Public and Authenticated users (Full open access for web client anonKey)
DROP POLICY IF EXISTS "Public support_tickets access" ON public.support_tickets;
CREATE POLICY "Public support_tickets access" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public support_messages access" ON public.support_messages;
CREATE POLICY "Public support_messages access" ON public.support_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public admin_presence access" ON public.admin_presence;
CREATE POLICY "Public admin_presence access" ON public.admin_presence FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public kb_articles access" ON public.kb_articles;
CREATE POLICY "Public kb_articles access" ON public.kb_articles FOR ALL USING (true) WITH CHECK (true);

-- 7. Enable Supabase Realtime publication on support tables
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
    EXCEPTION WHEN duplicate_object THEN
        -- already in publication
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
    EXCEPTION WHEN duplicate_object THEN
        -- already in publication
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_presence;
    EXCEPTION WHEN duplicate_object THEN
        -- already in publication
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.kb_articles;
    EXCEPTION WHEN duplicate_object THEN
        -- already in publication
    END;
END $$;

-- 8. Seed initial official Knowledge Base Data for COMED KKU
INSERT INTO public.kb_articles (category, question, answer, keywords) VALUES
('payments', 'ค่าเสื้อสาขาวิชาเอกคอมพิวเตอร์ศึกษา ราคาเท่าไหร่ และชำระอย่างไร?', 
'ค่าเสื้อสาขาวิชาเอก (COMED 69) ยอดชำระปกติอยู่ที่ 390.00 บาท (สำหรับขนาดไม่เกิน 2XL) และหากเป็นขนาด 3XL ขึ้นไป จะบวกเพิ่ม 20 บาท เป็น 410.00 บาท สามารถเข้าไปชำระเงินและแนบสลิปผ่านหน้าเว็บเมนู "ชำระเงิน" (payment.html) ได้โดยตรง', 
ARRAY['ค่าเสื้อ', 'เสื้อเอก', '390', '410', 'ขนาดเสื้อ', 'ชำระเงินค่าเสื้อ']),

('payments', 'ค่าทำป้ายสาขาวิชาเอก (PAIMAI69) ราคาเท่าไหร่?', 
'ค่าทำป้ายสาขาวิชาเอกสำหรับนักศึกษาชั้นปีที่ 1 ยอดชำระคนละ 190.00 บาท สามารถตรวจสอบรายชื่อและยืนยันการโอนเงินได้ที่ระบบชำระเงินเมนูค่าทำป้าย', 
ARRAY['ค่าทำป้าย', 'ป้ายชื่อ', '190', 'paimai', 'ป้ายสาขา']),

('calendar', 'ช่วงเวลาเปิด-ปิดภาคเรียน และปฏิทินการศึกษาตรวจสอบได้ที่ไหน?', 
'สามารถตรวจสอบกำหนดการลงทะเบียน วันเริ่มเรียน วันสอบกลางภาค และวันสอบไล่ได้ผ่านหน้าเมนู "ปฏิทินกิจกรรม" (Calendar.html) ของระบบ หรือตรวจสอบทางเว็บไซต์สำนักบริหารและพัฒนาวิชาการ มข. (reg.kku.ac.th)', 
ARRAY['ปฏิทิน', 'วันสอบ', 'เปิดเทอม', 'ปิดเทอม', 'ลงทะเบียน', 'calendar']),

('documents', 'ดาวน์โหลดเอกสาร แบบฟอร์มคำร้อง และสไลด์การเรียนได้ที่ไหน?', 
'นักศึกษาสามารถเข้าใช้งานระบบคลังเอกสารและไฟล์สื่อการเรียนรู้ได้ที่หน้าเมนู "ดาวน์โหลด" (download.html) และ "คลังไฟล์" (storage.html) โดยมีระบบพรีวิวไฟล์และดาวน์โหลดตรงได้ทันที', 
ARRAY['ดาวน์โหลด', 'เอกสาร', 'แบบฟอร์ม', 'ไฟล์เรียน', 'download', 'storage']),

('professors', 'ช่องทางติดต่ออาจารย์ที่ปรึกษาและคณาจารย์ประจำสาขาวิชา', 
'สามารถติดต่ออาจารย์ประจำสาขาวิชาคอมพิวเตอร์ศึกษาได้ที่ อาคาร 1 คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น หรือผ่านอีเมลทางการของคณาจารย์ในระบบ หรือติดต่อผ่านหัวหน้าสาขา/ผู้ดูแลระบบ', 
ARRAY['อาจารย์', 'อาจารย์ที่ปรึกษา', 'คณะศึกษาศาสตร์', 'ติดต่ออาจารย์', 'ห้องพักอาจารย์']),

('activities', 'กิจกรรมบายเนียร์และค่ายวิชาการจัดขึ้นเมื่อใด?', 
'กิจกรรมของสาขาวิชาคอมพิวเตอร์ศึกษา เช่น กิจกรรมสานสัมพันธ์ ค่ายวิชาการคอมพิวเตอร์ศึกษา และกิจกรรมบายเนียร์ สามารถติดตามประกาศวันเวลาสถานที่อย่างเป็นทางการได้ทางหน้าข่าวสาร (index.html) และเมนู Plans / EventClass', 
ARRAY['กิจกรรม', 'บายเนียร์', 'ค่าย', 'event', 'แผนงาน', 'plans'])
ON CONFLICT DO NOTHING;
