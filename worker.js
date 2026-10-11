/**
 * CLOUDFLARE WORKER ROUTER & STATIC ASSET ENGINE
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();

    // 0. Dedicated Cloud Storage Upload Proxy with complete CORS support (Streams directly to upstream)
    if (path === "/api/download-proxy") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*"
          }
        });
      }

      if (request.method === "GET" || request.method === "HEAD") {
        const targetUrl = url.searchParams.get("url");
        const filename = url.searchParams.get("filename") || "download";
        if (!targetUrl) {
          return new Response("Missing target url parameter", { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
        }

        try {
          const upstreamRes = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) KKU-Comed-Downloader/1.0"
            }
          });

          if (!upstreamRes.ok) {
            return new Response(`Upstream fetch failed: ${upstreamRes.status}`, {
              status: upstreamRes.status,
              headers: { "Access-Control-Allow-Origin": "*" }
            });
          }

          const responseHeaders = new Headers();
          responseHeaders.set("Access-Control-Allow-Origin", "*");
          responseHeaders.set("Access-Control-Expose-Headers", "Content-Disposition, Content-Length, Content-Type");
          
          const upstreamContentType = upstreamRes.headers.get("content-type");
          if (upstreamContentType) responseHeaders.set("Content-Type", upstreamContentType);

          const upstreamContentLength = upstreamRes.headers.get("content-length");
          if (upstreamContentLength) responseHeaders.set("Content-Length", upstreamContentLength);

          const safeFilename = encodeURIComponent(filename);
          responseHeaders.set("Content-Disposition", `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`);

          return new Response(upstreamRes.body, {
            status: upstreamRes.status,
            headers: responseHeaders
          });
        } catch (err) {
          return new Response("Download proxy error: " + err.message, {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" }
          });
        }
      }
    }

    if (path === "/api/catbox-proxy") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*"
          }
        });
      }

      if (request.method === "POST") {
        try {
          const contentType = request.headers.get("content-type") || "";
          const catboxRes = await fetch("https://catbox.moe/user/api.php", {
            method: "POST",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) KKU-Comed-Uploader/1.0",
              "Content-Type": contentType
            },
            body: request.body
          });
          const text = await catboxRes.text();
          return new Response(text, {
            status: catboxRes.status,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "text/plain; charset=utf-8"
            }
          });
        } catch (catErr) {
          return new Response("Catbox Worker Proxy Error: " + catErr.message, {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" }
          });
        }
      }
    }

    if (path === "/api/freeimage-proxy") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*"
          }
        });
      }

      if (request.method === "POST") {
        try {
          const contentType = request.headers.get("content-type") || "";
          const fiRes = await fetch("https://freeimage.host/api/1/upload", {
            method: "POST",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) KKU-Comed-Uploader/1.0",
              "Content-Type": contentType
            },
            body: request.body
          });
          const json = await fiRes.text();
          return new Response(json, {
            status: fiRes.status,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json; charset=utf-8"
            }
          });
        } catch (fiErr) {
          return new Response(JSON.stringify({ error: { message: fiErr.message } }), {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }
          });
        }
      }
    }

    // 0.3 Web Push Dispatcher (Sends payload to registered subscriber endpoints)
    if (path === "/api/push-dispatch") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*"
          }
        });
      }

      if (request.method === "POST") {
        try {
          const body = await request.json();
          const { title, message, link, type } = body;

          // Fetch registered push subscriptions from Supabase
          const SUPABASE_URL = "https://drqrliajxigxyrfaypfg.supabase.co";
          const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycXJsaWFqeGlneHlyZmF5cGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTQ1ODYsImV4cCI6MjEwNDA5MDU4Nn0.9IEsTHlUiVZEzNsqIaKeH5g1SzXw91SRALGeKFct0Nw";

          const subRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=*`, {
            headers: {
              "apikey": SUPABASE_ANON,
              "Authorization": `Bearer ${SUPABASE_ANON}`
            }
          });

          const subs = subRes.ok ? await subRes.json() : [];

          // Dispatch standard Web Push message to each device endpoint
          const pushPayload = JSON.stringify({
            title: title || "ประกาศด่วนจาก COMED23",
            message: message || "",
            link: link || "/",
            type: type || "info",
            timestamp: Date.now()
          });

          const results = await Promise.allSettled(subs.map(async (sub) => {
            if (!sub.endpoint) return null;
            try {
              // Direct endpoint trigger
              return await fetch(sub.endpoint, {
                method: "POST",
                headers: {
                  "TTL": "86400",
                  "Urgency": type === "urgent" ? "high" : "normal"
                },
                body: pushPayload
              });
            } catch (e) {
              return null;
            }
          }));

          return new Response(JSON.stringify({
            status: "success",
            delivered_devices: subs.length,
            title
          }), {
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            }
          });
        } catch (pushErr) {
          return new Response(JSON.stringify({ error: pushErr.message }), {
            status: 500,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            }
          });
        }
      }
    }

    // 1. Dynamic Campaign Routes (/payment/:id and /payment-admin/:id)
    let fetchUrl = request.url;
    let campaignParam = "";

    if (path === "/" || path === "") {
      fetchUrl = new URL("/index.html", url.origin).toString();
    } else if (path === "/payment" || path === "/payment.html") {
      fetchUrl = new URL("/payment.html", url.origin).toString();
    } else if (path.startsWith("/payment/")) {
      campaignParam = path.replace("/payment/", "").split("/")[0].trim();
      const targetUrl = new URL("/payment.html", url.origin);
      if (campaignParam) targetUrl.searchParams.set("camp", campaignParam);
      // Preserve any existing query parameters
      url.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
      fetchUrl = targetUrl.toString();
    } else if (path === "/payment-admin" || path === "/payment-admin.html") {
      fetchUrl = new URL("/payment-admin.html", url.origin).toString();
    } else if (path.startsWith("/payment-admin/")) {
      campaignParam = path.replace("/payment-admin/", "").split("/")[0].trim();
      const targetUrl = new URL("/payment-admin.html", url.origin);
      if (campaignParam) targetUrl.searchParams.set("camp", campaignParam);
      url.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
      fetchUrl = targetUrl.toString();
    } else if (path === "/admin") {
      fetchUrl = new URL("/admin.html", url.origin).toString();
    } else if (path === "/index-admin") {
      fetchUrl = new URL("/index-admin.html", url.origin).toString();
    } else if (path === "/storage" || path === "/storage.html") {
      fetchUrl = new URL("/storage.html", url.origin).toString();
    } else if (path === "/storage-admin" || path === "/storage-admin.html") {
      fetchUrl = new URL("/storage-admin.html", url.origin).toString();
    } else if (path === "/upload" || path === "/upload.html") {
      fetchUrl = new URL("/upload.html", url.origin).toString();
    } else if (path === "/upload-admin" || path === "/upload-admin.html") {
      fetchUrl = new URL("/upload-admin.html", url.origin).toString();
    } else if (path === "/settings" || path === "/settings.html") {
      fetchUrl = new URL("/settings.html", url.origin).toString();
    } else if (path === "/settings-admin" || path === "/settings-admin.html") {
      fetchUrl = new URL("/settings-admin.html", url.origin).toString();
    } else if (path === "/shortlink" || path === "/shortlink.html") {
      fetchUrl = new URL("/shortlink.html", url.origin).toString();
    } else if (path === "/shortlink-admin" || path === "/shortlink-admin.html") {
      fetchUrl = new URL("/shortlink-admin.html", url.origin).toString();
    } else if (path === "/notification-admin" || path === "/notification-admin.html") {
      fetchUrl = new URL("/notification-admin.html", url.origin).toString();
    } else if (path === "/plans-admin" || path === "/plans-admin.html") {
      fetchUrl = new URL("/Plans-admin.html", url.origin).toString();
    } else if (path.startsWith("/s/")) {
      const shortCode = path.replace("/s/", "").split("/")[0].trim();
      const targetUrl = new URL("/shortlink.html", url.origin);
      if (shortCode) targetUrl.searchParams.set("go", shortCode);
      fetchUrl = targetUrl.toString();
    } else if (path.startsWith("/share/")) {
      const shareCode = path.replace("/share/", "").split("/")[0].trim();
      const targetUrl = new URL("/storage.html", url.origin);
      if (shareCode) targetUrl.searchParams.set("share", shareCode);
      fetchUrl = targetUrl.toString();
    } else if (path === "/download" || path === "/download.html" || path === "/install" || path === "/app") {
      fetchUrl = new URL("/download.html", url.origin).toString();
    } else if (path === "/download/apk" || path === "/kku-comed23.apk" || path === "/app.apk") {
      // 🚀 High-Speed Direct APK CDN Download
      return Response.redirect("https://files.catbox.moe/zxcoev.apk", 302);
    } else if (path === "/fastshare" || path === "/fastshare.html") {
      fetchUrl = new URL("/fastshare.html", url.origin).toString();
    } else if (path === "/maintenance") {
      fetchUrl = new URL("/maintenance.html", url.origin).toString();
    } else if (path === "/favicon.ico") {
      fetchUrl = new URL("/favicon.ico", url.origin).toString();
    } else if (path === "/manifest.json") {
      fetchUrl = new URL("/manifest.json", url.origin).toString();
    } else if (path === "/sw.js") {
      fetchUrl = new URL("/sw.js", url.origin).toString();
    } else if (path === "/onesignalsdkworker.js") {
      fetchUrl = new URL("/OneSignalSDKWorker.js", url.origin).toString();
    } else if (path === "/echo" || path === "/api/echo") {
      return withSecurityHeaders(new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }));
    } else if (path === "/api/calendar.ics" || path === "/calendar.ics") {
      // 🌟 LIVE ICALENDAR FEED SUBSCRIPTION (สำหรับ Subscribe เข้า Google Calendar, Apple Calendar, Outlook)
      try {
        const SUPABASE_URL = "https://womovxeyfuzpogghikfu.supabase.co";
        const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbW92eGV5ZnV6cG9nZ2hpa2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTU2MDQsImV4cCI6MjA2NTM5MTYwNH0.kF0l7_7Bq8F44i-zL7GqE4N631h40wW_v_6pI1J8y-M";
        
        const scope = url.searchParams.get("scope") || "all";
        const userEmail = (url.searchParams.get("user") || "").toLowerCase().trim();

        let queryUrl = `${SUPABASE_URL}/rest/v1/plans?select=*&order=start_date.asc&or=(is_deleted.is.null,is_deleted.eq.false)`;
        if (scope === "department") {
          queryUrl += `&scope=eq.department`;
        }

        const supaRes = await fetch(queryUrl, {
          headers: {
            "apikey": SUPABASE_ANON,
            "Authorization": `Bearer ${SUPABASE_ANON}`
          }
        });

        let plans = supaRes.ok ? await supaRes.json() : [];

        // กรองตามสิทธิ์ของผู้ใช้ถ้ามีการระบุ user email (งานสาขา + งานที่สร้างเอง + งานที่ถูกแชร์)
        if (userEmail) {
          plans = plans.filter(p => {
            if (p.scope === "department" || p.is_official) return true;
            if (p.creator_email && p.creator_email.toLowerCase().trim() === userEmail) return true;
            if (Array.isArray(p.collaborators)) {
              return p.collaborators.some(c => (c.email || "").toLowerCase().trim() === userEmail);
            }
            return false;
          });
        } else if (scope !== "all") {
          plans = plans.filter(p => p.scope === "department");
        }
        const nowStr = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
        
        const cleanText = (str) => {
          if (!str) return "";
          return String(str).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
        };

        const vevents = plans.map(p => {
          if (!p.start_date) return "";
          const uid = (p.id || "comed-" + Math.random().toString(36).substring(2)) + "@comed23.kku.ac.th";
          const summary = cleanText(p.title || "กิจกรรม COMED");
          let desc = (p.description || "") + "\\n";
          if (p.location) desc += `สถานที่: ${p.location}\\n`;
          if (p.creator_name) desc += `ผู้จัดทำ: ${p.creator_name}\\n`;
          desc += `ดูบนระบบ: https://comed23.pages.dev/Plans.html?plan=${p.id || ""}`;
          
          const loc = cleanText(p.location || (p.meet_link || "คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น"));
          const start = new Date(p.start_date);
          let end = p.end_date ? new Date(p.end_date) : new Date(start.getTime() + (2 * 60 * 60 * 1000));
          if (end <= start) end = new Date(start.getTime() + (2 * 60 * 60 * 1000));

          const startUtc = start.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
          const endUtc = end.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

          return [
            "BEGIN:VEVENT",
            `UID:${uid}`,
            `DTSTAMP:${nowStr}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${cleanText(desc)}`,
            `LOCATION:${loc}`,
            `DTSTART:${startUtc}`,
            `DTEND:${endUtc}`,
            "STATUS:CONFIRMED",
            "BEGIN:VALARM",
            "ACTION:DISPLAY",
            "DESCRIPTION:แจ้งเตือนกิจกรรมล่วงหน้า 1 วัน",
            "TRIGGER:-P1D",
            "END:VALARM",
            "BEGIN:VALARM",
            "ACTION:DISPLAY",
            "DESCRIPTION:แจ้งเตือนกิจกรรมล่วงหน้า 1 ชั่วโมง",
            "TRIGGER:-PT1H",
            "END:VALARM",
            "END:VEVENT"
          ].join("\r\n");
        }).filter(Boolean);

        const icsContent = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//COMED KKU//Plans Calendar Hub//TH",
          "X-WR-CALNAME:COMED23 Plans Calendar",
          "CALSCALE:GREGORIAN",
          "METHOD:PUBLISH",
          vevents.join("\r\n"),
          "END:VCALENDAR"
        ].join("\r\n");

        return new Response(icsContent, {
          status: 200,
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'inline; filename="calendar.ics"',
            "Cache-Control": "public, max-age=300",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (calErr) {
        return new Response("Calendar feed error: " + calErr.message, { status: 500 });
      }
    } else if (path === "/plans" || path === "/plans.html") {
      fetchUrl = new URL("/Plans.html", url.origin).toString();
    } else if (path === "/plans-admin" || path === "/plans-admin.html") {
      fetchUrl = new URL("/Plans-admin.html", url.origin).toString();
    } else if (path === "/calendar" || path === "/calendar.html") {
      fetchUrl = new URL("/Calendar.html", url.origin).toString();
    } else if (path === "/404") {
      fetchUrl = new URL("/404.html", url.origin).toString();
    }

    // 2. Fetch requested static asset via Cloudflare ASSETS binding
    try {
      const response = await env.ASSETS.fetch(new Request(fetchUrl, request));
      if (response && response.status !== 404) {
        return withSecurityHeaders(response);
      }
    } catch(e) {}

    // 3. Fallback from GitHub for public pages
    const GITHUB_RAW = "https://raw.githubusercontent.com/phupa123/kku-comed23/main";
    let target = "";
    if (path === "/" || path === "/index" || path === "/index.html") target = "/index.html";
    else if (path === "/payment" || path === "/payment.html" || path.startsWith("/payment/")) target = "/payment.html";
    else if (path === "/admin" || path === "/admin.html") target = "/admin.html";
    else if (path === "/index-admin" || path === "/index-admin.html") target = "/index-admin.html";
    else if (path === "/payment-admin" || path === "/payment-admin.html" || path.startsWith("/payment-admin/")) target = "/payment-admin.html";
    else if (path === "/event" || path === "/event.html") target = "/event.html";
    else if (path === "/eventclass" || path === "/eventclass.html") target = "/eventclass.html";
    else if (path === "/event-admin" || path === "/event-admin.html") target = "/event-admin.html";
    else if (path === "/eventclass-admin" || path === "/eventclass-admin.html") target = "/eventclass-admin.html";
    else if (path === "/storage" || path === "/storage.html") target = "/storage.html";
    else if (path.startsWith("/share/")) {
      // For GitHub fallback, redirect to storage.html?share=code so the param is preserved
      const shareCode = path.replace("/share/", "").split("/")[0].trim();
      const redirectTarget = new URL("/storage.html", url.origin);
      if (shareCode) redirectTarget.searchParams.set("share", shareCode);
      return Response.redirect(redirectTarget.toString(), 302);
    }
    else if (path === "/storage-admin" || path === "/storage-admin.html") target = "/storage-admin.html";
    else if (path === "/upload" || path === "/upload.html") target = "/upload.html";
    else if (path === "/upload-admin" || path === "/upload-admin.html") target = "/upload-admin.html";
    else if (path === "/settings" || path === "/settings.html") target = "/settings.html";
    else if (path === "/settings-admin" || path === "/settings-admin.html") target = "/settings-admin.html";
    else if (path === "/fastshare" || path === "/fastshare.html") target = "/fastshare.html";
    else if (path === "/shortlink" || path === "/shortlink.html" || path.startsWith("/s/")) target = "/shortlink.html";
    else if (path === "/shortlink-admin" || path === "/shortlink-admin.html") target = "/shortlink-admin.html";
    else if (path === "/maintenance" || path === "/maintenance.html") target = "/maintenance.html";
    else if (path === "/404" || path === "/404.html") target = "/404.html";
    else if (path === "/default-icon" || path === "/default-icon.png") target = "/logo.png";
    else if (path === "/favicon.ico" || path.endsWith(".ico") || path.endsWith(".svg") || path.startsWith("/assets/") || path.startsWith("/config/") || path.endsWith(".png") || path.endsWith(".js") || path.endsWith(".css") || path.endsWith(".json")) {
      target = url.pathname;
    }

    if (target) {
      try {
        const ghRes = await fetch(GITHUB_RAW + target);
        if (ghRes.ok) {
          return withSecurityHeaders(new Response(ghRes.body, {
            status: 200,
            headers: {
              "Content-Type": getContentType(target),
              "Cache-Control": "public, max-age=60"
            }
          }));
        }
      } catch (err) {}
    }

    // 4. 🌟 AUTOMATIC 404 RESCUE: If not found, serve 404.html seamlessly
    try {
      const notFoundRes = await fetch(GITHUB_RAW + "/404.html");
      if (notFoundRes.ok) {
        return withSecurityHeaders(new Response(notFoundRes.body, {
          status: 404,
          headers: {
            "Content-Type": "text/html; charset=utf-8"
          }
        }));
      }
    } catch(err404) {}

    return withSecurityHeaders(new Response("<h1>404 Not Found</h1>", {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    }));
  }
};

function withSecurityHeaders(response) {
  if (!response) return response;
  const newHeaders = new Headers(response.headers);
  newHeaders.set("X-Content-Type-Options", "nosniff");
  newHeaders.set("X-Frame-Options", "SAMEORIGIN");
  newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

function getContentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".ico")) return "image/x-icon";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".json")) return "application/json";
  return "text/plain; charset=utf-8";
}
