// Cloud Functions cho quan-ly-admin — THAY THẾ netlify/functions/*.js.
//
// CÀI ĐẶT (1 lần):
//   1) npm install -g firebase-tools   (nếu chưa có)
//   2) cd functions && npm install
//   3) firebase functions:secrets:set ADMIN_KEY
//        -> dán đúng giá trị đang có trong js/quan-ly-admin.js (const ADMIN_KEY = "...")
//   4) (tuỳ chọn, nếu vẫn dùng đồng bộ Google Sheet cho kết quả/quiz):
//      firebase functions:secrets:set GOOGLE_SHEET_WEBHOOK_URL
//   5) firebase deploy --only functions
//      -> deploy xong, Firebase in ra URL dạng:
//         https://us-central1-<project-id>.cloudfunctions.net/adminLoad  (v.v.)
//         Dán các URL này vào FUNCTIONS_BASE trong js/quan-ly-admin.js (xem file đó).
//
// GHI CHÚ QUAN TRỌNG:
//   - Cần bật gói Blaze (pay-as-you-go) cho project Firebase — Cloud Functions gọi
//     API bên ngoài (GitHub) cần outbound network, gói Spark miễn phí không hỗ trợ.
//   - Không cần FIREBASE_SERVICE_ACCOUNT nữa (Cloud Function tự có quyền truy cập
//     Firestore của chính project nó chạy trong).
//   - Cấu trúc collection "hosts" trong Firestore ĐÃ ĐỔI (xem lib/github.js +
//     deploy-site.js bên dưới): mỗi host giờ cần { label, token (GitHub PAT),
//     owner, repo, branch } thay vì { label, token (Netlify PAT), siteId }.

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const crypto = require("crypto");

const { getDb, checkAdminKey, handlePreflightAndMethod, jsonResponse } = require("./lib/common");
const github = require("./lib/github");

const ADMIN_KEY = defineSecret("ADMIN_KEY");
const GOOGLE_SHEET_WEBHOOK_URL = defineSecret("GOOGLE_SHEET_WEBHOOK_URL");

const REGION = "asia-southeast1"; // gần VN nhất trong các region Cloud Functions v2 hỗ trợ; đổi nếu cần.

// ---------------------------------------------------------------------------
// admin-load
// ---------------------------------------------------------------------------
const ALLOWED_READ_COLLECTIONS = ["quizzes", "hosts", "emails", "results", "questionImages"];

exports.adminLoad = onRequest({ region: REGION, secrets: [ADMIN_KEY] }, async (req, res) => {
  const body = handlePreflightAndMethod(req, res, "POST");
  if (body === null) return;

  const { adminKey, collection, docId } = body;
  if (!checkAdminKey(adminKey, ADMIN_KEY.value())) {
    return jsonResponse(res, 401, { status: "error", message: "Sai admin key." });
  }
  if (!ALLOWED_READ_COLLECTIONS.includes(collection)) {
    return jsonResponse(res, 400, {
      status: "error",
      message: `Collection "${collection}" không được phép đọc qua đây. Chỉ cho phép: ${ALLOWED_READ_COLLECTIONS.join(", ")}.`,
    });
  }

  try {
    const db = getDb();
    const colRef = db.collection(collection);
    if (docId) {
      const snap = await colRef.doc(docId).get();
      if (!snap.exists) return jsonResponse(res, 404, { status: "error", message: "Không tìm thấy document." });
      return jsonResponse(res, 200, { status: "ok", data: { id: snap.id, ...snap.data() } });
    }
    const snapshot = await colRef.get();
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return jsonResponse(res, 200, { status: "ok", data });
  } catch (err) {
    console.error("adminLoad error:", err);
    return jsonResponse(res, 500, { status: "error", message: "Lỗi máy chủ khi đọc Firestore: " + err.message });
  }
});

// ---------------------------------------------------------------------------
// admin-save
// ---------------------------------------------------------------------------
const ALLOWED_WRITE_COLLECTIONS = ["quizzes", "hosts", "emails", "questionImages"];

