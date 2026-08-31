/**
 * Apps Script Web App — THAY THẾ functions/index.js (Cloud Functions).
 * Lý do: Cloud Functions thế hệ 2 (onRequest từ firebase-functions/v2/https) bắt buộc gói
 * Firebase Blaze để deploy, dù có gọi API ngoài (GitHub) hay không. Bản này chạy 100% trên
 * Apps Script (free tuyệt đối, không cần thẻ thanh toán), gọi Firestore qua REST API bằng
 * service-account JWT tự ký, và gọi GitHub Contents API qua UrlFetchApp.
 *
 * 5 action tương ứng 5 Cloud Function cũ: admin-load, admin-save, submit-result,
 * deploy-site, host-usage — gửi tất cả qua CÙNG 1 URL, phân biệt bằng field "action"
 * trong JSON body (khác Cloud Functions: mỗi function có URL riêng).
 *
 * ------------------------------------------------------------------------------------
 * CÀI ĐẶT (1 lần):
 *  1) Firebase Console → Project settings (⚙️) → Service accounts → tab "Firebase Admin
 *     SDK" → bấm "Generate new private key" → tải về 1 file JSON.
 *  2) Vào https://script.google.com → New project → xoá code mẫu, dán TOÀN BỘ nội dung
 *     file này vào (đặt tên file vẫn là Code.gs).
 *  3) Bên trái, bấm biểu tượng bánh răng "Project Settings" → kéo xuống "Script
 *     Properties" → "Add script property", thêm lần lượt (lấy giá trị từ file JSON ở
 *     bước 1, đúng tên trường trong JSON):
 *       FIREBASE_PROJECT_ID       = project_id trong JSON (vd: ic3-admin)
 *       FIREBASE_CLIENT_EMAIL     = client_email trong JSON
 *       FIREBASE_PRIVATE_KEY      = private_key trong JSON — copy NGUYÊN VĂN, kể cả các
 *                                    ký tự "\n" và dòng "-----BEGIN PRIVATE KEY-----"
 *       ADMIN_KEY                 = teamgvth (PHẢI khớp const ADMIN_KEY trong
 *                                    js/quan-ly-admin.js — đổi 1 bên thì phải đổi cả 2)
 *       GOOGLE_SHEET_WEBHOOK_URL  = (tuỳ chọn) URL Apps Script Web App bạn đang dùng để
 *                                    đồng bộ kết quả/đề sang Google Sheet. Bỏ trống thì hệ
 *                                    thống vẫn lưu Firestore bình thường, chỉ mất phần
 *                                    đồng bộ Sheet (sẽ trả về "sheetWarning" khi lưu).
 *  4) Menu "Deploy" (góc trên bên phải) → "New deployment" → bấm icon bánh răng cạnh
 *     "Select type" → chọn "Web app" → Description tuỳ ý → Execute as: "Me" → Who has
 *     access: "Anyone" → Deploy. Lần đầu Google sẽ hỏi cấp quyền — bấm "Authorize access",
 *     chọn tài khoản, bấm "Advanced" → "Go to (tên project) (unsafe)" (an toàn vì đây là
 *     code do chính bạn dán vào, không phải app lạ) → Allow.
 *  5) Copy URL dạng ".../exec" hiện ra → dán vào FUNCTIONS_ORIGIN trong
 *     js/quan-ly-admin.js.
 *  6) Mỗi lần SỬA code trong file này, phải bấm "New deployment" (hoặc Deploy → Manage
 *     deployments → bấm icon bút chì → chọn version "New version" → Deploy) thì thay đổi
 *     mới có hiệu lực trên URL cũ — sửa code không tự cập nhật deployment đang chạy.
 * ------------------------------------------------------------------------------------
 */

var PROPS = PropertiesService.getScriptProperties();

function cfg_(key) {
  var v = PROPS.getProperty(key);
  if (!v) {
    throw new Error(
      'Thiếu Script Property "' + key + '" — vào Project Settings > Script properties để thêm.',
    );
  }
  return v;
}

