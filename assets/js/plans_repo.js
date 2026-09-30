/**
 * =========================================================================
 * PLANS SUPABASE REPOSITORY (STRICT NO-LOCALSTORAGE)
 * จัดการข้อมูลแผนงาน ปฏิทินสาขา และงานกลุ่ม ผ่าน Supabase Realtime โดยตรง 100%
 * =========================================================================
 */

(function(window) {
  'use strict';

  // In-memory runtime cache only (NO LocalStorage per user requirement)
  let runtimePlansCache = [];
  let realtimeChannel = null;

  function getClient() {
    if (typeof window.getSupabaseClient === 'function') {
      return window.getSupabaseClient();
    }
    if (window.supabase && window.SUPABASE_CONFIG) {
      return window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    }
    return null;
  }

  const PlansRepo = {
    // 1. ดึงแผนงานทั้งหมด (สาขา, ที่แชร์กับผู้ใช้, หรือที่ผู้ใช้สร้าง)
    async fetchPlans(userEmail = null) {
      const client = getClient();
      if (!client) {
        console.warn("[PlansRepo] Supabase client not initialized.");
        return runtimePlansCache;
      }

      try {
        let query = client
          .from('plans')
          .select('*')
          .order('start_date', { ascending: true });

        const { data, error } = await query;
        if (error) {
          console.error("[PlansRepo] Fetch error:", error);
          // Return cache if available
          return runtimePlansCache;
        }

        // กรองสิทธิ์การเข้าถึง (Client-side filtering for user vs shared vs department)
        let filtered = data || [];
        if (userEmail) {
          const lowerEmail = userEmail.toLowerCase().trim();
          filtered = filtered.filter(item => {
            if (item.scope === 'department' || item.is_official) return true;
            if (item.creator_email && item.creator_email.toLowerCase().trim() === lowerEmail) return true;
            // Check collaborators JSON
            if (Array.isArray(item.collaborators)) {
              return item.collaborators.some(c => (c.email || '').toLowerCase().trim() === lowerEmail);
            }
            return false;
          });
        }

        runtimePlansCache = filtered;
        return runtimePlansCache;
      } catch (err) {
        console.error("[PlansRepo] Unexpected fetch error:", err);
        return runtimePlansCache;
      }
    },

    // 2. สร้างแผนงานใหม่
    async createPlan(planPayload) {
      const client = getClient();
      if (!client) throw new Error("Supabase client is not available.");

      const payload = {
        title: planPayload.title,
        description: planPayload.description || '',
        category: planPayload.category || 'activity',
        scope: planPayload.scope || 'department',
        status: planPayload.status || 'pending',
        priority: planPayload.priority || 'normal',
        start_date: planPayload.start_date,
        end_date: planPayload.end_date || null,
        is_all_day: planPayload.is_all_day !== false,
        location: planPayload.location || '',
        meet_link: planPayload.meet_link || '',
        color: planPayload.color || '#f97316',
        creator_email: planPayload.creator_email,
        creator_name: planPayload.creator_name || 'สมาชิกสาขา',
        creator_student_id: planPayload.creator_student_id || '',
        collaborators: planPayload.collaborators || [],
        tags: planPayload.tags || [],
        is_official: planPayload.is_official === true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let { data, error } = await client
        .from('plans')
        .insert([payload])
        .select()
        .single();

      // หากเจอปัญหาคอลัมน์ใหม่ยังไม่ถูก reload ใน Supabase Schema Cache (PGRST204)
      if (error && error.code === 'PGRST204') {
        console.warn("[PlansRepo] Schema cache column mismatch detected. Retrying with basic columns...", error);
        const fallbackPayload = {
          title: payload.title,
          description: payload.description,
          start_date: payload.start_date,
          end_date: payload.end_date,
          creator_email: payload.creator_email
        };
        const retryResult = await client
          .from('plans')
          .insert([fallbackPayload])
          .select()
          .single();
        
        if (retryResult.error) {
          console.error("[PlansRepo] Fallback create also failed:", retryResult.error);
          throw error;
        }
        data = retryResult.data;
        error = null;
      }

      if (error) {
        console.error("[PlansRepo] Create error:", error);
        throw error;
      }

      // Update in-memory
      if (data) {
        runtimePlansCache.push(data);
      }
      return data;
    },

    // 3. แก้ไขแผนงาน
    async updatePlan(planId, updates) {
      const client = getClient();
      if (!client) throw new Error("Supabase client is not available.");

      updates.updated_at = new Date().toISOString();

      const { data, error } = await client
        .from('plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

      if (error) {
        console.error("[PlansRepo] Update error:", error);
        throw error;
      }

      // Update in-memory
      const idx = runtimePlansCache.findIndex(p => p.id === planId);
      if (idx !== -1 && data) {
        runtimePlansCache[idx] = data;
      }
      return data;
    },

    // 4. ลบแผนงาน
    async deletePlan(planId) {
      const client = getClient();
      if (!client) throw new Error("Supabase client is not available.");

      const { error } = await client
        .from('plans')
        .delete()
        .eq('id', planId);

      if (error) {
        console.error("[PlansRepo] Delete error:", error);
        throw error;
      }

      runtimePlansCache = runtimePlansCache.filter(p => p.id !== planId);
      return true;
    },

    // 5. ติดตั้ง Realtime listener
    subscribeToChanges(onChangeCallback) {
      const client = getClient();
      if (!client) return;

      if (realtimeChannel) {
        client.removeChannel(realtimeChannel);
      }

      realtimeChannel = client
        .channel('public:plans')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, (payload) => {
          console.log("[PlansRepo Realtime]", payload);
          if (typeof onChangeCallback === 'function') {
            onChangeCallback(payload);
          }
        })
        .subscribe();

      return realtimeChannel;
    },

    // 6. ดึงข้อมูลนักศึกษาสำหรับช่อง Autocomplete เพิ่มเพื่อน
    getStudentOptions(query = '') {
      if (!window.STUDENTS_DATA || !Array.isArray(window.STUDENTS_DATA)) {
        return [];
      }
      const q = (query || '').toLowerCase().trim();
      if (!q) return window.STUDENTS_DATA.slice(0, 15);

      return window.STUDENTS_DATA.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.nickname && s.nickname.toLowerCase().includes(q)) ||
        (s.id && s.id.includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    }
  };

  window.PlansRepo = PlansRepo;

})(window);