async function syncToSheet(payload, webhookUrl) {
  if (!webhookUrl) return { ok: false, reason: "missing_url" };
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

exports.adminSave = onRequest({ region: REGION, secrets: [ADMIN_KEY, GOOGLE_SHEET_WEBHOOK_URL] }, async (req, res) => {
  const body = handlePreflightAndMethod(req, res, "POST");
  if (body === null) return;

  const { adminKey, collection, docId, data } = body;
  if (!checkAdminKey(adminKey, ADMIN_KEY.value())) {
    return jsonResponse(res, 401, { status: "error", message: "Sai admin key." });
  }
  if (!ALLOWED_WRITE_COLLECTIONS.includes(collection)) {
    return jsonResponse(res, 400, {
      status: "error",
      message: `Collection "${collection}" không được phép ghi. Chỉ cho phép: ${ALLOWED_WRITE_COLLECTIONS.join(", ")}.`,
    });
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return jsonResponse(res, 400, { status: "error", message: 'Thiếu hoặc sai định dạng "data" (phải là object).' });
  }

  try {
    const db = getDb();
    const colRef = db.collection(collection);
    let finalId = docId;
    let timestampField;
    let timestampValue;
    if (finalId) {
      timestampField = "capNhatLuc";
      timestampValue = new Date().toISOString();
      await colRef.doc(finalId).set({ ...data, [timestampField]: timestampValue }, { merge: true });
    } else {
      timestampField = "taoLuc";
      timestampValue = new Date().toISOString();
      const docRef = await colRef.add({ ...data, [timestampField]: timestampValue });
      finalId = docRef.id;
    }

    const sheetResult = await syncToSheet(
      { sheet: collection, id: finalId, ...data, [timestampField]: timestampValue },
      GOOGLE_SHEET_WEBHOOK_URL.value()
    );

    const response = { status: "ok", id: finalId };
    if (!sheetResult.ok) {
      response.sheetWarning = "Đã lưu Firestore nhưng đồng bộ Google Sheet thất bại: " + sheetResult.reason;
    }
    return jsonResponse(res, 200, response);
  } catch (err) {
    console.error("adminSave error:", err);
    return jsonResponse(res, 500, { status: "error", message: "Lỗi máy chủ khi ghi Firestore: " + err.message });
  }
});

// ---------------------------------------------------------------------------
// submit-result (public, không cần adminKey)
// ---------------------------------------------------------------------------
exports.submitResult = onRequest({ region: REGION, secrets: [GOOGLE_SHEET_WEBHOOK_URL] }, async (req, res) => {
  const body = handlePreflightAndMethod(req, res, "POST");
  if (body === null) return;

  const { quizId } = body;
  if (!quizId || typeof quizId !== "string") {
    return jsonResponse(res, 400, { status: "error", message: 'Thiếu "quizId".' });
  }

  try {
    const db = getDb();
    const quizSnap = await db.collection("quizzes").doc(quizId).get();
    if (!quizSnap.exists) {
      return jsonResponse(res, 404, { status: "error", message: "Mã đề không tồn tại, không thể ghi kết quả." });
    }

    const { adminKey, ...resultData } = body;
    const studentId = String(resultData.id ?? "").trim();
    if (!studentId) {
      return jsonResponse(res, 400, { status: "error", message: "Thiếu ID học sinh, không thể ghi kết quả." });
    }
    resultData.id = studentId;
    const nopLuc = new Date().toISOString();

    const sheetResult = await syncToSheet({ sheet: "results", ...resultData, nopLuc }, GOOGLE_SHEET_WEBHOOK_URL.value());
    if (!sheetResult.ok) {
      return jsonResponse(res, 502, { status: "error", message: "Không ghi được kết quả vào Google Sheet: " + sheetResult.reason });
    }
    return jsonResponse(res, 200, { status: "ok" });
  } catch (err) {
    console.error("submitResult error:", err);
    return jsonResponse(res, 500, { status: "error", message: "Lỗi máy chủ khi ghi kết quả: " + err.message });
  }
});

// ---------------------------------------------------------------------------
// deploy-site — đẩy đề thi/ảnh lên GitHub Pages (thay vì Netlify)
// ---------------------------------------------------------------------------
const MAX_HTML_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function sanitizeFileName(name) {
  const fallback = "index.html";
  if (!name || typeof name !== "string") return fallback;
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned || fallback;
}
function sanitizeImagePath(path) {
  const cleaned = String(path || "").trim().replace(/^\/+/, "");
  const safe = cleaned.replace(/[^a-zA-Z0-9._\/-]/g, "_");
  return safe || "image/unnamed";
}
function rawImagePathForDocId(path) {
  return String(path || "").trim().replace(/^\/+/, "");
}
function questionImagePathToDocId(path) {
  return rawImagePathForDocId(path).replace(/[^a-zA-Z0-9._-]/g, "__");
}

exports.deploySite = onRequest({ region: REGION, secrets: [ADMIN_KEY], timeoutSeconds: 120 }, async (req, res) => {
  const body = handlePreflightAndMethod(req, res, "POST");
  if (body === null) return;

  try {
    const { adminKey, hostId, htmlContent, fileName, images, deleteImagePaths } = body;
    if (!checkAdminKey(adminKey, ADMIN_KEY.value())) {
      return jsonResponse(res, 401, { status: "error", message: "Sai ADMIN_KEY." });
    }
    if (!hostId || typeof hostId !== "string") {
      return jsonResponse(res, 400, { status: "error", message: "Thiếu hostId (chưa chọn host lưu file bài)." });
    }

    const hasHtml = typeof htmlContent === "string" && htmlContent.length > 0;
    const imgList = Array.isArray(images)
      ? images.filter((im) => im && typeof im.path === "string" && typeof im.base64 === "string" && im.base64.length)
      : [];
    const delList = Array.isArray(deleteImagePaths)
      ? deleteImagePaths
          .filter((p) => typeof p === "string" && p.trim())
          .map((p) => ({ raw: p, ghPath: sanitizeImagePath(p), docId: questionImagePathToDocId(p) }))
      : [];

    if (!hasHtml && !imgList.length && !delList.length) {
      return jsonResponse(res, 400, { status: "error", message: "Thiếu htmlContent, images, hoặc deleteImagePaths cần xử lý." });
    }
    if (hasHtml && Buffer.byteLength(htmlContent, "utf8") > MAX_HTML_BYTES) {
      return jsonResponse(res, 400, { status: "error", message: "Nội dung file HTML vượt quá giới hạn 5MB." });
    }
    for (const im of imgList) {
      const approxBytes = Math.ceil((im.base64.length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        return jsonResponse(res, 400, { status: "error", message: `Ảnh "${im.path}" vượt quá giới hạn 8MB.` });
      }
    }

    const db = getDb();

    // HTML export vẫn đẩy theo đúng host được chọn (hostId) như trước — không đổi.
    let hostData = null;
    if (hasHtml) {
      try {
        const snap = await db.collection("hosts").doc(hostId).get();
        if (!snap.exists) return jsonResponse(res, 404, { status: "error", message: `Không tìm thấy host "${hostId}" trong Firestore.` });
        hostData = snap.data();
      } catch (err) {
        return jsonResponse(res, 500, { status: "error", message: "Lỗi đọc Firestore: " + err.message });
      }
      if (!hostData || !hostData.token || !hostData.owner || !hostData.repo) {
        return jsonResponse(res, 500, {
          status: "error",
          message: `Host "${hostId}" thiếu token/owner/repo trong Firestore (cấu trúc host đã đổi sang GitHub — cần { token: GitHub PAT, owner, repo, branch }).`,
        });
      }
    }

    // Ảnh (nếu có) LUÔN đẩy vào ĐÚNG 1 repo "kho ảnh dùng chung" duy nhất — đánh dấu
    // bằng field isImagesHost === true trên 1 document trong collection "hosts" —
    // rồi phục vụ qua jsDelivr CDN. Thay cho cách cũ là đẩy lặp lại ảnh lên TỪNG host
    // (mỗi ảnh trước đây tốn N lần PUT + N lần dung lượng repo, giờ chỉ 1 lần).
    let imagesHostData = null;
    let imagesHostId = null;
    if (imgList.length || delList.length) {
      try {
        const snap = await db.collection("hosts").where("isImagesHost", "==", true).limit(1).get();
        if (snap.empty) {
          return jsonResponse(res, 500, {
            status: "error",
            message: 'Chưa cấu hình "kho ảnh dùng chung": cần đánh dấu 1 host trong Firestore (collection "hosts") với field isImagesHost = true.',
          });
        }
        imagesHostId = snap.docs[0].id;
        imagesHostData = snap.docs[0].data();
      } catch (err) {
        return jsonResponse(res, 500, { status: "error", message: "Lỗi đọc Firestore (kho ảnh dùng chung): " + err.message });
      }
      if (!imagesHostData || !imagesHostData.token || !imagesHostData.owner || !imagesHostData.repo) {
        return jsonResponse(res, 500, {
          status: "error",
          message: `Host ảnh dùng chung "${imagesHostId}" thiếu token/owner/repo trong Firestore.`,
        });
      }
    }

    const safeFileName = sanitizeFileName(fileName);
    const htmlPath = safeFileName;

    // Đẩy từng file lên GitHub (mỗi PUT chỉ ảnh hưởng đúng file đó — không cần gộp
    // "toàn bộ site" như Netlify snapshot deploy).
    let fileUrl = null;
    if (hasHtml) {
      const { token, owner, repo, branch: rawBranch, pagesUrl } = hostData;
      const branch = rawBranch || "main";
      const buf = Buffer.from(htmlContent, "utf8");
      await github.putFile(owner, repo, branch, htmlPath, buf.toString("base64"), token, `Cập nhật ${htmlPath} (quan-ly-admin)`);
      fileUrl = github.buildPagesUrl({ owner, repo, pagesUrl }, htmlPath);
    }
    if (imgList.length) {
      const { token, owner, repo, branch: rawBranch } = imagesHostData;
      const branch = rawBranch || "main";
      for (const im of imgList) {
        const path = sanitizeImagePath(im.path);
        await github.putFile(owner, repo, branch, path, im.base64, token, `Cập nhật ảnh ${path} (quan-ly-admin)`);
        if (!fileUrl) fileUrl = github.buildJsdelivrUrl({ owner, repo, branch }, path);
      }
    }

    // Xoá ảnh (nếu có yêu cầu) khỏi kho ảnh dùng chung, purge cache jsDelivr, rồi dọn
    // document Firestore "questionImages" tương ứng.
    const deletedPaths = [];
    const deleteErrors = [];
    if (delList.length) {
      const { token, owner, repo, branch: rawBranch } = imagesHostData;
      const branch = rawBranch || "main";
      for (const del of delList) {
        try {
          await github.deleteFile(owner, repo, branch, del.ghPath, token, `Xoá ${del.ghPath} (quan-ly-admin)`);
          try {
            await github.purgeJsdelivr({ owner, repo, branch }, del.ghPath);
          } catch (purgeErr) {
            console.warn(`Purge jsDelivr thất bại cho "${del.ghPath}":`, purgeErr.message);
          }
          await db.collection("questionImages").doc(del.docId).delete();
          deletedPaths.push(del.raw);
        } catch (err) {
          deleteErrors.push({ path: del.raw, message: err.message });
        }
      }
    }

    return jsonResponse(res, 200, {
      status: "ok",
      url: fileUrl || (hostData ? github.buildPagesUrl({ owner: hostData.owner, repo: hostData.repo, pagesUrl: hostData.pagesUrl }, "") : ""),
      deletedPaths,
      deleteErrors,
    });
  } catch (err) {
    console.error("deploySite: lỗi không lường trước:", err);
    return jsonResponse(res, 500, { status: "error", message: "Lỗi khi đẩy lên GitHub: " + (err && err.message ? err.message : String(err)) });
  }
});

// ---------------------------------------------------------------------------
// host-usage — GitHub KHÔNG có API "bandwidth đã dùng" như Netlify. Số liệu gần
// đúng nhất lấy được: dung lượng repo (KB) + rate limit API còn lại của token.
// Đây CHỈ LÀ tín hiệu tham khảo, KHÔNG phản ánh lượng truy cập GitHub Pages thật.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 10 * 60 * 1000;

exports.hostUsage = onRequest({ region: REGION, secrets: [ADMIN_KEY] }, async (req, res) => {
  const body = handlePreflightAndMethod(req, res, "POST");
  if (body === null) return;

  const { adminKey, hostIds, force } = body;
  if (!checkAdminKey(adminKey, ADMIN_KEY.value())) {
    return jsonResponse(res, 401, { status: "error", message: "Sai admin key." });
  }
  if (!Array.isArray(hostIds) || !hostIds.length) {
    return jsonResponse(res, 400, { status: "error", message: 'Thiếu "hostIds" (phải là mảng khác rỗng).' });
  }

  const db = getDb();
  const data = {};

  await Promise.all(
    hostIds.map(async (hostId) => {
      const cacheRef = db.collection("hostUsage").doc(hostId);
      try {
        if (!force) {
          const cacheSnap = await cacheRef.get();
          if (cacheSnap.exists) {
            const cached = cacheSnap.data();
            const age = Date.now() - (Number(cached.fetchedAt) || 0);
            if (age < CACHE_TTL_MS) {
              data[hostId] = { repoSizeKb: cached.repoSizeKb, rateLimit: cached.rateLimit };
              return;
            }
          }
        }
        const hostSnap = await db.collection("hosts").doc(hostId).get();
        if (!hostSnap.exists) throw new Error("Không tìm thấy host trong Firestore.");
        const { token, owner, repo } = hostSnap.data() || {};
        if (!token || !owner || !repo) throw new Error("Host thiếu token/owner/repo trong Firestore.");

        const [repoInfo, rate] = await Promise.all([github.getRepoInfo(owner, repo, token), github.getRateLimit(token)]);
        const usage = {
          repoSizeKb: repoInfo.size || 0,
          rateLimit: rate && rate.rate ? { used: rate.rate.limit - rate.rate.remaining, included: rate.rate.limit } : null,
        };
        await cacheRef.set({ ...usage, fetchedAt: Date.now() }, { merge: false });
        data[hostId] = usage;
      } catch (err) {
        console.error(`hostUsage: lỗi lấy usage cho host "${hostId}":`, err.message);
        data[hostId] = { error: err.message || String(err) };
      }
    })
  );

  return jsonResponse(res, 200, { status: "ok", data });
});