// ---------------------------------------------------------------------------
// doPost / doGet — điểm vào duy nhất của Web App
// ---------------------------------------------------------------------------
var PUBLIC_ACTIONS = ["submit-result"]; // không cần adminKey (học sinh nộp bài)

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ status: "error", message: "Body gửi lên không phải JSON hợp lệ." });
  }

  var action = body.action;
  if (PUBLIC_ACTIONS.indexOf(action) === -1) {
    var adminKey;
    try {
      adminKey = cfg_("ADMIN_KEY");
    } catch (err) {
      return jsonOut_({ status: "error", message: err.message });
    }
    if (body.adminKey !== adminKey) {
      return jsonOut_({ status: "error", message: "Sai admin key." });
    }
  }

  var result;
  try {
    switch (action) {
      case "admin-load":
        result = actionAdminLoad_(body);
        break;
      case "admin-save":
        result = actionAdminSave_(body);
        break;
      case "submit-result":
        result = actionSubmitResult_(body);
        break;
      case "deploy-site":
        result = actionDeploySite_(body);
        break;
      case "host-usage":
        result = actionHostUsage_(body);
        break;
      default:
        result = { status: "error", message: 'Action không hợp lệ: "' + action + '".' };
    }
  } catch (err) {
    result = { status: "error", message: "Lỗi máy chủ: " + (err && err.message ? err.message : String(err)) };
  }
  return jsonOut_(result);
}

function doGet(e) {
  return jsonOut_({ status: "ok", message: "IC3 Apps Script backend đang chạy. Dùng POST với field \"action\"." });
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// OAuth: tự ký JWT bằng service account, đổi lấy access token cho Firestore REST.
// Cache 55 phút (token Google cấp sống 60 phút) để đỡ phải ký lại mỗi lần gọi.
// ---------------------------------------------------------------------------
function getAccessToken_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("fb_access_token");
  if (cached) return cached;

  var clientEmail = cfg_("FIREBASE_CLIENT_EMAIL");
  var privateKey = cfg_("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
  var now = Math.floor(Date.now() / 1000);
  var header = { alg: "RS256", typ: "JWT" };
  var claimSet = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  function b64url(obj) {
    return Utilities.base64EncodeWebSafe(JSON.stringify(obj)).replace(/=+$/, "");
  }
  var toSign = b64url(header) + "." + b64url(claimSet);
  var signatureBytes = Utilities.computeRsaSha256Signature(toSign, privateKey);
  var signature = Utilities.base64EncodeWebSafe(signatureBytes).replace(/=+$/, "");
  var jwt = toSign + "." + signature;

  var res = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post",
    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    },
    muteHttpExceptions: true,
  });
  var json = JSON.parse(res.getContentText());
  if (!json.access_token) {
    throw new Error("Không lấy được access token Firebase (kiểm tra lại FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY): " + res.getContentText());
  }
  cache.put("fb_access_token", json.access_token, Math.max(60, (json.expires_in || 3600) - 300));
  return json.access_token;
}

// ---------------------------------------------------------------------------
// Firestore REST — encode/decode giữa JS object thường và định dạng "fields" của Firestore.
// ---------------------------------------------------------------------------
function fsEncodeValue_(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return v % 1 === 0 ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(fsEncodeValue_) } };
  if (typeof v === "object") {
    var fields = {};
    Object.keys(v).forEach(function (k) {
      fields[k] = fsEncodeValue_(v[k]);
    });
    return { mapValue: { fields: fields } };
  }
  return { stringValue: String(v) };
}
function fsEncodeFields_(obj) {
  var fields = {};
  Object.keys(obj || {}).forEach(function (k) {
    fields[k] = fsEncodeValue_(obj[k]);
  });
  return fields;
}
function fsDecodeValue_(v) {
  if (!v) return null;
  if ("nullValue" in v) return null;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("stringValue" in v) return v.stringValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fsDecodeValue_);
  if ("mapValue" in v) return fsDecodeFields_(v.mapValue.fields || {});
  return null;
}
function fsDecodeFields_(fields) {
  var out = {};
  Object.keys(fields || {}).forEach(function (k) {
    out[k] = fsDecodeValue_(fields[k]);
  });
  return out;
}
function fsBaseUrl_() {
  return "https://firestore.googleapis.com/v1/projects/" + cfg_("FIREBASE_PROJECT_ID") + "/databases/(default)/documents";
}
function fsFetch_(path, method, bodyObj) {
  var token = getAccessToken_();
  var options = {
    method: method || "get",
    headers: { Authorization: "Bearer " + token },
    muteHttpExceptions: true,
    contentType: "application/json",
  };
  if (bodyObj) options.payload = JSON.stringify(bodyObj);
  var res = UrlFetchApp.fetch(fsBaseUrl_() + path, options);
  var code = res.getResponseCode();
  var text = res.getContentText();
  var json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    /* ignore, giữ json = null */
  }
  return { code: code, json: json, text: text };
}

