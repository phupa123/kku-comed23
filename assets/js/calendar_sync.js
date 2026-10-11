/**
 * =========================================================================
 * COMED CALENDAR & SYNC SUITE (calendar_sync.js)
 * สำหรับ:
 * 1. แปลงแผนงาน (Plans) เป็น URL สำหรับเพิ่มใน Google Calendar
 * 2. สร้างไฟล์ iCalendar (.ics) สำหรับดาวน์โหลด/เปิดบนปฏิทินในเครื่อง
 *    (Apple Calendar, Windows Calendar, Outlook)
 * 3. ส่งออกตารางงานทั้งหมดเป็นไฟล์ .ics เพื่อนำเข้าปฏิทินครั้งเดียวครบทุกงาน
 * =========================================================================
 */

(function(window) {
  'use strict';

  function formatIcsDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  function formatIcsDateOnly(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  function cleanText(str) {
    if (!str) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  const CalendarSync = {
    /**
     * สร้างลิงก์ Google Calendar Web URL สำหรับเพิ่ม Event ทันที
     * @param {Object} plan 
     * @returns {string} url
     */
    getGoogleCalendarUrl(plan) {
      if (!plan) return '';
      const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';

      const title = encodeURIComponent(plan.title || 'กิจกรรม COMED');
      
      let details = (plan.description || '') + '\n\n';
      details += `• ขอบเขต: ${plan.scope === 'department' ? 'งานสาขา (ทางการ)' : plan.scope === 'shared' ? 'งานกลุ่ม' : 'งานส่วนบุคคล'}\n`;
      if (plan.creator_name) details += `• ผู้จัดทำ: ${plan.creator_name}\n`;
      if (plan.meet_link) details += `• ลิงก์ห้องประชุม: ${plan.meet_link}\n`;
      details += `• ดูรายละเอียดเพิ่มเติมบน PlanToDo Hub: ${window.location.origin}/Plans.html?plan=${plan.id || ''}`;
      
      const detailsEncoded = encodeURIComponent(details.trim());
      const locationEncoded = encodeURIComponent(plan.location || (plan.meet_link ? 'Online (Google Meet)' : 'คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น'));

      let datesParam = '';
      const start = new Date(plan.start_date || new Date());
      let end = plan.end_date ? new Date(plan.end_date) : null;

      if (!end || end <= start) {
        end = new Date(start.getTime() + (plan.is_all_day ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000));
      }

      if (plan.is_all_day) {
        // All-day format: YYYYMMDD/YYYYMMDD
        const startStr = formatIcsDateOnly(start);
        const endDayPlus1 = new Date(end.getTime() + 24 * 60 * 60 * 1000);
        const endStr = formatIcsDateOnly(endDayPlus1);
        datesParam = `${startStr}/${endStr}`;
      } else {
        // DateTime UTC format: YYYYMMDDTHHMMSSZ/YYYYMMDDTHHMMSSZ
        const startUtc = start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const endUtc = end.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        datesParam = `${startUtc}/${endUtc}`;
      }

      return `${baseUrl}&text=${title}&details=${detailsEncoded}&location=${locationEncoded}&dates=${datesParam}`;
    },

    /**
     * เปิดหน้า Google Calendar ให้ผู้ใช้เพิ่มกิจกรรมทันทีในแท็บใหม่
     * @param {Object} plan 
     */
    openGoogleCalendar(plan) {
      const url = this.getGoogleCalendarUrl(plan);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },

    /**
     * สร้างเนื้อหาไฟล์ iCalendar (.ics) สำหรับ 1 แผนงาน
     * @param {Object} plan 
     * @returns {string} ics string
     */
    generateIcsContent(plan) {
      if (!plan) return '';
      const nowStr = formatIcsDateTime(new Date());
      const uid = (plan.id || 'comed-plan-' + Date.now()) + '@comed23.kku.ac.th';
      const summary = cleanText(plan.title || 'กิจกรรม COMED');
      
      let desc = (plan.description || '') + '\n';
      desc += `ขอบเขต: ${plan.scope === 'department' ? 'งานสาขา' : 'งานกลุ่ม'}\n`;
      if (plan.creator_name) desc += `ผู้จัดทำ: ${plan.creator_name}\n`;
      if (plan.meet_link) desc += `ลิงก์ประชุม: ${plan.meet_link}\n`;
      desc += `ดูบนระบบ: ${window.location.origin}/Plans.html?plan=${plan.id || ''}`;
      
      const cleanDesc = cleanText(desc);
      const loc = cleanText(plan.location || (plan.meet_link || 'คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น'));

      const start = new Date(plan.start_date || new Date());
      let end = plan.end_date ? new Date(plan.end_date) : null;
      if (!end || end <= start) {
        end = new Date(start.getTime() + (plan.is_all_day ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000));
      }

      let dateBlock = '';
      if (plan.is_all_day) {
        const startDay = formatIcsDateOnly(start);
        const endDay = formatIcsDateOnly(new Date(end.getTime() + 24 * 60 * 60 * 1000));
        dateBlock = `DTSTART;VALUE=DATE:${startDay}\nDTEND;VALUE=DATE:${endDay}`;
      } else {
        dateBlock = `DTSTART:${formatIcsDateTime(start)}\nDTEND:${formatIcsDateTime(end)}`;
      }

      return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//COMED KKU//Plans Calendar Hub//TH',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowStr}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${cleanDesc}`,
        `LOCATION:${loc}`,
        dateBlock,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
    },

    /**
     * ดาวน์โหลดไฟล์ .ics เพื่อเปิดบนปฏิทินในเครื่อง (Apple Calendar, Windows Calendar, Outlook)
     * @param {Object} plan 
     */
    downloadIcsFile(plan) {
      const ics = this.generateIcsContent(plan);
      if (!ics) return;
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `plan_${(plan.title || 'event').replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, '_')}.ics`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    /**
     * ส่งออกกิจกรรมทั้งหมดที่ระบุเป็นไฟล์ .ics ก้อนเดียว
     * เพื่อให้ผู้ใช้สามารถ Import เข้า Google Calendar หรือ Apple Calendar ได้ทั้งหมดในครั้งเดียว
     * @param {Array} plansList 
     * @param {string} calendarName 
     */
    exportAllPlansIcs(plansList = [], calendarName = 'COMED23 Plans Calendar') {
      if (!plansList || plansList.length === 0) {
        alert("ไม่มีรายการกิจกรรมที่จะส่งออก");
        return;
      }

      const nowStr = formatIcsDateTime(new Date());
      let vevents = [];

      plansList.forEach(plan => {
        if (!plan.start_date) return;
        const uid = (plan.id || 'comed-' + Math.random().toString(36).substring(2)) + '@comed23.kku.ac.th';
        const summary = cleanText(plan.title || 'กิจกรรม COMED');
        
        let desc = (plan.description || '') + '\n';
        desc += `ขอบเขต: ${plan.scope === 'department' ? 'งานสาขา' : 'งานกลุ่ม'}\n`;
        if (plan.creator_name) desc += `ผู้สร้าง: ${plan.creator_name}\n`;
        if (plan.meet_link) desc += `ลิงก์: ${plan.meet_link}\n`;
        desc += `ลิงก์ระบบ: ${window.location.origin}/Plans.html?plan=${plan.id || ''}`;
        
        const cleanDesc = cleanText(desc);
        const loc = cleanText(plan.location || (plan.meet_link || 'คณะศึกษาศาสตร์ มข.'));

        const start = new Date(plan.start_date);
        let end = plan.end_date ? new Date(plan.end_date) : null;
        if (!end || end <= start) {
          end = new Date(start.getTime() + (plan.is_all_day ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000));
        }

        let dateLines = '';
        if (plan.is_all_day) {
          const s = formatIcsDateOnly(start);
          const e = formatIcsDateOnly(new Date(end.getTime() + 24 * 60 * 60 * 1000));
          dateLines = `DTSTART;VALUE=DATE:${s}\r\nDTEND;VALUE=DATE:${e}`;
        } else {
          dateLines = `DTSTART:${formatIcsDateTime(start)}\r\nDTEND:${formatIcsDateTime(end)}`;
        }

        vevents.push([
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${nowStr}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${cleanDesc}`,
          `LOCATION:${loc}`,
          dateLines,
          'STATUS:CONFIRMED',
          'END:VEVENT'
        ].join('\r\n'));
      });

      const fullIcs = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//COMED KKU//Plans Calendar Hub//TH',
        `X-WR-CALNAME:${calendarName}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        vevents.join('\r\n'),
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([fullIcs], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `COMED23_All_Plans_${new Date().toISOString().slice(0, 10)}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  window.CalendarSync = CalendarSync;

})(window);
