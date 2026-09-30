/**
 * =========================================================================
 * PLANS & PLAN-TODO ADVANCED SUPABASE REPOSITORY (STRICT NO-LOCALSTORAGE)
 * รองรับ:
 * - ห้องงานหลัก (Master Plans) & งานย่อย (PlanToDo Tasks)
 * - คำนวณความคืบหน้า % (Progress Percentage)
 * - กำหนดคอลัมน์ขั้นตอนการทำงานเองได้ (Custom Columns)
 * - แยกขอบเขต: ส่วนตัว, แชร์เพื่อนที่ระบุ, หรือแชร์ทั้งสาขา
 * - อัปโหลดไฟล์/รูปภาพ/วิดีโอ แนบในงาน
 * - ระบุโปรไฟล์ผู้สร้าง (Creator Profile) และผู้ย้ายการ์ดล่าสุด (Last Moved Profile)
 * - ระบบถังขยะหลายระดับ (Multi-Tier Trash / Recycle Bin):
 *   * เจ้าของลบงานหลัก -> ไปถังขยะส่วนตัว
 *   * แอดมินลบงานหลัก -> ไปถังขยะหลังบ้าน (Admin Trash)
 *   * กู้คืนงานหลัก -> งานย่อยทั้งหมดฟื้นคืนกลับมาอัตโนมัติ
 *   * ลบงานย่อย -> ไปอยู่ในถังขยะของห้องงานหลักนั้น
 *   * ลบถาวรได้เฉพาะของตัวเอง (เจ้าของ) หรือแอดมินเท่านั้น
 * =========================================================================
 */