// ---------------------------------------------------------------------------
// admin-load — đọc 1 document hoặc cả collection
// ---------------------------------------------------------------------------
var ALLOWED_READ_COLLECTIONS = ["quizzes", "hosts", "emails", "results", "questionImages"];

function actionAdminLoad_(body) {
  var collection = body.collection;
  var docId = body.docId;
  if (ALLOWED_READ_COLLECTIONS.indexOf(collection) === -1) {
    return { status: "error", message: 'Collection "' + collection + '" không được phép đọc qua đây. Chỉ cho phép: ' + ALLOWED_READ_COLLECTIONS.join(", ") + "." };
  }
  if (docId) {
    var r = fsFetch_("/" + collection + "/" + encodeURIComponent(docId), "get");
    if (r.code === 404) return { status: "error", message: "Không tìm thấy document." };
    if (r.code !== 200) return { status: "error", message: "Lỗi máy chủ khi đọc Firestore: " + r.text };
    var single = { id: docId };
    Object.assign(single, fsDecodeFields_(r.json.fields));
    return { status: "ok", data: single };
  }
  var all = [];
  var pageToken = null;
  do {
    var qs = "?pageSize=300" + (pageToken ? "&pageToken=" + encodeURIComponent(pageToken) : "");
    var rr = fsFetch_("/" + collection + qs, "get");
    if (rr.code !== 200) return { status: "error", message: "Lỗi máy chủ khi đọc Firestore: " + rr.text };
    (rr.json.documents || []).forEach(function (doc) {
      var id = doc.name.split("/").pop();
      var item = { id: id };
      Object.assign(item, fsDecodeFields_(doc.fields));
      all.push(item);
    });
    pageToken = rr.json.nextPageToken || null;
  } while (pageToken);
  return { status: "ok", data: all };
}

// ---------------------------------------------------------------------------
// admin-save — tạo mới hoặc merge-update 1 document
// ---------------------------------------------------------------------------
var ALLOWED_WRITE_COLLECTIONS = ["quizzes", "hosts", "emails", "questionImages"];

