/**
 * ============================================================================
 * COMED KKU SMART SUPPORT & MULTI-TIER AI ENGINE
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น
 * ============================================================================
 * Features:
 * 1. Tier 1: Real-time In-Memory / Supabase Knowledge Base Semantic Matcher
 * 2. Tier 2: Free AI Inference via Pollinations.ai (RAG Dynamic Knowledge Injection)
 * 3. Tier 3: Google Gemini Free Tier Integration (context-aware deep reasoning)
 * 4. Rich Markdown, Images, Badges, Tables & External Link Confirmation Guard
 * 5. Supabase Realtime Ticketing & Live Chat Sync for Student <-> Staff
 * ============================================================================
 */

(function(window) {
  'use strict';

  // Fallback Embedded Knowledge Base with rich formatting, badges, tables and image banners
  const EMBEDDED_KB = [
    {
      category: 'payments',
      question: 'ค่าเสื้อสาขาวิชาเอกคอมพิวเตอร์ศึกษา ราคาเท่าไหร่ และชำระอย่างไร?',
      answer: `👕 **ค่าเสื้อสาขาวิชาเอกคอมพิวเตอร์ศึกษา (COMED 69)**

| รายการขนาดเสื้อ | ราคาต่อตัว | รายละเอียด |
| :--- | :---: | :--- |
| **ไซส์ปกติ (S - 2XL)** | **390 บาท** | รวมค่าสกรีนและเนื้อผ้าอย่างดี |
| **ไซส์พิเศษ (3XL ขึ้นไป)** | **410 บาท** | บวกเพิ่ม 20 บาท |

🔗 **ช่องทางการชำระเงิน:**
สามารถเข้าไปตรวจสอบรายชื่อ เลือกไซส์ และแนบสลิปผ่านระบบ [หน้ารับชำระเงินค่าเสื้อ (payment.html)](payment.html) ได้โดยตรงเลยครับ

![ตัวอย่างเสื้อสาขาวิชา](https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop)`,
      keywords: ['ค่าเสื้อ', 'เสื้อเอก', '390', '410', 'ขนาดเสื้อ', 'ชำระเงินค่าเสื้อ', 'ไซส์เสื้อ', 'ราคาเสื้อ']
    },
    {
      category: 'payments',
      question: 'ค่าทำป้ายสาขาวิชาเอก (PAIMAI69) ราคาเท่าไหร่?',
      answer: `🏷️ **ค่าทำป้ายสาขาวิชาเอกสำหรับนักศึกษาชั้นปีที่ 1 (COMED 69)**
- **ยอดชำระ:** <span class="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">190.00 บาท / คน</span>
- **สถานะ:** เปิดให้ยืนยันสิทธิ์และแนบสลิป
- **ลิงก์ดำเนินการ:** สามารถเข้าชำระได้ที่ [ระบบชำระเงินค่าทำป้าย (payment.html?camp=paimai69)](payment.html?camp=paimai69)`,
      keywords: ['ค่าทำป้าย', 'ป้ายชื่อ', '190', 'paimai', 'ป้ายสาขา', 'ป้าย']
    },
    {
      category: 'calendar',
      question: 'ช่วงเวลาเปิด-ปิดภาคเรียน และปฏิทินการศึกษาตรวจสอบได้ที่ไหน?',
      answer: `📅 **ปฏิทินกิจกรรมและการศึกษา (Academic Calendar)**
- ตรวจสอบกำหนดการลงทะเบียน วันเปิด-ปิดภาคเรียน และวันสอบกลางภาค/ปลายภาคได้ที่ [ปฏิทินกิจกรรมสาขา (Calendar.html)](Calendar.html)
- หรือตรวจสอบประกาศทางการจากสำนักบริหารและพัฒนาวิชาการ มข. ที่ [reg.kku.ac.th](https://reg.kku.ac.th)`,
      keywords: ['ปฏิทิน', 'วันสอบ', 'เปิดเทอม', 'ปิดเทอม', 'ลงทะเบียน', 'calendar', 'ตารางเรียน', 'วันหยุด']
    },
    {
      category: 'documents',
      question: 'ดาวน์โหลดเอกสาร แบบฟอร์มคำร้อง และสไลด์การเรียนได้ที่ไหน?',
      answer: `📁 **คลังเอกสารและดาวน์โหลด (Documents & Storage)**
- **คลังเอกสารและคำร้อง:** [ระบบดาวน์โหลดเอกสาร (download.html)](download.html) (มีระบบ Preview ดูตัวอย่างก่อนโหลด)
- **คลังไฟล์ Cloud Drive สาขา:** [Cloud Storage (storage.html)](storage.html)`,
      keywords: ['ดาวน์โหลด', 'เอกสาร', 'แบบฟอร์ม', 'ไฟล์เรียน', 'download', 'storage', 'ไดรฟ์', 'pdf']
    },
    {
      category: 'professors',
      question: 'ช่องทางติดต่ออาจารย์ที่ปรึกษาและคณาจารย์ประจำสาขาวิชา',
      answer: `👨‍🏫 **คณาจารย์ประจำสาขาวิชาคอมพิวเตอร์ศึกษา**
- **ที่ตั้งห้องพักอาจารย์:** อาคาร 1 คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น
- **อีเมลทางการสาขา:** [comed@kku.ac.th](mailto:comed@kku.ac.th)
- หรือหากต้องการส่งข้อความสอบถาม สามารถกดปุ่ม **"🙋‍♂️ ขอคุยกับเจ้าหน้าที่"** เพื่อฝากเรื่องไว้ได้ครับ`,
      keywords: ['อาจารย์', 'อาจารย์ที่ปรึกษา', 'คณะศึกษาศาสตร์', 'ติดต่ออาจารย์', 'ห้องพักอาจารย์', 'เบอร์อาจารย์']
    },
    {
      category: 'activities',
      question: 'กิจกรรมบายเนียร์และค่ายวิชาการจัดขึ้นเมื่อใด?',
      answer: `🎉 **กิจกรรมและค่ายสาขาวิชาคอมพิวเตอร์ศึกษา**
ติดตามรายละเอียดวัน เวลา สถานที่ และกำหนดการกิจกรรมต่าง ๆ (เช่น ค่ายวิชาการ, บายเนียร์, กิจกรรมสานสัมพันธ์) ได้ที่หน้า [แผนงานและกิจกรรม (Plans.html)](Plans.html) และ [ระบบ EventClass (eventclass.html)](eventclass.html)`,
      keywords: ['กิจกรรม', 'บายเนียร์', 'ค่าย', 'event', 'แผนงาน', 'plans', 'งานสาขา']
    }
  ];

  class ComedSupportEngine {
    constructor() {
      this.kbArticles = [...EMBEDDED_KB];
      this.currentTicket = null;
      this.realtimeSub = null;
      this.onMessageCallback = null;
      this.isOnline = navigator.onLine;
      this.geminiApiKey = localStorage.getItem('COMED_GEMINI_API_KEY') || '';
      
      // Auto-load dynamic articles from Supabase
      this.fetchKnowledgeBaseFromCloud();
    }

    getSupabase() {
      if (typeof window.getSupabaseClient === 'function') {
        return window.getSupabaseClient();
      }
      if (window.supabase && window.SUPABASE_CONFIG) {
        return window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
      }
      return null;
    }

    /**
     * ดึงคลังข้อมูลทางการจาก Supabase kb_articles
     */
    async fetchKnowledgeBaseFromCloud() {
      const sb = this.getSupabase();
      if (!sb) return this.kbArticles;
      try {
        const { data, error } = await sb.from('kb_articles')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          this.kbArticles = data;
          console.log(`[SupportEngine] Loaded ${data.length} dynamic KB articles from Cloud.`);
        }
      } catch (err) {
        console.warn("[SupportEngine] Cloud KB fetch fallback to embedded:", err);
      }
      return this.kbArticles;
    }

    /**
     * Tier 1: Search Knowledge Base via Keyword Semantic Matching
     */
    searchKnowledgeBase(query) {
      if (!query || typeof query !== 'string') return null;
      const clean = query.toLowerCase().trim();
      const tokens = clean.split(/[\s,+/_-]+/).filter(t => t.length > 1);

      let bestMatch = null;
      let highestScore = 0;

      this.kbArticles.forEach(item => {
        let score = 0;
        const qText = (item.question || '').toLowerCase();
        const aText = (item.answer || '').toLowerCase();
        const kwList = Array.isArray(item.keywords) ? item.keywords.map(k => String(k).toLowerCase()) : [];

        // Exact question match
        if (qText.includes(clean)) score += 10;
        if (clean.includes(qText)) score += 8;

        // Keyword matches
        tokens.forEach(tok => {
          if (kwList.some(k => k.includes(tok) || tok.includes(k))) score += 4;
          if (qText.includes(tok)) score += 3;
          if (aText.includes(tok)) score += 1;
        });

        if (score > highestScore) {
          highestScore = score;
          bestMatch = item;
        }
      });

      // Threshold check
      if (highestScore >= 3) {
        return {
          article: bestMatch,
          confidence: Math.min(100, highestScore * 10),
          source: 'knowledge_base'
        };
      }
      return null;
    }

    /**
     * Tier 2: Free Unlimited AI Inference via Pollinations.ai with Dynamic Knowledge Context (RAG)
     */
    async queryPollinationsAI(prompt, contextMessages = []) {
      const systemPrompt = `คุณคือ "COMED AI Assistant" ผู้ช่วยปัญญาประดิษฐ์อัจฉริยะประจำสาขาวิชาคอมพิวเตอร์ศึกษา (COMED KKU) คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น
บทบาทและการจัดรูปแบบข้อความที่ต้องปฏิบัติตามอย่างเคร่งครัด:
1. ตอบคำถามอย่างสุภาพ ฉลาด รวดเร็ว น่าอ่าน มีโครงสร้างชัดเจน และเป็นมิตรต่อนักศึกษา
2. **การจัดรูปแบบข้อความให้อ่านง่ายและสวยงาม**:
   - ใช้ **ตัวหนา** ในจุดสำคัญหรือหัวข้อ เช่น **ค่าเสื้อสาขา**, **ขั้นตอนการชำระเงิน**
   - ใช้ bullet list (-) หรือตัวเลข (1, 2, 3) จัดเป็นข้อย่อย
   - หากมีตารางหรือเปรียบเทียบ ให้ใช้รูปแบบ Markdown Table เช่น:
     | รายการ | ราคา |
     | :--- | :---: |
     | ปกติ | 390฿ |
   - สามารถส่งรูปภาพประกอบในคำตอบได้ในรูปแบบ Markdown Image: ![คำอธิบายภาพ](URLรูปภาพ)
   - สามารถแนบลิงก์ที่เกี่ยวข้องได้ในรูปแบบ Markdown Link: [ข้อความลิงก์](URL) เช่น [ระบบชำระเงิน (payment.html)](payment.html)
3. ข้อมูลสาขาวิชาสำคัญ:
   - ค่าเสื้อสาขาวิชาเอก (COMED 69): 390 บาท (<= 2XL) และ 410 บาท (>= 3XL) ชำระผ่านหน้าเว็บ payment.html
   - ค่าทำป้ายสาขาวิชา (PAIMAI69): 190 บาท
   - ปฏิทินและกิจกรรม: ดูที่ Calendar.html และ Plans.html
   - ดาวน์โหลดเอกสารและไฟล์สื่อ: download.html และ storage.html
   - ที่ตั้งสาขาวิชา: อาคาร 1 คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น
4. ตอบโดยอ้างอิงจากคลังข้อมูลทางการที่ระบุเป็นหลัก ห้ามแต่งเติมข้อมูลที่อาจสร้างความเข้าใจผิด`;

      try {
        // Dynamic Knowledge Base Injection (RAG): Inject top official articles from this.kbArticles
        let kbContextText = '';
        if (Array.isArray(this.kbArticles) && this.kbArticles.length > 0) {
          kbContextText = '\n\n[ข้อมูลทางการในคลังความรู้สาขาวิชา COMED KKU]:\n' + 
            this.kbArticles.slice(0, 8).map((a, i) => `${i+1}. คำถาม: ${a.question}\nคำตอบ: ${a.answer}`).join('\n\n');
        }

        const fullPrompt = `${systemPrompt}${kbContextText}\n\nคำถามจากผู้ใช้: ${prompt}\nคำแนะนำ: ตอบอย่างน่าอ่าน สุภาพ มีตัวหนา ข้อย่อย และลิงก์/ภาพประกอบที่เกี่ยวข้อง`;
        const url = 'https://text.pollinations.ai/' + encodeURIComponent(fullPrompt) + '?model=openai';

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Pollinations HTTP ${response.status}`);
        const text = await response.text();
        if (text && text.trim().length > 0) {
          return {
            answer: text.trim(),
            source: 'pollinations_ai',
            model: 'Pollinations Smart Neural'
          };
        }
      } catch (err) {
        console.warn("[SupportEngine] Pollinations AI error, checking fallback:", err);
        return null;
      }
    }

    /**
     * Tier 3: Google Gemini Free Tier API (Optional high-reasoning engine)
     */
    async queryGeminiAI(prompt, apiKey) {
      const key = apiKey || this.geminiApiKey;
      if (!key) return null;

      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        
        let kbContextText = '';
        if (Array.isArray(this.kbArticles) && this.kbArticles.length > 0) {
          kbContextText = '\n\n[ข้อมูลทางการในคลังความรู้สาขาวิชา]:\n' + 
            this.kbArticles.slice(0, 8).map((a, i) => `- ${a.question}: ${a.answer}`).join('\n');
        }

        const instruction = `คุณคือ COMED AI Assistant ตอบคำถามนี้โดยจัดรูปแบบให้อ่านง่าย มีตัวหนา ลิสต์ข้อย่อย ลิงก์ และตารางเปรียบเทียบเมื่อเหมาะสม:${kbContextText}\n\nคำถาม: "${prompt}"`;

        const bodyData = {
          contents: [{ parts: [{ text: instruction }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1200
          }
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });

        if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            answer: text.trim(),
            source: 'gemini_flash',
            model: 'Gemini 1.5 Flash'
          };
        }
      } catch (err) {
        console.warn("[SupportEngine] Gemini API error:", err);
      }
      return null;
    }

    /**
     * Hybrid Multi-Tier AI Analysis Engine
     */
    async askSmartAI(userPrompt, contextMessages = []) {
      // Step 1: Knowledge Base Match (Direct hits are formatted with rich text)
      const kbMatch = this.searchKnowledgeBase(userPrompt);
      if (kbMatch && kbMatch.confidence >= 60) {
        return {
          answer: kbMatch.article.answer,
          matchedQuestion: kbMatch.article.question,
          category: kbMatch.article.category,
          source: 'knowledge_base',
          confidence: kbMatch.confidence
        };
      }

      // Step 2: Try Gemini if Key available
      if (this.geminiApiKey) {
        const geminiRes = await this.queryGeminiAI(userPrompt, this.geminiApiKey);
        if (geminiRes) return geminiRes;
      }

      // Step 3: Run Pollinations Free AI
      const aiRes = await this.queryPollinationsAI(userPrompt, contextMessages);
      if (aiRes) return aiRes;

      // Step 4: Fallback to best guess from Knowledge Base
      if (kbMatch) {
        return {
          answer: kbMatch.article.answer + "\n\n*(หมายเหตุ: คำตอบนี้อ้างอิงจากหัวข้อที่ใกล้เคียงที่สุดในคลังข้อมูลสาขาวิชา หากต้องการข้อมูลเฉพาะเจาะจงเพิ่มเติม สามารถกดปุ่มขอคุยกับเจ้าหน้าที่ด้านล่างได้เลยครับ)*",
          matchedQuestion: kbMatch.article.question,
          source: 'knowledge_base_fuzzy',
          confidence: kbMatch.confidence
        };
      }

      // Ultimate Fallback
      return {
        answer: "ขออภัยครับ คำถามนี้ยังไม่มีระบุในคลังข้อมูลของสาขาโดยตรง เพื่อความถูกต้องสมบูรณ์และรวดเร็ว คุณสามารถกดปุ่ม **'🙋‍♂️ ขอคุยกับเจ้าหน้าที่'** ด้านล่างเพื่อให้แอดมินสาขาเข้ามาช่วยตอบข้อมูลได้ทันทีครับ!",
        source: 'system_fallback',
        confidence: 0
      };
    }

    /**
     * สร้างหรือดึง Support Ticket ใน Supabase
     */
    async getOrCreateTicket(userData = {}) {
      const sb = this.getSupabase();
      if (!sb) {
        throw new Error("ไม่สามารถเชื่อมต่อฐานข้อมูล Supabase ได้ กรุณาตรวจสอบอินเทอร์เน็ต");
      }

      const ticketCode = 'TIC-' + Math.floor(100000 + Math.random() * 900000);
      const payload = {
        ticket_code: ticketCode,
        user_name: userData.name || 'ผู้ติดต่อทั่วไป',
        user_email: userData.email || '',
        user_phone: userData.phone || '',
        student_id: userData.studentId || '',
        topic: userData.topic || 'สอบถามข้อมูลทั่วไป',
        status: 'open',
        mode: 'ai',
        last_message: userData.initialMessage || 'เริ่มการสนทนา',
        last_message_at: new Date().toISOString()
      };

      const { data, error } = await sb.from('support_tickets')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("[SupportEngine] Create ticket error:", error);
        throw error;
      }

      this.currentTicket = data;
      return data;
    }

    /**
     * ส่งข้อความลงตาราง support_messages ใน Supabase
     */
    async sendMessage(ticketId, senderType, senderName, messageText, attachments = []) {
      const sb = this.getSupabase();
      if (!sb || !ticketId) return null;

      const payload = {
        ticket_id: ticketId,
        sender_type: senderType,
        sender_name: senderName,
        message: messageText,
        attachments: attachments,
        created_at: new Date().toISOString()
      };

      const { data, error } = await sb.from('support_messages')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("[SupportEngine] Send message error:", error);
        return null;
      }

      // Update ticket last_message
      await sb.from('support_tickets')
        .update({
          last_message: messageText.substring(0, 150),
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      return data;
    }

    /**
     * ดึงประวัติข้อความของ Ticket
     */
    async fetchTicketMessages(ticketId) {
      const sb = this.getSupabase();
      if (!sb || !ticketId) return [];

      const { data, error } = await sb.from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("[SupportEngine] Fetch messages error:", error);
        return [];
      }
      return data || [];
    }

    /**
     * เปิดฟัง Realtime Message ของ Ticket นั้น ๆ
     */
    subscribeTicketMessages(ticketId, onNewMessage) {
      const sb = this.getSupabase();
      if (!sb || !ticketId) return;

      if (this.realtimeSub) {
        this.unsubscribe();
      }

      const channelName = `ticket_chat_${ticketId}`;
      this.realtimeSub = sb.channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`
        }, (payload) => {
          if (typeof onNewMessage === 'function') {
            onNewMessage(payload.new);
          }
        })
        .subscribe();

      console.log(`[SupportEngine] Realtime subscribed to ${channelName}`);
    }

    /**
     * สลับโหมดตั๋วเป็น 'human_requested' หรือ 'human_active' เพื่อเรียกแอดมิน
     */
    async requestHumanSupport(ticketId) {
      const sb = this.getSupabase();
      if (!sb || !ticketId) return false;

      const { error } = await sb.from('support_tickets')
        .update({
          mode: 'human_requested',
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) {
        console.error("[SupportEngine] Request human support error:", error);
        return false;
      }

      await this.sendMessage(ticketId, 'system', 'ระบบบริการ', '🔔 ผู้ใช้ได้กดขอติดต่อพูดคุยกับเจ้าหน้าที่แล้ว ระบบกำลังแจ้งเตือนแอดมินประจำการ...');
      return true;
    }

    unsubscribe() {
      if (this.realtimeSub) {
        const sb = this.getSupabase();
        if (sb) sb.removeChannel(this.realtimeSub);
        this.realtimeSub = null;
      }
    }
  }

  // Export to global window object
  window.ComedSupportEngine = new ComedSupportEngine();

})(window);