(function(window) {
  'use strict';

  // In-memory runtime state ONLY (Strictly NO LocalStorage)
  let runtimePlansCache = [];
  let runtimeTasksCache = {}; // { plan_id: [task, task, ...] }
  let realtimeChannel = null;
  let realtimeTasksChannel = null;

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
    // สร้าง UUID v4 ปลอดภัย client-side
    generateUUID() {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    // 1. ดึงแผนงานหลัก (กรองถังขยะและสิทธิ์การเข้าถึง)
    async fetchPlans(userEmail = null, includeDeleted = false, deletedByType = null) {
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

        if (!includeDeleted) {
          query = query.or('is_deleted.is.null,is_deleted.eq.false');
        } else {
          query = query.eq('is_deleted', true);
          if (deletedByType) {
            query = query.eq('deleted_by_type', deletedByType);
          }
        }

        const { data, error } = await query;
        if (error) {
          console.error("[PlansRepo] Fetch plans error:", error);
          return runtimePlansCache;
        }

        let filtered = data || [];
        if (userEmail && !includeDeleted) {
          const lowerEmail = userEmail.toLowerCase().trim();
          filtered = filtered.filter(item => {
            if (item.scope === 'department' || item.is_official) return true;
            if (item.creator_email && item.creator_email.toLowerCase().trim() === lowerEmail) return true;
            if (Array.isArray(item.collaborators)) {
              return item.collaborators.some(c => (c.email || '').toLowerCase().trim() === lowerEmail);
            }
            return false;
          });
        }

        if (!includeDeleted) {
          runtimePlansCache = filtered;
        }
        return filtered;
      } catch (err) {
        console.error("[PlansRepo] Unexpected fetch error:", err);
        return runtimePlansCache;
      }
    },

    // 2. ดึงงานย่อย (PlanToDo Tasks) ของห้องงานหลัก
    async fetchTasksForPlan(planId, includeDeleted = false) {
      const client = getClient();
      if (!client || !planId) return [];

      try {
        let query = client
          .from('plan_tasks')
          .select('*')
          .eq('plan_id', planId)
          .order('order_index', { ascending: true });

        if (!includeDeleted) {
          query = query.or('is_deleted.is.null,is_deleted.eq.false');
        } else {
          query = query.eq('is_deleted', true);
        }

        const { data, error } = await query;
        if (error) {
          console.error("[PlansRepo] Fetch tasks error:", error);
          return runtimeTasksCache[planId] || [];
        }

        const tasks = data || [];
        if (!includeDeleted) {
          runtimeTasksCache[planId] = tasks;
        }
        return tasks;
      } catch (err) {
        console.error("[PlansRepo] Unexpected fetch tasks error:", err);
        return runtimeTasksCache[planId] || [];
      }
    },

    // 3. สร้างห้องงานหลัก (Master Plan)
    async createPlan(planPayload) {
      const client = getClient();
      if (!client) throw new Error("Supabase client is not available.");

      const newId = planPayload.id || this.generateUUID();
      const defaultCols = planPayload.custom_columns || ["สิ่งที่ต้องทำ", "กำลังทำ", "เสร็จสิ้น"];

      const payload = {
        id: newId,
        title: planPayload.title,
        description: planPayload.description || '',
        category: planPayload.category || 'activity',
        scope: planPayload.scope || 'department',
        status: planPayload.status || 'pending',
        priority: planPayload.priority || 'normal',
        progress_percentage: 0,
        custom_columns: defaultCols,
        start_date: planPayload.start_date,
        end_date: planPayload.end_date || null,
        is_all_day: planPayload.is_all_day !== false,
        location: planPayload.location || '',
        meet_link: planPayload.meet_link || '',
        color: planPayload.color || '#f97316',
        creator_email: planPayload.creator_email,
        creator_name: planPayload.creator_name || 'สมาชิกสาขา',
        creator_avatar: planPayload.creator_avatar || '',
        creator_student_id: planPayload.creator_student_id || '',
        collaborators: planPayload.collaborators || [],
        tags: planPayload.tags || [],
        attachments: planPayload.attachments || [],
        is_official: planPayload.is_official === true,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await client
        .from('plans')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("[PlansRepo] Create plan error:", error);
        throw error;
      }

      if (data) {
        runtimePlansCache.push(data);
      }
      return data;
    },

    // 4. แก้ไขห้องงานหลัก
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
        console.error("[PlansRepo] Update plan error:", error);
        throw error;
      }

      const idx = runtimePlansCache.findIndex(p => p.id === planId);
      if (idx !== -1 && data) {
        runtimePlansCache[idx] = data;
      }
      return data;
    },

    // 5. สร้างงานย่อย (PlanToDo Task) ในห้องงานหลัก
    async createTask(taskPayload) {
      const client = getClient();
      if (!client) throw new Error("Supabase client is not available.");

      const newId = taskPayload.id || this.generateUUID();
      const payload = {
        id: newId,
        plan_id: taskPayload.plan_id,
        title: taskPayload.title,
        description: taskPayload.description || '',
        column_name: taskPayload.column_name || 'สิ่งที่ต้องทำ',
        priority: taskPayload.priority || 'normal',
        order_index: taskPayload.order_index || 0,
        creator_email: taskPayload.creator_email,
        creator_name: taskPayload.creator_name || 'สมาชิก',
        creator_avatar: taskPayload.creator_avatar || '',
        last_moved_by_email: taskPayload.creator_email,
        last_moved_by_name: taskPayload.creator_name || 'สมาชิก',
        last_moved_by_avatar: taskPayload.creator_avatar || '',
        assignees: taskPayload.assignees || [],
        attachments: taskPayload.attachments || [],
        is_completed: taskPayload.is_completed === true,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await client
        .from('plan_tasks')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("[PlansRepo] Create task error:", error);
        throw error;
      }

      // Re-calculate parent plan progress
      await this.recalculatePlanProgress(taskPayload.plan_id);
      return data;
    },

    // 6. แก้ไขหรือย้ายการ์ดงานย่อย (Move Column / Reorder)
    async updateTask(taskId, updates, moverUser = null) {
      const client = getClient();
      if (!client) throw new Error("Supabase client is not available.");

      updates.updated_at = new Date().toISOString();
      if (moverUser) {
        updates.last_moved_by_email = moverUser.email;
        updates.last_moved_by_name = moverUser.name;
        updates.last_moved_by_avatar = moverUser.avatar || '';
      }

      const { data, error } = await client
        .from('plan_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error("[PlansRepo] Update task error:", error);
        throw error;
      }

      if (data && data.plan_id) {
        await this.recalculatePlanProgress(data.plan_id);
      }
      return data;
    },

    // 7. คำนวณความคืบหน้า % ของห้องงานหลักอัตโนมัติ
    async recalculatePlanProgress(planId) {
      const client = getClient();
      if (!client || !planId) return;

      const tasks = await this.fetchTasksForPlan(planId, false);
      if (tasks.length === 0) {
        await client.from('plans').update({ progress_percentage: 0 }).eq('id', planId);
        return 0;
      }

      // ตรวจสอบงานที่เสร็จ (is_completed หรืออยู่ในคอลัมน์สุดท้าย เช่น เสร็จสิ้น)
      const completedCount = tasks.filter(t => t.is_completed || t.column_name.includes('เสร็จ')).length;
      const pct = Math.round((completedCount / tasks.length) * 100);

      await client.from('plans').update({ 
        progress_percentage: pct,
        status: pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : 'pending'
      }).eq('id', planId);

      return pct;
    },

    // 8. ลบห้องงานหลักลงถังขยะ (Soft Delete)
    async moveToTrashPlan(planId, userEmail, deletedByType = 'owner') {
      const client = getClient();
      if (!client) throw new Error("Supabase client is not available.");

      const { data, error } = await client
        .from('plans')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by_type: deletedByType, // 'owner' หรือ 'admin'
          deleted_by_email: userEmail
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      runtimePlansCache = runtimePlansCache.filter(p => p.id !== planId);
      return data;
    },

    // 9. กู้คืนห้องงานหลักจากถังขยะ (Restore Plan & Tasks)
    async restorePlan(planId) {
      const client = getClient();
      if (!client) throw new Error("Supabase client is not available.");

      const { data, error } = await client
        .from('plans')
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by_type: null,
          deleted_by_email: null
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // 10. ลบงานหลักถาวร (Permanent Delete - เจ้าของหรือแอดมินเท่านั้น)
    async permanentlyDeletePlan(planId, currentUserEmail, isAdmin = false) {
      const client = getClient();
      if (!client) throw new Error("Supabase client is not available.");

      // Check ownership unless admin
      if (!isAdmin) {
        const plan = runtimePlansCache.find(p => p.id === planId);
        if (plan && plan.creator_email && plan.creator_email.toLowerCase() !== currentUserEmail.toLowerCase()) {
          throw new Error("คุณไม่ได้รับอนุญาตให้ลบงานของผู้อื่นถาวร");
        }
      }

      // Delete tasks first then plan
      await client.from('plan_tasks').delete().eq('plan_id', planId);
      const { error } = await client.from('plans').delete().eq('id', planId);
      if (error) throw error;
      return true;
    },

    // 11. ลบงานย่อยลงถังขยะของห้องงานหลัก (Soft Delete Task)
    async moveToTrashTask(taskId, userEmail) {
      const client = getClient();
      if (!client) throw new Error("Supabase client is not available.");

      const { data, error } = await client
        .from('plan_tasks')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by_email: userEmail
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      if (data && data.plan_id) {
        await this.recalculatePlanProgress(data.plan_id);
      }
      return data;
    },

    // 12. กู้คืนงานย่อยกลับห้องงานหลัก
    async restoreTask(taskId) {
      const client = getClient();
      if (!client) throw new Error("Supabase client is not available.");

      const { data, error } = await client
        .from('plan_tasks')
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by_email: null
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      if (data && data.plan_id) {
        await this.recalculatePlanProgress(data.plan_id);
      }
      return data;
    },

    // 13. ลบงานย่อยถาวร (Permanent Delete Task)
    async permanentlyDeleteTask(taskId, currentUserEmail, isAdmin = false) {
      const client = getClient();
      if (!client) throw new Error("Supabase client is not available.");

      const { data: task } = await client.from('plan_tasks').select('creator_email, plan_id').eq('id', taskId).single();
      if (task && !isAdmin && task.creator_email && task.creator_email.toLowerCase() !== currentUserEmail.toLowerCase()) {
        throw new Error("คุณสามารถลบถาวรได้เฉพาะงานย่อยที่คุณเป็นผู้สร้างเท่านั้น");
      }

      const { error } = await client.from('plan_tasks').delete().eq('id', taskId);
      if (error) throw error;
      if (task && task.plan_id) {
        await this.recalculatePlanProgress(task.plan_id);
      }
      return true;
    },

    // 14. Realtime PubSub Listeners
    subscribeToChanges(onChangeCallback) {
      const client = getClient();
      if (!client) return;

      if (realtimeChannel) client.removeChannel(realtimeChannel);
      if (realtimeTasksChannel) client.removeChannel(realtimeTasksChannel);

      realtimeChannel = client
        .channel('public:plans')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, (payload) => {
          if (typeof onChangeCallback === 'function') onChangeCallback('plans', payload);
        })
        .subscribe();

      realtimeTasksChannel = client
        .channel('public:plan_tasks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_tasks' }, (payload) => {
          if (typeof onChangeCallback === 'function') onChangeCallback('plan_tasks', payload);
        })
        .subscribe();
    },

    // 15. ดึงรายชื่อนักศึกษาสำหรับ Autocomplete
    getStudentOptions(query = '') {
      if (!window.STUDENTS_DATA || !Array.isArray(window.STUDENTS_DATA)) return [];
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