function syncToSheet_(payload) {
  var webhookUrl;
  try {
    webhookUrl = cfg_("GOOGLE_SHEET_WEBHOOK_URL");
  } catch (e) {
    return { ok: false, reason: "missing_url" };
  }
  try {
    var res = UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() >= 300) return { ok: false, reason: "http_" + res.getResponseCode() };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

function actionAdminSave_(body) {
  var collection = body.collection;
  var docId = body.docId;
  var data = body.data;
  if (ALLOWED_WRITE_COLLECTIONS.indexOf(collection) === -1) {
    return { status: "error", message: 'Collection "' + collection + '" không được phép ghi. Chỉ cho phép: ' + ALLOWED_WRITE_COLLECTIONS.join(", ") + "." };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { status: "error", message: 'Thiếu hoặc sai định dạng "data" (phải là object).' };
  }

  var finalId = docId;
  var timestampField, timestampValue;
  var nowIso = new Date().toISOString();

  if (finalId) {
    timestampField = "capNhatLuc";
    timestampValue = nowIso;
    var merged = {};
    Object.assign(merged, data);
    merged[timestampField] = timestampValue;
    var fieldPaths = Object.keys(merged)
      .map(function (k) {
        return "updateMask.fieldPaths=" + encodeURIComponent(k);
      })
      .join("&");
    var r = fsFetch_("/" + collection + "/" + encodeURIComponent(finalId) + "?" + fieldPaths, "patch", { fields: fsEncodeFields_(merged) });
    if (r.code !== 200) return { status: "error", message: "Lỗi máy chủ khi ghi Firestore: " + r.text };
  } else {
    timestampField = "taoLuc";
    timestampValue = nowIso;
    var toWrite = {};
    Object.assign(toWrite, data);
    toWrite[timestampField] = timestampValue;
    var rc = fsFetch_("/" + collection, "post", { fields: fsEncodeFields_(toWrite) });
    if (rc.code !== 200) return { status: "error", message: "Lỗi máy chủ khi ghi Firestore: " + rc.text };
    finalId = rc.json.name.split("/").pop();
  }

  var sheetPayload = { sheet: collection, id: finalId };
  Object.assign(sheetPayload, data);
  sheetPayload[timestampField] = timestampValue;
  var sheetResult = syncToSheet_(sheetPayload);

  var response = { status: "ok", id: finalId };
  if (!sheetResult.ok) {
    response.sheetWarning = "Đã lưu Firestore nhưng đồng bộ Google Sheet thất bại: " + sheetResult.reason;
  }
  return response;
}

// ---------------------------------------------------------------------------
// submit-result (public, không cần adminKey) — chỉ đồng bộ sang Google Sheet,
// giống hệt hành vi bản Cloud Functions cũ (không ghi "results" vào Firestore).
// ---------------------------------------------------------------------------
function actionSubmitResult_(body) {
  var quizId = body.quizId;
  if (!quizId || typeof quizId !== "string") {
    return { status: "error", message: 'Thiếu "quizId".' };
  }
  var quizR = fsFetch_("/quizzes/" + encodeURIComponent(quizId), "get");
  if (quizR.code === 404) return { status: "error", message: "Mã đề không tồn tại, không thể ghi kết quả." };
  if (quizR.code !== 200) return { status: "error", message: "Lỗi máy chủ khi đọc Firestore: " + quizR.text };

  var resultData = {};
  Object.assign(resultData, body);
  delete resultData.adminKey;
  delete resultData.action;
  var studentId = String(resultData.id || "").trim();
  if (!studentId) return { status: "error", message: "Thiếu ID học sinh, không thể ghi kết quả." };
  resultData.id = studentId;
  var nopLuc = new Date().toISOString();

  var sheetPayload = { sheet: "results" };
  Object.assign(sheetPayload, resultData);
  sheetPayload.nopLuc = nopLuc;
  var sheetResult = syncToSheet_(sheetPayload);
  if (!sheetResult.ok) {
    return { status: "error", message: "Không ghi được kết quả vào Google Sheet: " + sheetResult.reason };
  }
  return { status: "ok" };
}

// ---------------------------------------------------------------------------
// deploy-site — đẩy đề thi/ảnh lên GitHub Pages qua GitHub Contents API
// ---------------------------------------------------------------------------
var MAX_HTML_BYTES = 5 * 1024 * 1024;
var MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function sanitizeFileName_(name) {
  var fallback = "index.html";
  if (!name || typeof name !== "string") return fallback;
  var cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned || fallback;
}
function sanitizeImagePath_(path) {
  var cleaned = String(path || "").trim().replace(/^\/+/, "");
  var safe = cleaned.replace(/[^a-zA-Z0-9._\/-]/g, "_");
  return safe || "image/unnamed";
}
function questionImagePathToDocId_(path) {
  return String(path || "").trim().replace(/^\/+/, "").replace(/[^a-zA-Z0-9._-]/g, "__");
}
function encodeGhPath_(path) {
  return String(path)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}
function ghHeaders_(token) {
  return {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ic3-admin-apps-script",
  };
}
function ghGetSha_(owner, repo, branch, path, token) {
  var url = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + encodeGhPath_(path) + "?ref=" + encodeURIComponent(branch);
  var res = UrlFetchApp.fetch(url, { headers: ghHeaders_(token), muteHttpExceptions: true });
  if (res.getResponseCode() === 404) return null;
  if (res.getResponseCode() >= 300) throw new Error('Không đọc được thông tin file "' + path + '" trên GitHub (HTTP ' + res.getResponseCode() + ").");
  var data = JSON.parse(res.getContentText());
  return data && data.sha ? data.sha : null;
}
function ghPutFile_(owner, repo, branch, path, base64Content, token, message) {
  var existingSha = ghGetSha_(owner, repo, branch, path, token);
  var url = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + encodeGhPath_(path);
  var body = { message: message || "Cập nhật " + path, content: base64Content, branch: branch };
  if (existingSha) body.sha = existingSha;
  var res = UrlFetchApp.fetch(url, {
    method: "put",
    headers: ghHeaders_(token),
    contentType: "application/json",
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() >= 300) throw new Error('Không ghi được file "' + path + '" lên GitHub (HTTP ' + res.getResponseCode() + "): " + res.getContentText());
  return JSON.parse(res.getContentText());
}
function ghDeleteFile_(owner, repo, branch, path, token, message) {
  var sha = ghGetSha_(owner, repo, branch, path, token);
  if (!sha) return; // file không tồn tại, coi như đã xoá
  var url = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + encodeGhPath_(path);
  var res = UrlFetchApp.fetch(url, {
    method: "delete",
    headers: ghHeaders_(token),
    contentType: "application/json",
    payload: JSON.stringify({ message: message || "Xoá " + path, sha: sha, branch: branch }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() >= 300) throw new Error('Không xoá được file "' + path + '" trên GitHub (HTTP ' + res.getResponseCode() + "): " + res.getContentText());
}
function ghBuildPagesUrl_(host, path) {
  var base = host.pagesUrl ? String(host.pagesUrl).replace(/\/+$/, "") : "https://" + host.owner + ".github.io/" + host.repo;
  return path ? base + "/" + path : base;
}

function actionDeploySite_(body) {
  var hostId = body.hostId;
  var htmlContent = body.htmlContent;
  var fileName = body.fileName;
  var images = body.images;
  var deleteImagePaths = body.deleteImagePaths;

  if (!hostId || typeof hostId !== "string") {
    return { status: "error", message: "Thiếu hostId (chưa chọn host lưu file bài)." };
  }
  var hasHtml = typeof htmlContent === "string" && htmlContent.length > 0;
  var imgList = Array.isArray(images) ? images.filter(function (im) { return im && typeof im.path === "string" && typeof im.base64 === "string" && im.base64.length; }) : [];
  var delList = Array.isArray(deleteImagePaths)
    ? deleteImagePaths
        .filter(function (p) { return typeof p === "string" && p.trim(); })
        .map(function (p) { return { raw: p, ghPath: sanitizeImagePath_(p), docId: questionImagePathToDocId_(p) }; })
    : [];

  if (!hasHtml && !imgList.length && !delList.length) {
    return { status: "error", message: "Thiếu htmlContent, images, hoặc deleteImagePaths cần xử lý." };
  }
  if (hasHtml && Utilities.newBlob(htmlContent).getBytes().length > MAX_HTML_BYTES) {
    return { status: "error", message: "Nội dung file HTML vượt quá giới hạn 5MB." };
  }
  for (var i = 0; i < imgList.length; i++) {
    var approxBytes = Math.ceil((imgList[i].base64.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_BYTES) return { status: "error", message: 'Ảnh "' + imgList[i].path + '" vượt quá giới hạn 8MB.' };
  }

  var hostR = fsFetch_("/hosts/" + encodeURIComponent(hostId), "get");
  if (hostR.code === 404) return { status: "error", message: 'Không tìm thấy host "' + hostId + '" trong Firestore.' };
  if (hostR.code !== 200) return { status: "error", message: "Lỗi đọc Firestore: " + hostR.text };
  var hostData = fsDecodeFields_(hostR.json.fields);

  var token = hostData.token, owner = hostData.owner, repo = hostData.repo;
  var branch = hostData.branch || "main";
  if (!token || !owner || !repo) {
    return { status: "error", message: 'Host "' + hostId + '" thiếu token/owner/repo trong Firestore (cần { token: GitHub PAT, owner, repo, branch }).' };
  }

  var safeFileName = sanitizeFileName_(fileName);
  var fileUrl = null;
  try {
    if (hasHtml) {
      var b64 = Utilities.base64Encode(htmlContent, Utilities.Charset.UTF_8);
      ghPutFile_(owner, repo, branch, safeFileName, b64, token, "Cập nhật " + safeFileName + " (apps-script)");
      fileUrl = ghBuildPagesUrl_(hostData, safeFileName);
    }
    for (var j = 0; j < imgList.length; j++) {
      var path = sanitizeImagePath_(imgList[j].path);
      ghPutFile_(owner, repo, branch, path, imgList[j].base64, token, "Cập nhật ảnh " + path + " (apps-script)");
      if (!fileUrl) fileUrl = ghBuildPagesUrl_(hostData, path);
    }
  } catch (err) {
    return { status: "error", message: "Lỗi khi đẩy lên GitHub: " + err.message };
  }

  var deletedPaths = [];
  var deleteErrors = [];
  for (var k = 0; k < delList.length; k++) {
    var del = delList[k];
    try {
      ghDeleteFile_(owner, repo, branch, del.ghPath, token, "Xoá " + del.ghPath + " (apps-script)");
      fsFetch_("/questionImages/" + encodeURIComponent(del.docId), "delete");
      deletedPaths.push(del.raw);
    } catch (err) {
      deleteErrors.push({ path: del.raw, message: err.message });
    }
  }

  return {
    status: "ok",
    url: fileUrl || ghBuildPagesUrl_(hostData, ""),
    deletedPaths: deletedPaths,
    deleteErrors: deleteErrors,
  };
}

// ---------------------------------------------------------------------------
// host-usage — dung lượng repo (KB) + rate limit API GitHub còn lại của token.
// Cache 10 phút bằng CacheService (không cần Firestore riêng như bản Cloud Functions cũ).
// ---------------------------------------------------------------------------
function actionHostUsage_(body) {
  var hostIds = body.hostIds;
  var force = body.force;
  if (!Array.isArray(hostIds) || !hostIds.length) {
    return { status: "error", message: 'Thiếu "hostIds" (phải là mảng khác rỗng).' };
  }
  var cache = CacheService.getScriptCache();
  var data = {};
  hostIds.forEach(function (hostId) {
    try {
      if (!force) {
        var cached = cache.get("hostusage_" + hostId);
        if (cached) {
          data[hostId] = JSON.parse(cached);
          return;
        }
      }
      var hostR = fsFetch_("/hosts/" + encodeURIComponent(hostId), "get");
      if (hostR.code !== 200) throw new Error("Không tìm thấy host trong Firestore.");
      var hostData = fsDecodeFields_(hostR.json.fields);
      var token = hostData.token, owner = hostData.owner, repo = hostData.repo;
      if (!token || !owner || !repo) throw new Error("Host thiếu token/owner/repo trong Firestore.");

      var repoRes = UrlFetchApp.fetch("https://api.github.com/repos/" + owner + "/" + repo, { headers: ghHeaders_(token), muteHttpExceptions: true });
      var repoInfo = JSON.parse(repoRes.getContentText());
      var rateRes = UrlFetchApp.fetch("https://api.github.com/rate_limit", { headers: ghHeaders_(token), muteHttpExceptions: true });
      var rate = JSON.parse(rateRes.getContentText());

      var usage = {
        repoSizeKb: repoInfo.size || 0,
        rateLimit: rate && rate.rate ? { used: rate.rate.limit - rate.rate.remaining, included: rate.rate.limit } : null,
      };
      cache.put("hostusage_" + hostId, JSON.stringify(usage), 600);
      data[hostId] = usage;
    } catch (err) {
      data[hostId] = { error: err.message || String(err) };
    }
  });
  return { status: "ok", data: data };
}
