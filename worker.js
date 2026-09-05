/**
 * CLOUDFLARE WORKER ROUTER & STATIC ASSET ENGINE
 * สาขาวิชาคอมพิวเตอร์ศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยขอนแก่น (COMED KKU 69)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();

    // 0. Dedicated Cloud Storage Upload Proxy with complete CORS support (Streams directly to upstream)
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
    } else if (path === "/maintenance") {
      fetchUrl = new URL("/maintenance.html", url.origin).toString();
    } else if (path === "/404") {
      fetchUrl = new URL("/404.html", url.origin).toString();
    }

    // 2. Fetch requested static asset via Cloudflare ASSETS binding
    try {
      const response = await env.ASSETS.fetch(new Request(fetchUrl, request));
      if (response && response.status !== 404) {
        return response;
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
    else if (path === "/maintenance" || path === "/maintenance.html") target = "/maintenance.html";
    else if (path === "/404" || path === "/404.html") target = "/404.html";
    else if (path.startsWith("/assets/") || path.startsWith("/config/") || path.endsWith(".png") || path.endsWith(".js") || path.endsWith(".css")) {
      target = url.pathname;
    }

    if (target) {
      try {
        const ghRes = await fetch(GITHUB_RAW + target);
        if (ghRes.ok) {
          return new Response(ghRes.body, {
            status: 200,
            headers: {
              "Content-Type": getContentType(target),
              "Cache-Control": "public, max-age=60"
            }
          });
        }
      } catch (err) {}
    }

    // 4. 🌟 AUTOMATIC 404 RESCUE: If not found, serve 404.html seamlessly
    try {
      const notFoundRes = await fetch(GITHUB_RAW + "/404.html");
      if (notFoundRes.ok) {
        return new Response(notFoundRes.body, {
          status: 404,
          headers: {
            "Content-Type": "text/html; charset=utf-8"
          }
        });
      }
    } catch(err404) {}

    return new Response("<h1>404 Not Found</h1>", {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};

function getContentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".json")) return "application/json";
  return "text/plain; charset=utf-8";
}
