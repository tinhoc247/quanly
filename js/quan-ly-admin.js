const SEED_SCHOOL_LIST = ["Khác"];
const SEED_CLASS_LIST = [];
const SEED_QUIZ = [];
const STORAGE_KEY = "quanly_cau_hoi_v1";
const SUBJECTS = [
  { id: "lv1", label: "Spark lv1", icon: "1️⃣" },
  { id: "lv2", label: "Spark lv2", icon: "2️⃣" },
  { id: "lv3", label: "Spark lv3", icon: "3️⃣" },
  { id: "lv4", label: "GS6 lv1", icon: "4️⃣" },
  { id: "lv5", label: "GS6 lv2", icon: "5️⃣" },
  { id: "lv6", label: "GS6 lv3", icon: "6️⃣" },
  { id: "lv7", label: "MOS Word", icon: "7️⃣" },
  { id: "lv8", label: "MOS Excel", icon: "8️⃣" },
  { id: "lv9", label: "MOS Powerpoint", icon: "9️⃣" },
];
function subjectLabel(id) {
  const s = SUBJECTS.find((x) => x.id === id);
  return s ? s.icon + " " + s.label : id;
}
function subjectSlug(id) {
  const s = SUBJECTS.find((x) => x.id === id);
  const label = s ? s.label : id;
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function toFileSlug(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function selectedTopicsSlug() {
  const allTopics = computeTopics().map((t) => t.name);
  const noneSelected = !selectedTopics || selectedTopics.size === 0;
  const allSelected =
    !noneSelected &&
    allTopics.length > 0 &&
    allTopics.every((name) => selectedTopics.has(name));
  if (noneSelected || allSelected) return "";
  const names = allTopics.filter((name) => selectedTopics.has(name));
  const MAX_LEN = 60;
  let slug = "";
  let usedCount = 0;
  for (const name of names) {
    const piece = toFileSlug(name);
    if (!piece) continue;
    const next = slug ? slug + "-" + piece : piece;
    if (next.length > MAX_LEN && slug) break;
    slug = next;
    usedCount++;
  }
  if (usedCount < names.length) slug += "-va-them";
  return slug;
}
function selectedTopicsLabel() {
  const allTopics = computeTopics().map((t) => t.name);
  const noneSelected = !selectedTopics || selectedTopics.size === 0;
  const allSelected =
    !noneSelected &&
    allTopics.length > 0 &&
    allTopics.every((name) => selectedTopics.has(name));
  if (noneSelected || allSelected) return "Tất cả chủ đề";
  const names = allTopics.filter((name) => selectedTopics.has(name));
  const MAX_TOPICS_SHOWN = 3;
  if (names.length <= MAX_TOPICS_SHOWN) return names.join(", ");
  return (
    names.slice(0, MAX_TOPICS_SHOWN).join(", ") +
    " và " +
    (names.length - MAX_TOPICS_SHOWN) +
    " chủ đề khác"
  );
}
const DEFAULT_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyzmYfeMuBxj9lNg40hHIIvMFHDUFIeAyV7w3uNRIO5hYETo_fB4tfmZHLVlyT6_AU76g/exec";
const EMAIL_SHEET_ID = "1KA0PkikxJ_YFzobOl_QhzDc_Uiu8McTcv7BfwT7zwsU";
const EMAIL_SHEET_TAB = "EmailScriptsSync";
const USER_DIRECTORY_URL =
  "https://script.google.com/macros/s/AKfycbxiSMLdMGj4lvXY7_BGBI1MR4Fq7JvDD-2m2tLTSxE-_lxX2GzP_2JRSc2Gm5albOFeYA/exec";
const FALLBACK_EMAIL_LIST = [
  { id: "default", label: "Mặc định (ngoại tuyến)", url: DEFAULT_WEB_APP_URL },
];
const HOST_SHEET_ID = "1GoCzYfXAAnHu3eSS7ikza7EyqQooY-Jw2kYeBlOO6kg";
const HOST_SHEET_TAB = "HostSync";
const FALLBACK_HOST_LIST = [
  {
    id: "default",
    label: '⚠️ Chưa cấu hình host (vào Firestore/collection "hosts" để thêm)',
  },
];
const ADMIN_KEY = "teamgvth";
// BACKEND = Google Apps Script Web App (thay cho Cloud Functions, để dùng được gói Firebase
// Spark/free — Cloud Functions thế hệ 2 bắt buộc gói Blaze dù có gọi API ngoài hay không).
// Sau khi deploy apps-script/Code.gs làm Web App (xem hướng dẫn trong file đó), dán URL
// dạng ".../exec" vào đây. Khác với Cloud Functions (mỗi hàm 1 URL riêng), Apps Script chỉ
// có DUY NHẤT 1 URL — tên action được gửi kèm trong payload để backend tự định tuyến.
const FUNCTIONS_ORIGIN =
  "https://script.google.com/macros/s/AKfycby84BSngc9uw3abnxM5WWphJMr-ypIAZD4s6F6KuZcmupjBHMUPwsHgXew0Z7f8ON9E/exec";
async function callAdminApi(action, payload) {
  let res;
  try {
    res = await fetch(FUNCTIONS_ORIGIN, {
      method: "POST",
      // Cố tình dùng text/plain (không phải application/json): nếu để application/json,
      // trình duyệt sẽ gửi preflight OPTIONS trước — Apps Script Web App KHÔNG xử lý được
      // preflight nên request sẽ bị lỗi CORS. Backend (Code.gs) vẫn đọc đúng JSON từ
      // e.postData.contents bất kể Content-Type khai báo là gì.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, adminKey: ADMIN_KEY, ...payload }),
    });
  } catch (err) {
    throw new Error(
      `Không gọi được ${action} (kiểm tra mạng hoặc FUNCTIONS_ORIGIN): ${err.message}`,
    );
  }
  let json;
  try {
    json = await res.json();
  } catch (err) {
    throw new Error(
      `${action} trả về phản hồi không phải JSON hợp lệ (HTTP ${res.status}).`,
    );
  }
  if (!res.ok || json.status !== "ok")
    throw new Error(
      json.message || `Lỗi HTTP ${res.status} khi gọi ${action}.`,
    );
  return json;
}
async function adminLoad(collection, docId) {
  const json = await callAdminApi(
    "admin-load",
    docId
      ? { collection: collection, docId: docId }
      : { collection: collection },
  );
  return json.data;
}
async function adminSave(collection, data, docId) {
  const json = await callAdminApi(
    "admin-save",
    docId
      ? { collection: collection, docId: docId, data: data }
      : { collection: collection, data: data },
  );
  return json.id;
}
let RESULTS_LIST = [];
function getResultStudentId(r) {
  const direct = String(r && r.id != null ? r.id : "").trim();
  if (direct) return direct;
  try {
    const name = normalizeNameForCompare(r && r.name);
    const school = normalizeNameForCompare(r && r.school);
    const klass = normalizeNameForCompare(r && r.class);
    const hit = (Array.isArray(CLASS_LIST) ? CLASS_LIST : []).find(
      (x) =>
        normalizeNameForCompare(x.name) === name &&
        normalizeNameForCompare(x.school) === school &&
        normalizeNameForCompare(x.class) === klass,
    );
    return hit && hit.id != null ? String(hit.id).trim() : "";
  } catch (e) {
    return "";
  }
}
function formatResultTimestamp(ts) {
  const n = Number(ts);
  if (!n) return "";
  const d = new Date(n);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN");
}
function formatResultDuration(sec) {
  const total = Number(sec) || 0;
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}
function populateResultsQuizFilter() {
  const sel = document.getElementById("resultsFilterQuiz");
  if (!sel) return;
  const current = sel.value;
  const titles = Array.from(
    new Set(RESULTS_LIST.map((r) => r.quizTitle).filter(Boolean)),
  ).sort((a, b) => String(a).localeCompare(String(b), "vi"));
  sel.innerHTML =
    '<option value="">-- Tất cả đề --</option>' +
    titles
      .map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`)
      .join("");
  if (titles.includes(current)) sel.value = current;
}
function getFilteredResults() {
  const id = (document.getElementById("resultsFilterId")?.value || "")
    .trim()
    .toLocaleLowerCase("vi");
  const name = (document.getElementById("resultsFilterName")?.value || "")
    .trim()
    .toLocaleLowerCase("vi");
  const klass = (document.getElementById("resultsFilterClass")?.value || "")
    .trim()
    .toLocaleLowerCase("vi");
  const quiz = document.getElementById("resultsFilterQuiz")?.value || "";
  const from = document.getElementById("resultsFilterFrom")?.value || "";
  const to = document.getElementById("resultsFilterTo")?.value || "";
  return RESULTS_LIST.filter((r) => {
    if (
      id &&
      !String(getResultStudentId(r)).toLocaleLowerCase("vi").includes(id)
    )
      return false;
    if (
      name &&
      !String(r.name || "")
        .toLocaleLowerCase("vi")
        .includes(name)
    )
      return false;
    if (
      klass &&
      !String(r.class || "")
        .toLocaleLowerCase("vi")
        .includes(klass)
    )
      return false;
    if (quiz && r.quizTitle !== quiz) return false;
    const ts = Number(r.submittedAt) || 0;
    if (from) {
      const fromTs = new Date(from + "T00:00:00").getTime();
      if (!ts || ts < fromTs) return false;
    }
    if (to) {
      const toTs = new Date(to + "T23:59:59").getTime();
      if (!ts || ts > toTs) return false;
    }
    return true;
  }).sort(
    (a, b) => (Number(b.submittedAt) || 0) - (Number(a.submittedAt) || 0),
  );
}
function renderResultsTable() {
  const tbody = document.getElementById("resultsTbody");
  if (!tbody) return;
  const rows = getFilteredResults();
  if (rows.length === 0)
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-mute);padding:14px;">Không có kết quả phù hợp.</td></tr>`;
  else
    tbody.innerHTML = rows
      .map(
        (r) =>
          `\n      <tr>\n        <td style="padding:7px 10px;border-bottom:1px solid var(--border);">${escapeHtml(formatResultTimestamp(r.submittedAt))}</td>\n        <td style="padding:7px 10px;border-bottom:1px solid var(--border);font-weight:800;">${escapeHtml(getResultStudentId(r))}</td>\n        <td style="padding:7px 10px;border-bottom:1px solid var(--border);">${escapeHtml(r.school || "")}</td>\n        <td style="padding:7px 10px;border-bottom:1px solid var(--border);">${escapeHtml(r.class || "")}</td>\n        <td style="padding:7px 10px;border-bottom:1px solid var(--border);">${escapeHtml(r.name || "")}</td>\n        <td style="padding:7px 10px;border-bottom:1px solid var(--border);">${escapeHtml(r.quizTitle || "")}</td>\n        <td style="padding:7px 10px;border-bottom:1px solid var(--border);text-align:center;font-weight:700;">${r.score ?? ""}%</td>\n        <td style="padding:7px 10px;border-bottom:1px solid var(--border);text-align:center;">${r.passed ? "✅" : "❌"}</td>\n        <td style="padding:7px 10px;border-bottom:1px solid var(--border);text-align:center;">${formatResultDuration(r.timeTakenSeconds)}</td>\n      </tr>\n    `,
      )
      .join("");
  const summary = document.getElementById("resultsSummary");
  if (summary)
    summary.textContent = `Hiển thị ${rows.length} / ${RESULTS_LIST.length} kết quả.`;
}
async function loadResultsFromApi() {
  const log = document.getElementById("resultsLog");
  const setLogEl = (cls, msg) => {
    if (log) {
      log.className = "log show " + cls;
      log.textContent = msg;
    }
  };
  setLogEl("info", "⏳ Đang tải kết quả từ Firestore...");
  try {
    const data = await adminLoad("results");
    RESULTS_LIST = Array.isArray(data) ? data : [];
    populateResultsQuizFilter();
    renderResultsTable();
    setLogEl("ok", `✅ Đã tải ${RESULTS_LIST.length} kết quả.`);
  } catch (err) {
    console.error("Không tải được kết quả:", err);
    setLogEl(
      "err",
      "⚠️ Không tải được kết quả từ Firestore (" + err.message + ")",
    );
  }
}
function exportResultsToExcel() {
  const rows = getFilteredResults();
  if (rows.length === 0) {
    alert("Không có kết quả nào để xuất (theo bộ lọc hiện tại).");
    return;
  }
  const data = rows.map((r) => ({
    "Thời gian nộp": formatResultTimestamp(r.submittedAt),
    ID: getResultStudentId(r),
    Trường: r.school || "",
    Lớp: r.class || "",
    "Học sinh": r.name || "",
    Đề: r.quizTitle || "",
    "Điểm (%)": r.score ?? "",
    "Số câu đúng": r.correctCount ?? "",
    "Tổng số câu": r.totalCount ?? "",
    "Kết quả": r.passed ? "Đạt" : "Chưa đạt",
    "Thời gian làm bài": formatResultDuration(r.timeTakenSeconds),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "KetQua");
  XLSX.writeFile(wb, "ket-qua-bai-lam.xlsx");
}
(function initResultsPanel() {
  const loadBtn = document.getElementById("loadResultsBtn");
  const exportBtn = document.getElementById("exportResultsBtn");
  if (loadBtn) loadBtn.onclick = loadResultsFromApi;
  if (exportBtn) exportBtn.onclick = exportResultsToExcel;
  [
    "resultsFilterId",
    "resultsFilterName",
    "resultsFilterClass",
    "resultsFilterQuiz",
    "resultsFilterFrom",
    "resultsFilterTo",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", renderResultsTable);
  });
})();
let QUIZ = [],
  CLASS_LIST = [],
  SCHOOL_LIST = [];
let ACTIVE_SUBJECT = SUBJECTS[0].id;
let QUIZ_BY_SUBJECT = {};
SUBJECTS.forEach((s) => {
  QUIZ_BY_SUBJECT[s.id] = [];
});
const QUIZ_LOADED_SUBJECTS = new Set();
let EMAIL_LIST = FALLBACK_EMAIL_LIST.slice();
let ACTIVE_EMAIL_ID = FALLBACK_EMAIL_LIST[0].id;
let WEB_APP_URL = DEFAULT_WEB_APP_URL;
let HOST_LIST = FALLBACK_HOST_LIST.slice();
let ACTIVE_HOST_ID = FALLBACK_HOST_LIST[0].id;
let HOST_SYNC_PROMISE = Promise.resolve();
let ACTIVE_HOST_IS_CONFIGURED = false;
const HOST_USAGE_WARN_PERCENT = 80;
const HOST_USAGE_CRITICAL_PERCENT = 95;
let HOST_USAGE_BY_ID = {};
function syncActiveHost() {
  const found = HOST_LIST.find((h) => h.id === ACTIVE_HOST_ID) || HOST_LIST[0];
  if (found) ACTIVE_HOST_ID = found.id;
}
function fetchHostSheetJSONP_LEGACY() {
  return new Promise((resolve, reject) => {
    const cbName =
      "__hostSheetCb_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
    const scriptEl = document.createElement("script");
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Hết thời gian chờ Google Sheet phản hồi"));
    }, 1e4);
    function cleanup() {
      clearTimeout(timeoutId);
      delete window[cbName];
      if (scriptEl.parentNode) scriptEl.parentNode.removeChild(scriptEl);
    }
    window[cbName] = function (json) {
      cleanup();
      try {
        const rows = (json && json.table && json.table.rows) || [];
        const HEADER_LOOKALIKES = new Set([
          "name",
          "ten",
          "tên",
          "label",
          "siteid",
          "site id",
          "token",
          "owner/repo",
          "repo",
          "branch",
        ]);
        // Cột B của sheet "HostSync" giờ chứa "owner/repo" (repo GitHub Pages của host đó),
        // vd "mytruong/de-thi-2026" — KHÔNG còn là Netlify Site ID nữa. Cột C vẫn là token,
        // nhưng giờ là GitHub Personal Access Token (quyền "Contents: read & write" trên repo
        // đó) thay vì Netlify Personal Access Token. Cột D (tuỳ chọn) = tên nhánh, mặc định
        // "main" nếu để trống. Cột E (tuỳ chọn) = URL GitHub Pages tuỳ chỉnh (vd domain riêng),
        // để trống thì tự suy ra từ owner/repo.
        const parsed = rows
          .map((r) => {
            const cells = (r && r.c) || [];
            const ten =
              cells[0] && cells[0].v != null ? String(cells[0].v).trim() : "";
            const repoSlug =
              cells[1] && cells[1].v != null ? String(cells[1].v).trim() : "";
            const token =
              cells[2] && cells[2].v != null ? String(cells[2].v).trim() : "";
            const branch =
              cells[3] && cells[3].v != null ? String(cells[3].v).trim() : "";
            const pagesUrl =
              cells[4] && cells[4].v != null ? String(cells[4].v).trim() : "";
            const slugParts = repoSlug.split("/").map((s) => s.trim());
            const owner = slugParts[0] || "";
            const repo = slugParts[1] || "";
            return {
              id: repoSlug.replace(/\//g, "__") || token,
              label: ten || repoSlug || "Không tên",
              token: token,
              owner: owner,
              repo: repo,
              branch: branch || "main",
              pagesUrl: pagesUrl,
            };
          })
          .filter((h) => {
            if (!h.token || !h.owner || !h.repo) return false;
            if (HEADER_LOOKALIKES.has((h.owner + "/" + h.repo).toLowerCase())) return false;
            if (HEADER_LOOKALIKES.has(h.token.toLowerCase())) return false;
            return true;
          });
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    scriptEl.onerror = () => {
      cleanup();
      reject(new Error("Không tải được script từ Google Sheet"));
    };
    scriptEl.src =
      "https://docs.google.com/spreadsheets/d/" +
      HOST_SHEET_ID +
      "/gviz/tq?sheet=" +
      encodeURIComponent(HOST_SHEET_TAB) +
      "&headers=1" +
      "&tqx=out:json;responseHandler:" +
      cbName +
      "&_=" +
      Date.now();
    document.body.appendChild(scriptEl);
  });
}
async function syncHostSheetToFirestore(sheetHosts) {
  await Promise.all(
    sheetHosts.map(async (h) => {
      try {
        await adminSave(
          "hosts",
          { label: h.label, token: h.token, owner: h.owner, repo: h.repo, branch: h.branch, pagesUrl: h.pagesUrl },
          h.id,
        );
      } catch (err) {
        console.error(
          'Không đồng bộ được host "' + h.label + '" vào Firestore:',
          err,
        );
      }
    }),
  );
}
async function loadHostListFromApi() {
  const hostStatusEl = document.getElementById("hostStatus");
  if (hostStatusEl)
    hostStatusEl.innerHTML = "⏳ Đang tải danh sách host từ Google Sheet...";
  try {
    const sheetHosts = await fetchHostSheetJSONP_LEGACY();
    if (!sheetHosts.length)
      throw new Error(
        'Sheet "HostSync" chưa có dòng host hợp lệ nào (thiếu Site ID hoặc Token).',
      );
    HOST_LIST = sheetHosts.map((h) => ({
      id: h.id,
      label: h.label,
      owner: h.owner,
      repo: h.repo,
      pagesUrl: h.pagesUrl,
    }));
    ACTIVE_HOST_IS_CONFIGURED = true;
    if (hostStatusEl) hostStatusEl.innerHTML = "";
    HOST_SYNC_PROMISE = syncHostSheetToFirestore(sheetHosts);
  } catch (sheetErr) {
    console.error("Không tải được danh sách host từ Google Sheet:", sheetErr);
    try {
      const rows = await adminLoad("hosts");
      const parsed = rows
        .map((d) => ({
          id: d.id,
          label: d.label || d.id,
          owner: d.owner,
          repo: d.repo,
          pagesUrl: d.pagesUrl,
          hasRepo: !!(d.owner && d.repo),
        }))
        .filter((h) => h.hasRepo);
      if (!parsed.length)
        throw new Error('Firestore (collection "hosts") cũng đang trống.');
      HOST_LIST = parsed;
      ACTIVE_HOST_IS_CONFIGURED = true;
      if (hostStatusEl)
        hostStatusEl.innerHTML =
          '<span style="color:#b00020">⚠️ Không tải được từ Google Sheet (' +
          escapeHtml(sheetErr.message || String(sheetErr)) +
          "), đang tạm dùng bản Firestore lưu lần trước.</span>";
    } catch (fsErr) {
      HOST_LIST = FALLBACK_HOST_LIST.slice();
      ACTIVE_HOST_IS_CONFIGURED = false;
      if (hostStatusEl)
        hostStatusEl.innerHTML =
          '<span style="color:#b00020">⚠️ Không tải được danh sách host (Google Sheet lẫn Firestore đều lỗi: ' +
          escapeHtml(sheetErr.message || String(sheetErr)) +
          "), đang tạm dùng host dự phòng.</span>";
    }
  }
  const stillExists = HOST_LIST.some((h) => h.id === ACTIVE_HOST_ID);
  if (!stillExists) ACTIVE_HOST_ID = HOST_LIST[0].id;
  syncActiveHost();
  saveState();
  renderHostSelect();
  // Đã khôi phục loadHostUsageList() theo yêu cầu — cần chạy authorize() 1 lần trong
  // Apps Script editor để cấp quyền UrlFetchApp trước khi dùng (xem hướng dẫn kèm theo).
  if (ACTIVE_HOST_IS_CONFIGURED) loadHostUsageList(HOST_LIST.map((h) => h.id));
}
function renderHostStatus() {
  const hostStatusEl = document.getElementById("hostStatus");
  if (!hostStatusEl) return;
  const active = HOST_LIST.find((h) => h.id === ACTIVE_HOST_ID) || HOST_LIST[0];
  const label = active ? active.label || active.id : "Mặc định";
  let html =
    "<b>Đang dùng:</b> " +
    escapeHtml(label) +
    ' <span style="color:#666">(dùng chung cho cả bài ôn luyện và bài kiểm tra)</span>';
  hostStatusEl.className = "log show";
  const usage = active ? HOST_USAGE_BY_ID[active.id] : null;
  // GitHub không có API "bandwidth đã dùng" như Netlify, nên hiển thị dung lượng repo (KB)
  // + rate limit API còn lại của token làm thông tin tham khảo, thay cho %-băng-thông cũ.
  if (usage && (usage.repoSizeKb != null || usage.rateLimit)) {
    if (usage.repoSizeKb != null)
      html += "<br>📦 Dung lượng repo: <b>" + formatUsageBytes(usage.repoSizeKb * 1024) + "</b>";
    if (usage.rateLimit)
      html +=
        " &nbsp;•&nbsp; 🔌 API rate limit: " +
        usage.rateLimit.used +
        "/" +
        usage.rateLimit.included;
    hostStatusEl.style.background = "";
    hostStatusEl.style.color = "";
  } else if (usage && usage.error) {
    html +=
      '<br><span style="color:#9f1c19;font-size:12.5px;">⚠️ Không lấy được số liệu usage (' +
      escapeHtml(usage.error) +
      '). Có thể do chưa authorize UrlFetchApp trong Apps Script, hoặc host này ' +
      "chưa được cấu hình đúng token/owner/repo.</span>";
    hostStatusEl.style.background = "";
    hostStatusEl.style.color = "";
  } else {
    hostStatusEl.style.background = "";
    hostStatusEl.style.color = "";
    if (active && active.id)
      html +=
        '<br><span style="color:#999;font-size:12px;">⏳ Đang tải số liệu usage (băng thông)...</span>';
  }
  hostStatusEl.innerHTML = html;
}
function formatUsageBytes(n) {
  const num = Number(n) || 0;
  if (num >= 1024 * 1024 * 1024)
    return (num / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  if (num >= 1024 * 1024) return (num / (1024 * 1024)).toFixed(0) + " MB";
  if (num >= 1024) return (num / 1024).toFixed(0) + " KB";
  return num + " B";
}
// GitHub không có khái niệm quota băng thông kèm API usage như Netlify, nên không còn
// %-mức-dùng để cảnh báo critical/warn nữa — 2 hàm dưới đây giữ lại (trả về rỗng) chỉ để
// không phải sửa mọi nơi đang gọi chúng.
function hostUsageLevel(hostId) {
  return null;
}
function hostUsageBadgeSuffix(hostId) {
  return "";
}
async function loadHostUsageList(hostIds, force) {
  if (!hostIds || !hostIds.length) return;
  try {
    const json = await callAdminApi("host-usage", {
      hostIds: hostIds,
      force: !!force,
    });
    HOST_USAGE_BY_ID = { ...HOST_USAGE_BY_ID, ...(json.data || {}) };
  } catch (err) {
    console.error(
      "Không tải được usage host (Bandwidth/Team members):",
      err.message || err,
    );
    hostIds.forEach((id) => {
      if (!HOST_USAGE_BY_ID[id])
        HOST_USAGE_BY_ID[id] = { error: err.message || String(err) };
    });
  }
  renderHostSelect();
}
function renderHostSelect() {
  const hostSelectEl = document.getElementById("hostSelect");
  if (!hostSelectEl) return;
  const prevValue = hostSelectEl.value;
  hostSelectEl.innerHTML = HOST_LIST.map(
    (h) =>
      '<option value="' +
      escapeHtml(h.id) +
      '"' +
      (h.id === ACTIVE_HOST_ID ? " selected" : "") +
      ">" +
      escapeHtml(h.label || h.id) +
      escapeHtml(hostUsageBadgeSuffix(h.id)) +
      "</option>",
  ).join("");
  if (prevValue && HOST_LIST.some((h) => h.id === prevValue))
    hostSelectEl.value = prevValue;
  renderHostStatus();
}
function syncActiveWebAppUrl() {
  const found =
    EMAIL_LIST.find((e) => e.id === ACTIVE_EMAIL_ID) || EMAIL_LIST[0];
  if (found) {
    ACTIVE_EMAIL_ID = found.id;
    WEB_APP_URL = found.url || DEFAULT_WEB_APP_URL;
  } else WEB_APP_URL = DEFAULT_WEB_APP_URL;
}
function fetchEmailSheetJSONP_LEGACY() {
  return new Promise((resolve, reject) => {
    const cbName =
      "__emailSheetCb_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
    const scriptEl = document.createElement("script");
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Hết thời gian chờ Google Sheet phản hồi"));
    }, 1e4);
    function cleanup() {
      clearTimeout(timeoutId);
      delete window[cbName];
      if (scriptEl.parentNode) scriptEl.parentNode.removeChild(scriptEl);
    }
    window[cbName] = function (json) {
      cleanup();
      try {
        const rows = (json && json.table && json.table.rows) || [];
        const parsed = rows
          .map((r) => {
            const cells = (r && r.c) || [];
            const ten =
              cells[0] && cells[0].v != null ? String(cells[0].v).trim() : "";
            const email =
              cells[1] && cells[1].v != null ? String(cells[1].v).trim() : "";
            const link =
              cells[2] && cells[2].v != null ? String(cells[2].v).trim() : "";
            const label =
              ten && email ? ten + " - " + email : ten || email || "Không tên";
            return { id: email || link, label: label, url: link };
          })
          .filter((e) => e.url && e.id);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    scriptEl.onerror = () => {
      cleanup();
      reject(new Error("Không tải được script từ Google Sheet"));
    };
    scriptEl.src =
      "https://docs.google.com/spreadsheets/d/" +
      EMAIL_SHEET_ID +
      "/gviz/tq?sheet=" +
      encodeURIComponent(EMAIL_SHEET_TAB) +
      "&tqx=out:json;responseHandler:" +
      cbName +
      "&_=" +
      Date.now();
    document.body.appendChild(scriptEl);
  });
}
async function loadEmailListFromApi() {
  try {
    const rows = await adminLoad("emails");
    const parsed = rows
      .map((d) => ({ id: d.id, label: d.label || d.id, url: d.url }))
      .filter((e) => e.url && e.id);
    if (!parsed.length)
      throw new Error(
        'Chưa có mail nào trong Firestore (collection "emails" trống — thử bấm "📥 Import dữ liệu cũ")',
      );
    EMAIL_LIST = parsed;
  } catch (err) {
    console.error("Không tải được danh sách mail từ Firestore:", err);
    EMAIL_LIST = FALLBACK_EMAIL_LIST.slice();
  }
  const stillExists = EMAIL_LIST.some((e) => e.id === ACTIVE_EMAIL_ID);
  if (!stillExists) ACTIVE_EMAIL_ID = EMAIL_LIST[0].id;
  syncActiveWebAppUrl();
  renderEmailSelect();
}
function normalizeClassListIds(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const used = new Set(
    list
      .map((r) => String(r && r.id != null ? r.id : "").trim())
      .filter(Boolean)
      .map((v) => v.toLowerCase()),
  );
  let next = 1;
  for (const r of list) {
    if (!r || typeof r !== "object") continue;
    let id = String(r.id ?? "").trim();
    if (!id) {
      while (used.has(String(next).toLowerCase())) next++;
      id = String(next++);
      r.id = id;
      used.add(id.toLowerCase());
    }
  }
  return list;
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.QUIZ_BY_SUBJECT && typeof parsed.QUIZ_BY_SUBJECT === "object")
        SUBJECTS.forEach((s) => {
          QUIZ_BY_SUBJECT[s.id] = Array.isArray(parsed.QUIZ_BY_SUBJECT[s.id])
            ? parsed.QUIZ_BY_SUBJECT[s.id]
            : [];
        });
      else if (Array.isArray(parsed.QUIZ)) {
        SUBJECTS.forEach((s) => {
          QUIZ_BY_SUBJECT[s.id] = [];
        });
        QUIZ_BY_SUBJECT[SUBJECTS[0].id] = parsed.QUIZ;
      } else
        SUBJECTS.forEach((s) => {
          QUIZ_BY_SUBJECT[s.id] = [];
        });
      CLASS_LIST = normalizeClassListIds(
        Array.isArray(parsed.CLASS_LIST)
          ? parsed.CLASS_LIST
          : SEED_CLASS_LIST.slice(),
      );
      SCHOOL_LIST = Array.isArray(parsed.SCHOOL_LIST)
        ? parsed.SCHOOL_LIST
        : SEED_SCHOOL_LIST.slice();
      ACTIVE_EMAIL_ID = parsed.ACTIVE_EMAIL_ID || ACTIVE_EMAIL_ID;
      ACTIVE_HOST_ID = parsed.ACTIVE_HOST_ID || ACTIVE_HOST_ID;
      ACTIVE_SUBJECT = SUBJECTS.some((s) => s.id === parsed.ACTIVE_SUBJECT)
        ? parsed.ACTIVE_SUBJECT
        : SUBJECTS[0].id;
      QUIZ = QUIZ_BY_SUBJECT[ACTIVE_SUBJECT];
      return;
    }
  } catch (err) {
    console.error("Không đọc được dữ liệu tạm:", err);
  }
  SUBJECTS.forEach((s) => {
    QUIZ_BY_SUBJECT[s.id] = s.id === SUBJECTS[0].id ? SEED_QUIZ.slice() : [];
  });
  ACTIVE_SUBJECT = SUBJECTS[0].id;
  QUIZ = QUIZ_BY_SUBJECT[ACTIVE_SUBJECT];
  CLASS_LIST = normalizeClassListIds(SEED_CLASS_LIST.slice());
  SCHOOL_LIST = SEED_SCHOOL_LIST.slice();
}
function saveState() {
  try {
    QUIZ_BY_SUBJECT[ACTIVE_SUBJECT] = QUIZ;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        QUIZ_BY_SUBJECT: QUIZ_BY_SUBJECT,
        CLASS_LIST: CLASS_LIST,
        SCHOOL_LIST: SCHOOL_LIST,
        ACTIVE_EMAIL_ID: ACTIVE_EMAIL_ID,
        ACTIVE_HOST_ID: ACTIVE_HOST_ID,
        ACTIVE_SUBJECT: ACTIVE_SUBJECT,
      }),
    );
  } catch (err) {
    console.error("Không lưu được dữ liệu tạm:", err);
  }
}
function escapeHtml(s) {
  return String(s || "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}
function renderAll() {
  document.getElementById("statQuiz").textContent =
    QUIZ.length + " câu hỏi (" + subjectLabel(ACTIVE_SUBJECT) + ")";
  document.getElementById("statClass").textContent =
    CLASS_LIST.length + " học sinh";
  document.getElementById("statSchool").textContent =
    Math.max(0, SCHOOL_LIST.length - 1) + " trường";
  renderTopicList();
  renderSubjectTabs();
}
let subjectListExpanded = false;
function renderSubjectTabs() {
  const box = document.getElementById("subjectTabs");
  if (!box) return;
  const activeSubj =
    SUBJECTS.find((s) => s.id === ACTIVE_SUBJECT) || SUBJECTS[0];
  if (!subjectListExpanded) {
    box.innerHTML = `<label class="subject-list-item active expanded-trigger" data-subject="${activeSubj.id}">\n        <span class="subject-icon">${activeSubj.icon}</span><span>${activeSubj.label}</span>\n        <span class="subject-chevron">▾</span>\n      </label>`;
    box.querySelector(".subject-list-item").onclick = () => {
      subjectListExpanded = true;
      renderSubjectTabs();
    };
  } else {
    box.innerHTML = SUBJECTS.map((s) => {
      const active = s.id === ACTIVE_SUBJECT;
      return `<label class="subject-list-item${active ? " active" : ""}" data-subject="${s.id}">\n          <input type="radio" name="subjectChoice" value="${s.id}"${active ? " checked" : ""}>\n          <span class="subject-icon">${s.icon}</span><span>${s.label}</span>\n        </label>`;
    }).join("");
    box.querySelectorAll(".subject-list-item").forEach((item) => {
      item.querySelector("input[type=radio]").onchange = () => {
        subjectListExpanded = false;
        setActiveSubject(item.dataset.subject);
      };
      item.addEventListener("click", () => {
        if (item.dataset.subject === ACTIVE_SUBJECT) {
          subjectListExpanded = false;
          renderSubjectTabs();
        }
      });
    });
  }
  const badges = document.querySelectorAll(".subjectBadge");
  badges.forEach((b) => (b.textContent = subjectLabel(ACTIVE_SUBJECT)));
}
async function setActiveSubject(id) {
  if (id === ACTIVE_SUBJECT || !SUBJECTS.some((s) => s.id === id)) return;
  ACTIVE_SUBJECT = id;
  QUIZ = QUIZ_BY_SUBJECT[id] || [];
  selectedTopics = null;
  saveState();
  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
  setLog(
    "quizLog",
    "info",
    `Đã chuyển sang môn ${subjectLabel(id)}.` +
      (QUIZ_LOADED_SUBJECTS.has(id)
        ? ""
        : " Đang tải ngân hàng câu hỏi từ Firebase..."),
  );
  if (!QUIZ_LOADED_SUBJECTS.has(id)) await loadQuestionsFromApi(id);
}
function setLog(id, kind, text) {
  const el = document.getElementById(id);
  el.className = "log show" + (kind ? " " + kind : "");
  el.textContent = text;
}
function getQuestionCategory(q) {
  return (q && q.category && String(q.category).trim()) || "Chưa phân loại";
}
function computeTopics() {
  const order = [];
  const counts = new Map();
  QUIZ.forEach((q) => {
    const name = getQuestionCategory(q);
    if (!counts.has(name)) {
      counts.set(name, 0);
      order.push(name);
    }
    counts.set(name, counts.get(name) + 1);
  });
  return order.map((name) => ({ name: name, count: counts.get(name) }));
}
let selectedTopics = null;
function renderTopicList() {
  const box = document.getElementById("topicListBox");
  if (!box) return;
  const topics = computeTopics();
  const currentNames = new Set(topics.map((t) => t.name));
  if (selectedTopics === null) selectedTopics = new Set(currentNames);
  else
    for (const name of Array.from(selectedTopics))
      if (!currentNames.has(name)) selectedTopics.delete(name);
  if (topics.length === 0)
    box.innerHTML =
      '<div class="topic-empty">Ngân hàng câu hỏi đang trống.</div>';
  else {
    box.innerHTML = topics
      .map((t) => {
        const checked = selectedTopics.has(t.name) ? "checked" : "";
        return `<label class="topic-row">\n        <input type="checkbox" class="topicCheckbox" data-topic="${escapeHtml(t.name)}" ${checked}>\n        <span>${escapeHtml(t.name)} (${t.count} câu)</span>\n      </label>`;
      })
      .join("");
    box.querySelectorAll(".topicCheckbox").forEach((cb) => {
      cb.onchange = () => {
        const name = cb.dataset.topic;
        if (cb.checked) selectedTopics.add(name);
        else selectedTopics.delete(name);
        updateTopicPoolHint();
      };
    });
  }
  updateTopicPoolHint();
}
function getSelectedPool() {
  if (!selectedTopics || selectedTopics.size === 0) return QUIZ.slice();
  return QUIZ.filter((q) => selectedTopics.has(getQuestionCategory(q)));
}
function computeSetCount(poolLength, rawCountValue) {
  if (poolLength <= 0) return 0;
  const raw = (rawCountValue || "").trim();
  let n = raw ? parseInt(raw, 10) : poolLength;
  if (!Number.isFinite(n) || n <= 0) n = poolLength;
  if (n >= poolLength) return 1;
  return Math.ceil(poolLength / n);
}
function computeMaxSetsToCreate(numSets) {
  if (numSets <= 0) return 0;
  const el = document.getElementById("topicMaxSetsToCreate");
  const raw = (el ? el.value : "").trim();
  let n = raw ? parseInt(raw, 10) : numSets;
  if (!Number.isFinite(n) || n <= 0) n = numSets;
  return Math.min(n, numSets);
}
function updateTopicPoolHint() {
  const hint = document.getElementById("topicPoolHint");
  if (!hint) return;
  if (QUIZ.length === 0) {
    hint.textContent = "";
    return;
  }
  const noneSelected = !selectedTopics || selectedTopics.size === 0;
  const pool = getSelectedPool();
  const countInput = document.getElementById("topicQuestionCount");
  const numSets = computeSetCount(
    pool.length,
    countInput ? countInput.value : "",
  );
  const maxToCreate = computeMaxSetsToCreate(numSets);
  let setsText;
  if (numSets <= 1) setsText = ` — sẽ tạo 1 bộ.`;
  else if (maxToCreate < numSets)
    setsText = ` — sẽ chia thành ${numSets} bộ, nhưng CHỈ TẠO ${maxToCreate} bộ (theo giới hạn bên dưới).`;
  else setsText = ` — sẽ chia thành ${numSets} bộ.`;
  hint.textContent =
    (noneSelected
      ? `Chưa chọn chủ đề nào — sẽ dùng toàn bộ ngân hàng (${pool.length} câu).`
      : `Chủ đề đã chọn có tổng ${pool.length} câu.`) + setsText;
}
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickQuestionSets() {
  const pool = getSelectedPool();
  if (pool.length === 0)
    throw new Error(
      "Ngân hàng câu hỏi (hoặc chủ đề đã chọn) đang không có câu nào.",
    );
  const countInput = document.getElementById("topicQuestionCount");
  const raw = countInput ? countInput.value.trim() : "";
  let n = raw ? parseInt(raw, 10) : pool.length;
  if (!Number.isFinite(n) || n <= 0) n = pool.length;
  const shuffledPool = shuffleArray(pool);
  if (n >= shuffledPool.length) {
    const set = shuffledPool.slice();
    let dupCount = 0;
    while (set.length < n) {
      const src = shuffledPool[dupCount % shuffledPool.length];
      dupCount++;
      set.push(Object.assign({}, src, { id: `${src.id}_dup${dupCount}` }));
    }
    return [shuffleArray(set)];
  }
  const numSets = Math.ceil(shuffledPool.length / n);
  const sets = [];
  let cursor = 0;
  for (let i = 0; i < numSets; i++) {
    sets.push(shuffledPool.slice(cursor, cursor + n));
    cursor += n;
  }
  const lastSet = sets[sets.length - 1];
  if (lastSet.length < n) {
    const usedIds = new Set(lastSet.map((q) => q.id));
    const candidates = shuffleArray(
      shuffledPool.filter((q) => !usedIds.has(q.id)),
    );
    let idx = 0;
    while (lastSet.length < n && idx < candidates.length) {
      lastSet.push(candidates[idx]);
      usedIds.add(candidates[idx].id);
      idx++;
    }
    let dupCount = 0;
    while (lastSet.length < n) {
      const src = shuffledPool[dupCount % shuffledPool.length];
      dupCount++;
      lastSet.push(Object.assign({}, src, { id: `${src.id}_dup${dupCount}` }));
    }
  }
  return sets.map((s) => shuffleArray(s));
}
const QUIZ_COLLECTION = "quizzes";
const QUIZ_DOC_ID = "ngan-hang-cau-hoi";
function getQuizDocId(subjectId) {
  return subjectId === SUBJECTS[0].id
    ? QUIZ_DOC_ID
    : QUIZ_DOC_ID + "-" + subjectId;
}
async function loadQuestionsFromApi(subjectId) {
  const targetSubject = subjectId || ACTIVE_SUBJECT;
  const docId = getQuizDocId(targetSubject);
  const statusEl = document.getElementById("quizFirebaseStatus");
  if (statusEl && targetSubject === ACTIVE_SUBJECT)
    statusEl.innerHTML = `⏳ Đang tải ngân hàng câu hỏi môn ${subjectLabel(targetSubject)} từ Firebase...`;
  try {
    const doc = await adminLoad(QUIZ_COLLECTION, docId);
    const list = Array.isArray(doc && doc.list) ? doc.list : null;
    if (!list || list.length === 0)
      throw new Error(
        `Chưa có dữ liệu tại collection "${QUIZ_COLLECTION}" / document "${docId}" (thử bấm "📤 Đẩy toàn bộ câu hỏi đang có lên Firebase" để tạo lần đầu).`,
      );
    QUIZ_BY_SUBJECT[targetSubject] = list;
    QUIZ_LOADED_SUBJECTS.add(targetSubject);
    if (targetSubject === ACTIVE_SUBJECT) {
      QUIZ = list;
      saveState();
      selectedTopics = null;
      renderAll();
      if (statusEl)
        statusEl.innerHTML = `✅ Đã tải <b>${QUIZ.length}</b> câu hỏi môn ${subjectLabel(targetSubject)} từ Firebase (nguồn chính).`;
    } else saveState();
  } catch (err) {
    console.error("Không tải được ngân hàng câu hỏi từ Firestore:", err);
    if (statusEl && targetSubject === ACTIVE_SUBJECT)
      statusEl.innerHTML =
        '<span style="color:#b00020">⚠️ Không tải được từ Firebase (' +
        escapeHtml(err.message || String(err)) +
        `), đang tạm dùng bản lưu trong trình duyệt cho môn ${subjectLabel(targetSubject)} (` +
        QUIZ.length +
        " câu hỏi).</span>";
  }
}
async function pushQuestionsToFirestore(questions, docId) {
  const targetDocId = docId || getQuizDocId(ACTIVE_SUBJECT);
  try {
    await adminSave(QUIZ_COLLECTION, { list: questions }, targetDocId);
    return {
      ok: questions.length,
      total: questions.length,
      failList: [],
      docId: targetDocId,
    };
  } catch (err) {
    return {
      ok: 0,
      total: questions.length,
      failList: [err.message],
      docId: targetDocId,
    };
  }
}
function questionToExcelRow(q) {
  let optionsCol = "",
    answerCol = "";
  if (q.type === "single" && Array.isArray(q.options)) {
    optionsCol = q.options.join(" | ");
    answerCol = q.options[q.answer] ?? "";
  } else if (q.type === "multiple" && Array.isArray(q.options)) {
    optionsCol = q.options.join(" | ");
    answerCol = (q.answer || []).map((i) => q.options[i]).join(" | ");
  }
  return {
    STT: q.id,
    "Đưa vào bài (Có/Không)": "Có",
    "Chủ đề": q.category || "",
    "Loại câu hỏi": q.type,
    "Câu hỏi": q.question || "",
    "Lựa chọn (cách nhau bởi |)": optionsCol,
    "Đáp án đúng": answerCol,
    "Giải thích": q.explain || "",
    "Dữ liệu JSON (không sửa/xoá nếu không chắc chắn)": JSON.stringify(q),
  };
}
function exportQuestionsToExcel() {
  const rows = QUIZ.map(questionToExcelRow);
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 50 },
    { wch: 30 },
    { wch: 22 },
    { wch: 40 },
    { wch: 60 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Câu hỏi");
  XLSX.writeFile(workbook, `ngan-hang-cau-hoi-${ACTIVE_SUBJECT}.xlsx`);
}
function buildQuestionFromSimpleRow(row, nextId) {
  const type = String(row["Loại câu hỏi"] || "").trim();
  const question = String(row["Câu hỏi"] || "").trim();
  const optionsRaw = String(row["Lựa chọn (cách nhau bởi |)"] || "").trim();
  const answerRaw = String(row["Đáp án đúng"] || "").trim();
  const explain = String(row["Giải thích"] || "").trim();
  if (type !== "single" && type !== "multiple")
    throw new Error(
      `Loại câu hỏi "${type}" cần cột "Dữ liệu JSON" (không thể tạo mới chỉ từ các cột đơn giản).`,
    );
  if (!question) throw new Error("Thiếu nội dung câu hỏi.");
  const options = optionsRaw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (options.length < 2)
    throw new Error("Cần ít nhất 2 lựa chọn, cách nhau bởi dấu |.");
  let answer;
  if (type === "single") {
    const idx = options.indexOf(answerRaw.trim());
    if (idx === -1)
      throw new Error(
        `Không tìm thấy "${answerRaw}" trong danh sách lựa chọn.`,
      );
    answer = idx;
  } else {
    const answerTexts = answerRaw
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    answer = answerTexts.map((txt) => {
      const idx = options.indexOf(txt);
      if (idx === -1)
        throw new Error(`Không tìm thấy "${txt}" trong danh sách lựa chọn.`);
      return idx;
    });
    if (answer.length === 0)
      throw new Error("Cần ít nhất 1 đáp án đúng, cách nhau bởi dấu |.");
  }
  const stt = Number(row["STT"]);
  const category = String(row["Chủ đề"] || "").trim();
  const q = {
    id: Number.isFinite(stt) && stt > 0 ? stt : nextId,
    type: type,
    question: question,
    options: options,
    answer: answer,
    explain: explain,
  };
  if (category) q.category = category;
  return q;
}
function importQuestionsFromExcel(file) {
  setLog(
    "quizLog",
    "info",
    `Đang đọc file... (sẽ nhập vào ngân hàng câu hỏi môn ${subjectLabel(ACTIVE_SUBJECT)})`,
  );
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const workbook = XLSX.read(new Uint8Array(e.target.result), {
        type: "array",
      });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const newQuestions = [];
      const errors = [];
      let skippedCount = 0;
      let nextId = Math.max(0, ...QUIZ.map((q) => q.id), 0) + 1;
      rows.forEach((row, i) => {
        const activeFlag = String(row["Đưa vào bài (Có/Không)"] || "")
          .trim()
          .toLowerCase();
        if (
          activeFlag === "không" ||
          activeFlag === "khong" ||
          activeFlag === "no"
        ) {
          skippedCount++;
          return;
        }
        const jsonCell = String(
          row["Dữ liệu JSON (không sửa/xoá nếu không chắc chắn)"] || "",
        ).trim();
        try {
          let q;
          if (jsonCell) {
            q = JSON.parse(jsonCell);
            if (!q.type || !q.question)
              throw new Error('Thiếu "type" hoặc "question" trong JSON.');
          } else q = buildQuestionFromSimpleRow(row, nextId++);
          const categoryOverride = String(row["Chủ đề"] || "").trim();
          if (categoryOverride) q.category = categoryOverride;
          newQuestions.push(q);
        } catch (err) {
          errors.push(`Dòng ${i + 2}: ${err.message}`);
        }
      });
      if (newQuestions.length === 0) {
        setLog(
          "quizLog",
          "err",
          "Không đọc được câu hỏi hợp lệ nào.\n" + errors.join("\n"),
        );
        return;
      }
      QUIZ = newQuestions;
      saveState();
      selectedTopics = null;
      renderAll();
      setLog(
        "quizLog",
        "info",
        `Đã cập nhật ${newQuestions.length} câu hỏi vào ngân hàng môn ${subjectLabel(ACTIVE_SUBJECT)} (trình duyệt này). Đang đẩy lên Firebase...`,
      );
      const pushResult = await pushQuestionsToFirestore(newQuestions);
      let msg =
        `Đã cập nhật ${newQuestions.length} câu hỏi vào ngân hàng môn ${subjectLabel(ACTIVE_SUBJECT)}.` +
        (skippedCount > 0
          ? `\n${skippedCount} câu bị bỏ qua vì đánh dấu "Không đưa vào bài".`
          : "") +
        (errors.length
          ? `\n\n${errors.length} dòng lỗi (bị bỏ qua):\n` + errors.join("\n")
          : "") +
        `\n\n🔥 Đã đẩy ${pushResult.ok}/${pushResult.total} câu lên Firebase (document "quizzes/${pushResult.docId}", môn ${subjectLabel(ACTIVE_SUBJECT)}).` +
        `\n\nNgân hàng này (của môn ${subjectLabel(ACTIVE_SUBJECT)}) dùng chung cho cả 2 nút tạo bộ đề ở dưới.`;
      if (pushResult.failList.length)
        msg +=
          `\n⚠️ ${pushResult.failList.length} câu lỗi khi ghi Firebase:\n- ` +
          pushResult.failList.join("\n- ");
      setLog(
        "quizLog",
        errors.length || pushResult.failList.length ? "err" : "ok",
        msg,
      );
      const statusEl = document.getElementById("quizFirebaseStatus");
      if (statusEl && !pushResult.failList.length)
        statusEl.innerHTML =
          "✅ Đã đồng bộ " + pushResult.ok + " câu hỏi lên Firebase.";
    } catch (err) {
      setLog("quizLog", "err", "Không đọc được file Excel: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}
function importQuestionsFromJSON(file) {
  setLog(
    "quizLog",
    "info",
    `Đang đọc file JSON... (sẽ nhập vào ngân hàng câu hỏi môn ${subjectLabel(ACTIVE_SUBJECT)})`,
  );
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      let data;
      try {
        data = JSON.parse(e.target.result);
      } catch (err) {
        throw new Error("File không phải JSON hợp lệ: " + err.message);
      }
      if (!Array.isArray(data))
        throw new Error(
          'File JSON phải là 1 MẢNG các câu hỏi (dạng "[ {...}, {...} ]"), không phải object đơn hay có bọc thêm key khác.',
        );
      const newQuestions = [];
      const errors = [];
      const incompleteNotes = [];
      const usedIds = new Set();
      let nextId =
        Math.max(0, ...data.map((q) => Number(q && q.id) || 0), 0) + 1;
      data.forEach((q, i) => {
        try {
          if (!q || typeof q !== "object" || Array.isArray(q))
            throw new Error("Phần tử không phải object câu hỏi.");
          if (!q.type) throw new Error('Thiếu "type".');
          if (!q.question) throw new Error('Thiếu "question".');
          let id = Number(q.id);
          if (!Number.isFinite(id) || id <= 0 || usedIds.has(id)) id = nextId++;
          usedIds.add(id);
          const finalQ = Object.assign({}, q, { id: id });
          if (finalQ.note)
            incompleteNotes.push(`Câu #${id} (${finalQ.type}): ${finalQ.note}`);
          newQuestions.push(finalQ);
        } catch (err) {
          errors.push(`Phần tử ${i + 1}: ${err.message}`);
        }
      });
      if (newQuestions.length === 0) {
        setLog(
          "quizLog",
          "err",
          "Không đọc được câu hỏi hợp lệ nào trong file JSON.\n" +
            errors.join("\n"),
        );
        return;
      }
      QUIZ = newQuestions;
      saveState();
      selectedTopics = null;
      renderAll();
      setLog(
        "quizLog",
        "info",
        `Đã cập nhật ${newQuestions.length} câu hỏi vào ngân hàng môn ${subjectLabel(ACTIVE_SUBJECT)} (trình duyệt này). Đang đẩy lên Firebase...`,
      );
      const pushResult = await pushQuestionsToFirestore(newQuestions);
      let msg =
        `Đã cập nhật ${newQuestions.length} câu hỏi vào ngân hàng môn ${subjectLabel(ACTIVE_SUBJECT)} từ file JSON.` +
        (errors.length
          ? `\n\n${errors.length} phần tử lỗi (bị bỏ qua):\n` +
            errors.join("\n")
          : "") +
        `\n\n🔥 Đã đẩy ${pushResult.ok}/${pushResult.total} câu lên Firebase (document "quizzes/${pushResult.docId}", môn ${subjectLabel(ACTIVE_SUBJECT)}).` +
        `\n\nNgân hàng này (của môn ${subjectLabel(ACTIVE_SUBJECT)}) dùng chung cho cả 2 nút tạo bộ đề ở dưới.`;
      if (pushResult.failList.length)
        msg +=
          `\n⚠️ ${pushResult.failList.length} câu lỗi khi ghi Firebase:\n- ` +
          pushResult.failList.join("\n- ");
      if (incompleteNotes.length)
        msg +=
          `\n\n⚠️ ${incompleteNotes.length} câu còn THIẾU DỮ LIỆU (có ghi chú "note" cần bổ sung):\n- ` +
          incompleteNotes.join("\n- ");
      setLog(
        "quizLog",
        errors.length || pushResult.failList.length ? "err" : "ok",
        msg,
      );
      const statusEl = document.getElementById("quizFirebaseStatus");
      if (statusEl && !pushResult.failList.length)
        statusEl.innerHTML =
          "✅ Đã đồng bộ " + pushResult.ok + " câu hỏi lên Firebase.";
    } catch (err) {
      setLog("quizLog", "err", "Không đọc được file JSON: " + err.message);
    }
  };
  reader.readAsText(file, "utf-8");
}
const SCHOOL_OTHER_VALUE = "Khác";
function classListRowToExcel(row, id) {
  return {
    ID:
      row.id !== undefined && row.id !== null && String(row.id).trim() !== ""
        ? row.id
        : id,
    "Họ và tên": row.name || "",
    Trường: row.school || "",
    Lớp: row.class || "",
  };
}
const RESERVED_SHEET_NAMES = ["Danh sách trường"];
const NO_SCHOOL_LABEL = "Chưa rõ trường";
function sanitizeSheetName(name, usedNames) {
  let base = String(name || NO_SCHOOL_LABEL).trim() || NO_SCHOOL_LABEL;
  base = base.replace(/[:\\\/\?\*\[\]]/g, " ").trim();
  if (!base) base = NO_SCHOOL_LABEL;
  base = base.slice(0, 31);
  let finalName = base;
  let n = 2;
  while (
    usedNames.has(finalName.toLowerCase()) ||
    RESERVED_SHEET_NAMES.some(
      (r) => r.toLowerCase() === finalName.toLowerCase(),
    )
  ) {
    const suffix = ` (${n})`;
    finalName = base.slice(0, 31 - suffix.length) + suffix;
    n++;
  }
  usedNames.add(finalName.toLowerCase());
  return finalName;
}
function exportMergedListToExcel() {
  const sourceRows = CLASS_LIST.length
    ? CLASS_LIST
    : [{ name: "Nguyễn Văn An", class: "12A1", school: "THPT ABC" }];
  const rowsWithId = sourceRows.map((row, idx) => ({ row: row, id: idx + 1 }));
  const schoolOrder = SCHOOL_LIST.filter((n) => n !== SCHOOL_OTHER_VALUE);
  const groups = new Map();
  rowsWithId.forEach(({ row: row, id: id }) => {
    const key = (row.school || "").trim() || NO_SCHOOL_LABEL;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(classListRowToExcel(row, id));
  });
  const orderedKeys = [
    ...schoolOrder.filter((name) => groups.has(name)),
    ...[...groups.keys()].filter((k) => !schoolOrder.includes(k)),
  ];
  const workbook = XLSX.utils.book_new();
  const usedSheetNames = new Set();
  orderedKeys.forEach((key) => {
    const rows = groups.get(key);
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!cols"] = [{ wch: 6 }, { wch: 28 }, { wch: 28 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      sanitizeSheetName(key, usedSheetNames),
    );
  });
  const schoolRows = (schoolOrder.length ? schoolOrder : ["THPT ABC"]).map(
    (name, idx) => ({ ID: idx + 1, "Tên trường (bắt buộc)": name }),
  );
  const schoolSheet = XLSX.utils.json_to_sheet(schoolRows);
  schoolSheet["!cols"] = [{ wch: 6 }, { wch: 34 }];
  XLSX.utils.book_append_sheet(workbook, schoolSheet, "Danh sách trường");
  XLSX.writeFile(workbook, "danh-sach-hoc-sinh-va-truong.xlsx");
}
function importMergedListFromExcel(file) {
  setLog(
    "classListLog",
    "info",
    "Đang đọc file danh sách học sinh — bắt buộc theo vị trí cột A-D: A=ID, B=Họ và tên, C=Trường, D=Lớp...",
  );
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const workbook = XLSX.read(new Uint8Array(e.target.result), {
        type: "array",
      });
      let schoolMsg = "";
      if (workbook.SheetNames.includes("Danh sách trường")) {
        const sheet = workbook.Sheets["Danh sách trường"];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          raw: false,
        });
        const seen = new Set();
        const list = [];
        const errors = [];
        rows.slice(1).forEach((row, i) => {
          const name = String(row[1] ?? row[0] ?? "").trim();
          if (!name) return;
          if (name === SCHOOL_OTHER_VALUE) {
            errors.push(
              `[Danh sách trường] Dòng ${i + 2}: "${SCHOOL_OTHER_VALUE}" là mục cố định, không cần ghi trong Excel.`,
            );
            return;
          }
          const key = name.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          list.push(name);
        });
        if (list.length) {
          list.push(SCHOOL_OTHER_VALUE);
          SCHOOL_LIST = list;
          schoolMsg =
            `Đã cập nhật ${list.length - 1} trường.` +
            (errors.length
              ? `\n${errors.length} dòng lỗi trường (bị bỏ qua):\n` +
                errors.join("\n")
              : "");
        } else {
          schoolMsg =
            `Không đọc được trường hợp lệ nào trong sheet "Danh sách trường".` +
            (errors.length ? `\n` + errors.join("\n") : "");
        }
      }
      function normalizeIdText(raw) {
        let s = String(raw ?? "").trim();
        if (!s) return "";
        if (/^-?\d+\.0+$/.test(s)) s = s.slice(0, s.indexOf("."));
        if (/^\d+$/.test(s)) {
          s = s.replace(/^0+(?=\d)/, "");
        }
        return s;
      }
      const prevIdByKey = new Map();
      const usedIdsByScope = new Map();
      const maxNumericIdByScope = new Map();
      const scopeKeyOf = (school, klass) =>
        normalizeNameForCompare(school || "") +
        "||" +
        normalizeNameForCompare(klass || "");
      const getUsedIdsSet = (scopeKey) => {
        if (!usedIdsByScope.has(scopeKey))
          usedIdsByScope.set(scopeKey, new Set());
        return usedIdsByScope.get(scopeKey);
      };
      CLASS_LIST.forEach((r) => {
        const key =
          normalizeNameForCompare(r.name) +
          "|" +
          normalizeNameForCompare(r.class) +
          "|" +
          normalizeNameForCompare(r.school);
        const id = normalizeIdText(r.id);
        const scopeKey = scopeKeyOf(r.school, r.class);
        if (id) {
          prevIdByKey.set(key, id);
          getUsedIdsSet(scopeKey).add(id.toLowerCase());
        }
        const n = Number(id);
        if (Number.isFinite(n) && n > (maxNumericIdByScope.get(scopeKey) || 0))
          maxNumericIdByScope.set(scopeKey, n);
      });
      const nextAutoIdByScope = new Map();
      const getNextAutoId = (scopeKey) => {
        if (!nextAutoIdByScope.has(scopeKey))
          nextAutoIdByScope.set(
            scopeKey,
            (maxNumericIdByScope.get(scopeKey) || 0) + 1,
          );
        return nextAutoIdByScope.get(scopeKey);
      };
      const setNextAutoId = (scopeKey, v) => nextAutoIdByScope.set(scopeKey, v);
      const list = [];
      const errors = [];
      const seen = new Set();
      workbook.SheetNames.filter((n) => n !== "Danh sách trường").forEach(
        (sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: "",
            raw: false,
          });
          const sheetDefault = String(sheetName || "").trim();
          rows.slice(1).forEach((row, i) => {
            const id = normalizeIdText(row[0]);
            const name = String(row[1] ?? "").trim();
            let school = String(row[2] ?? "").trim();
            let klass = String(row[3] ?? "").trim();
            if (!school) school = sheetDefault;
            if (!id && !name && !school && !klass) return;
            if (!name) {
              errors.push(
                `[${sheetName}] Dòng ${i + 2}: thiếu Họ và tên ở cột B.`,
              );
              return;
            }
            if (!school) {
              errors.push(
                `[${sheetName}] Dòng ${i + 2}: thiếu Trường ở cột C.`,
              );
              return;
            }
            if (!klass) {
              errors.push(`[${sheetName}] Dòng ${i + 2}: thiếu Lớp ở cột D.`);
              return;
            }
            const key =
              normalizeNameForCompare(name) +
              "|" +
              normalizeNameForCompare(klass) +
              "|" +
              normalizeNameForCompare(school);
            if (seen.has(key)) return;
            seen.add(key);
            const scopeKey = scopeKeyOf(school, klass);
            const usedIds = getUsedIdsSet(scopeKey);
            let finalId = id || String(prevIdByKey.get(key) || "").trim();
            if (!finalId) {
              let nextAutoId = getNextAutoId(scopeKey);
              while (usedIds.has(String(nextAutoId).toLowerCase()))
                nextAutoId++;
              finalId = String(nextAutoId);
              setNextAutoId(scopeKey, nextAutoId + 1);
            }
            const idKey = finalId.toLowerCase();
            if (usedIds.has(idKey) && !prevIdByKey.has(key)) {
              errors.push(
                `[${sheetName}] Dòng ${i + 2}: ID "${finalId}" đang trùng ở danh sách (trong cùng lớp "${klass}", trường "${school}"); hệ thống vẫn giữ nguyên ID ở cột A.`,
              );
            }
            usedIds.add(idKey);
            list.push({
              id: finalId,
              name: name,
              class: klass,
              school: school,
            });
          });
        },
      );
      let classMsg = "";
      let classHasData = false;
      if (list.length) {
        CLASS_LIST = normalizeClassListIds(list);
        classHasData = true;
        classMsg =
          `Đã cập nhật danh sách ${list.length} học sinh.\n✅ Đã đọc đúng theo cột A=ID, B=Họ và tên, C=Trường, D=Lớp.\n✅ ID được giữ nguyên và nhúng vào file bài kiểm tra/ôn luyện khi tạo mới.` +
          (schoolMsg ? `\n${schoolMsg}` : "") +
          (errors.length
            ? `\n${errors.length} dòng cảnh báo/lỗi:\n` + errors.join("\n")
            : "");
      } else {
        classMsg =
          `Không đọc được học sinh hợp lệ nào.` +
          (schoolMsg ? `\n${schoolMsg}` : "") +
          (errors.length
            ? `\n${errors.length} dòng lỗi:\n` + errors.join("\n")
            : "");
      }
      saveState();
      renderAll();
      setLog(
        "classListLog",
        classHasData ? (errors.length ? "err" : "ok") : "err",
        classMsg,
      );
    } catch (err) {
      setLog(
        "classListLog",
        "err",
        "Không đọc được file Excel: " + err.message,
      );
    }
  };
  reader.readAsArrayBuffer(file);
}
async function b64GzipToUtf8(b64) {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  const buf = await new Response(stream).arrayBuffer();
  return new TextDecoder("utf-8").decode(buf);
}
function buildUpdatedHtml(
  template,
  quiz,
  classList,
  schoolList,
  levelLabel,
  topicLabel,
  examDurationMinutes,
) {
  let html = template;
  {
    const escLabel = (s) =>
      String(s || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
    html = html.replace(
      /const\s+QUIZ_LEVEL_LABEL\s*=\s*"[^"]*";/,
      'const QUIZ_LEVEL_LABEL = "' + escLabel(levelLabel) + '";',
    );
    html = html.replace(
      /const\s+QUIZ_TOPIC_LABEL\s*=\s*"[^"]*";/,
      'const QUIZ_TOPIC_LABEL = "' + escLabel(topicLabel) + '";',
    );
  }
  if (examDurationMinutes != null) {
    const n = Number(examDurationMinutes);
    if (Number.isFinite(n) && n > 0)
      html = html.replace(
        /const\s+EXAM_DURATION_MINUTES\s*=\s*[0-9.]+;/,
        "const EXAM_DURATION_MINUTES = " + n + ";",
      );
  }
  {
    const startMarker = "const QUIZ = [";
    const startIdx = html.indexOf(startMarker);
    const endIdx =
      startIdx !== -1
        ? html.indexOf("\n];", startIdx + startMarker.length)
        : -1;
    if (startIdx === -1 || endIdx === -1)
      throw new Error("Không tìm thấy vị trí dữ liệu câu hỏi trong khuôn mẫu.");
    const innerText =
      "\n" + quiz.map((q) => JSON.stringify(q, null, 2)).join(",\n") + "\n";
    html =
      html.slice(0, startIdx + startMarker.length) +
      innerText +
      html.slice(endIdx);
  }
  {
    const startMarker = "const SCHOOL_LIST = [";
    const startIdx = html.indexOf(startMarker);
    const endIdx =
      startIdx !== -1
        ? html.indexOf("\n];", startIdx + startMarker.length)
        : -1;
    if (startIdx === -1 || endIdx === -1)
      throw new Error(
        "Không tìm thấy vị trí danh sách trường trong khuôn mẫu.",
      );
    const innerText =
      "\n" + schoolList.map((name) => JSON.stringify(name)).join(",\n") + "\n";
    html =
      html.slice(0, startIdx + startMarker.length) +
      innerText +
      html.slice(endIdx);
  }
  {
    const startMarker = "const CLASS_LIST = [";
    const startIdx = html.indexOf(startMarker);
    const endIdx =
      startIdx !== -1
        ? html.indexOf("\n];", startIdx + startMarker.length)
        : -1;
    if (startIdx === -1 || endIdx === -1)
      throw new Error(
        "Không tìm thấy vị trí danh sách học sinh trong khuôn mẫu.",
      );
    const normalizedClassList = normalizeClassListIds(classList || []);
    const innerText = normalizedClassList.length
      ? "\n" +
        normalizedClassList.map((row) => JSON.stringify(row)).join(",\n") +
        "\n"
      : "\n";
    html =
      html.slice(0, startIdx + startMarker.length) +
      innerText +
      html.slice(endIdx);
  }
  if (WEB_APP_URL) {
    const safeUrl = WEB_APP_URL.replace(/"/g, '\\"');
    html = html.replace(
      /webAppUrl\s*:\s*(["'`]).*?\1/,
      'webAppUrl: "' + safeUrl + '"',
    );
    html = html.replace(
      /(const\s+CLASS_SHEET_CONFIG\s*=\s*\{\s*\n\s*enabled\s*:\s*)(true|false)/,
      "$1true",
    );
  }
  return html;
}
function removeAdminUiFromHtml(html) {
  let out = html;
  const linkMarker =
    '<button class="admin-link" id="adminLink">⚙️ Quản lý ngân hàng câu hỏi (Excel)</button>';
  out = out.replace(linkMarker, "");
  const panelStart = out.indexOf('<div id="adminPanel"');
  const layoutMarker = '<div class="layout" id="quizLayout"';
  const layoutIdx = out.indexOf(layoutMarker, panelStart);
  if (panelStart !== -1 && layoutIdx !== -1)
    out = out.slice(0, panelStart) + out.slice(layoutIdx);
  return out;
}
let QUESTION_IMAGES = [];
let QUESTION_IMAGE_LIST_LIMIT = 5;
let SHARED_IMAGE_LIST_LIMIT = 5;
const IMAGE_LIST_PAGE_SIZE = 5;
let questionImageSeq = 1;
let SHARED_QUESTION_IMAGES = [];
const QIMG_DB_NAME = "questionImagesDB";
const QIMG_DB_STORE = "images";
let qimgDbPromise = null;
function openQuestionImagesDB() {
  if (qimgDbPromise) return qimgDbPromise;
  qimgDbPromise = new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const req = indexedDB.open(QIMG_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(QIMG_DB_STORE))
        db.createObjectStore(QIMG_DB_STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      console.warn("Không mở được IndexedDB ảnh câu hỏi:", req.error);
      resolve(null);
    };
  });
  return qimgDbPromise;
}
async function qimgDbGetAll() {
  const db = await openQuestionImagesDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(QIMG_DB_STORE, "readonly");
      const req = tx.objectStore(QIMG_DB_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => {
        console.warn("Lỗi đọc IndexedDB ảnh câu hỏi:", req.error);
        resolve([]);
      };
    } catch (err) {
      console.warn("Lỗi đọc IndexedDB ảnh câu hỏi:", err);
      resolve([]);
    }
  });
}
async function qimgDbPut(img) {
  const db = await openQuestionImagesDB();
  if (!db) return;
  try {
    const tx = db.transaction(QIMG_DB_STORE, "readwrite");
    tx.objectStore(QIMG_DB_STORE).put(img);
  } catch (err) {
    console.warn("Lỗi ghi IndexedDB ảnh câu hỏi:", err);
  }
}
async function qimgDbDelete(id) {
  const db = await openQuestionImagesDB();
  if (!db) return;
  try {
    const tx = db.transaction(QIMG_DB_STORE, "readwrite");
    tx.objectStore(QIMG_DB_STORE).delete(id);
  } catch (err) {
    console.warn("Lỗi xoá IndexedDB ảnh câu hỏi:", err);
  }
}
async function qimgDbClear() {
  const db = await openQuestionImagesDB();
  if (!db) return;
  try {
    const tx = db.transaction(QIMG_DB_STORE, "readwrite");
    tx.objectStore(QIMG_DB_STORE).clear();
  } catch (err) {
    console.warn("Lỗi xoá toàn bộ IndexedDB ảnh câu hỏi:", err);
  }
}
async function loadQuestionImagesFromIndexedDB() {
  try {
    const rows = await qimgDbGetAll();
    if (rows.length) {
      QUESTION_IMAGES = rows.sort((a, b) => a.id - b.id);
      questionImageSeq = Math.max(0, ...QUESTION_IMAGES.map((i) => i.id)) + 1;
      renderQuestionImageList();
    }
  } catch (err) {
    console.warn("Không nạp được ảnh câu hỏi đã lưu trước đó:", err);
  }
}
async function loadSharedQuestionImagesRegistry() {
  try {
    const rows = await adminLoad("questionImages");
    SHARED_QUESTION_IMAGES = Array.isArray(rows) ? rows : [];
    renderQuestionImageList();
  } catch (err) {
    console.warn("Không tải được danh sách ảnh dùng chung (Firestore):", err);
  }
}
function sanitizeQuestionImagePath(rawName) {
  const base = String(rawName || "anh").replace(/\.[^.]+$/, "");
  const cleaned =
    base
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/^_+|_+$/g, "") || "anh";
  return cleaned;
}
function questionImagePathToDocId(path) {
  return String(path || "").replace(/[^a-zA-Z0-9._-]/g, "__");
}
function extensionFromMime(mime) {
  const map = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  return map[mime] || "png";
}
function formatBytes(n) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const commaIdx = dataUrl.indexOf(",");
      resolve(commaIdx === -1 ? dataUrl : dataUrl.slice(commaIdx + 1));
    };
    reader.onerror = () =>
      reject(reader.error || new Error("Không đọc được file."));
    reader.readAsDataURL(file);
  });
}
function makeThumbnailBase64(dataUrl, maxDim) {
  return new Promise((resolve) => {
    try {
      const imgEl = new Image();
      imgEl.onload = () => {
        const scale = Math.min(
          1,
          maxDim / Math.max(imgEl.width || maxDim, imgEl.height || maxDim),
        );
        const w = Math.max(1, Math.round((imgEl.width || maxDim) * scale));
        const h = Math.max(1, Math.round((imgEl.height || maxDim) * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(imgEl, 0, 0, w, h);
        const thumbDataUrl = canvas.toDataURL("image/jpeg", 0.55);
        resolve(thumbDataUrl.split(",")[1] || "");
      };
      imgEl.onerror = () => resolve("");
      imgEl.src = dataUrl;
    } catch (err) {
      resolve("");
    }
  });
}
function getTargetHostIdsForImageUpload() {
  const shareAllEl = document.getElementById("shareImageAllHosts");
  const shareAll = shareAllEl ? shareAllEl.checked : true;
  if (shareAll) return HOST_LIST.map((h) => h.id);
  return [ACTIVE_HOST_ID];
}
async function deployImageToSingleHost(hostId, img) {
  await callAdminApi("deploy-site", {
    hostId: hostId,
    images: [{ path: img.path, base64: img.base64 }],
  });
}
let _imageUploadQueue = Promise.resolve();
function uploadQuestionImageEverywhere(img) {
  const run = () => uploadQuestionImageEverywhereInner(img);
  const result = _imageUploadQueue.then(run, run);
  _imageUploadQueue = result.catch(() => {});
  return result;
}
async function uploadQuestionImageEverywhereInner(img) {
  const hostIds = getTargetHostIdsForImageUpload();
  img.uploadState = "uploading";
  img.uploadedHosts = Array.isArray(img.uploadedHosts) ? img.uploadedHosts : [];
  img.uploadError = "";
  renderQuestionImageList();
  try {
    await HOST_SYNC_PROMISE;
  } catch (err) {}
  const pendingHostIds = hostIds.filter(
    (hostId) => !img.uploadedHosts.includes(hostId),
  );
  const uploadErrors = [];
  await Promise.all(
    pendingHostIds.map(async (hostId) => {
      try {
        await deployImageToSingleHost(hostId, img);
        img.uploadedHosts.push(hostId);
      } catch (err) {
        try {
          await new Promise((r) => setTimeout(r, 1200));
          await deployImageToSingleHost(hostId, img);
          img.uploadedHosts.push(hostId);
        } catch (err2) {
          uploadErrors.push(`${hostId}: ${err2.message}`);
        }
      }
      renderQuestionImageList();
    }),
  );
  if (uploadErrors.length)
    img.uploadError =
      (img.uploadError ? img.uploadError + "; " : "") + uploadErrors.join("; ");
  img.uploadState =
    img.uploadedHosts.length === hostIds.length
      ? "done"
      : img.uploadedHosts.length > 0
        ? "partial"
        : "error";
  qimgDbPut(img);
  if (img.uploadedHosts.length && !img.autoCopiedOnce) {
    img.autoCopiedOnce = true;
    copyTextToClipboard(
      buildQuestionImageSnippet(img.path),
      `✅ Đã đẩy ảnh "${img.fileName}" lên site và TỰ ĐỘNG copy sẵn thẻ ảnh vào clipboard — giờ chỉ cần vào Excel, bấm Ctrl+V vào ô "Câu hỏi" là xong.`,
    );
  }
  if (img.uploadedHosts.length)
    try {
      const thumb = await makeThumbnailBase64(
        `data:${img.mime};base64,${img.base64}`,
        64,
      );
      await adminSave(
        "questionImages",
        {
          path: img.path,
          fileName: img.fileName,
          mime: img.mime,
          sizeLabel: img.sizeLabel,
          hostIds: img.uploadedHosts,
          thumb: thumb,
          updatedAt: Date.now(),
        },
        questionImagePathToDocId(img.path),
      );
      loadSharedQuestionImagesRegistry();
    } catch (err) {
      console.warn("Không lưu được registry ảnh dùng chung (Firestore):", err);
    }
  renderQuestionImageList();
}
function replaceExistingQuestionImageByPath(path) {
  const dupes = QUESTION_IMAGES.filter((i) => i.path === path);
  if (!dupes.length) return;
  QUESTION_IMAGES = QUESTION_IMAGES.filter((i) => i.path !== path);
  dupes.forEach((d) => qimgDbDelete(d.id));
}
async function handleQuestionImageFiles(fileList) {
  const files = Array.from(fileList || []).filter(
    (f) => f && f.type && f.type.startsWith("image/"),
  );
  if (!files.length) return;
  for (const file of files)
    try {
      const base64 = await readFileAsBase64(file);
      const ext = extensionFromMime(file.type);
      const path = "image/" + sanitizeQuestionImagePath(file.name) + "." + ext;
      replaceExistingQuestionImageByPath(path);
      const img = {
        id: questionImageSeq++,
        path: path,
        base64: base64,
        mime: file.type || "image/png",
        fileName: file.name,
        sizeLabel: formatBytes(file.size),
        uploadState: "pending",
        uploadedHosts: [],
        uploadError: "",
        autoCopiedOnce: false,
      };
      QUESTION_IMAGES.push(img);
      qimgDbPut(img);
      renderQuestionImageList();
      uploadQuestionImageEverywhere(img);
    } catch (err) {
      setLog(
        "downloadLog",
        "err",
        `Không đọc được ảnh "${file.name}": ${err.message}`,
      );
    }
}
function retryQuestionImageUpload(id) {
  const img = QUESTION_IMAGES.find((i) => i.id === id);
  if (!img) return;
  uploadQuestionImageEverywhere(img);
}
async function deleteQuestionImageFromHosts(path, hostIds) {
  const targets = Array.isArray(hostIds) && hostIds.length ? hostIds : [];
  const errors = [];
  for (const hostId of targets) {
    try {
      await callAdminApi("deploy-site", {
        hostId: hostId,
        deleteImagePaths: [path],
      });
    } catch (err) {
      errors.push(`${hostId}: ${err.message}`);
    }
  }
  return { ok: errors.length === 0, errors: errors };
}
async function removeQuestionImage(id) {
  const img = QUESTION_IMAGES.find((i) => i.id === id);
  if (!img) return;
  const hostIds = Array.isArray(img.uploadedHosts) ? img.uploadedHosts : [];
  if (hostIds.length) {
    if (
      !confirm(
        `Xoá hẳn ảnh "${img.fileName}" khỏi ${hostIds.length} host (GitHub) và khỏi danh sách ảnh dùng chung? Không thể hoàn tác.`,
      )
    )
      return;
    img.uploadState = "deleting";
    renderQuestionImageList();
    const result = await deleteQuestionImageFromHosts(img.path, hostIds);
    if (!result.ok) {
      img.uploadState = "error";
      img.uploadError = "Lỗi khi xoá trên host: " + result.errors.join("; ");
      renderQuestionImageList();
      setLog(
        "downloadLog",
        "err",
        `⚠️ Không xoá được hết ảnh "${img.fileName}" trên host:\n` +
          result.errors.join("\n") +
          `\n\nẢnh vẫn còn trong danh sách để bạn thử lại (bấm 🗑️ lần nữa).`,
      );
      return;
    }
    setLog(
      "downloadLog",
      "ok",
      `✅ Đã xoá ảnh "${img.fileName}" khỏi ${hostIds.length} host và khỏi danh sách ảnh dùng chung.`,
    );
  }
  QUESTION_IMAGES = QUESTION_IMAGES.filter((i) => i.id !== id);
  qimgDbDelete(id);
  renderQuestionImageList();
  loadSharedQuestionImagesRegistry();
}
function clearQuestionImages() {
  if (
    QUESTION_IMAGES.length &&
    !confirm(
      "Xoá " +
        QUESTION_IMAGES.length +
        " ảnh khỏi danh sách trên MÁY NÀY? (Ảnh đã đẩy lên GitHub/Firestore sẽ KHÔNG bị xoá khỏi site, chỉ xoá khỏi danh sách hiển thị cục bộ.)",
    )
  )
    return;
  QUESTION_IMAGES = [];
  qimgDbClear();
  renderQuestionImageList();
}
function updateQuestionImagePath(id, newPath) {
  const img = QUESTION_IMAGES.find((i) => i.id === id);
  if (!img) return;
  const trimmed = String(newPath || "")
    .trim()
    .replace(/^\/+/, "");
  const finalPath = trimmed.toLowerCase().startsWith("image/")
    ? trimmed
    : "image/" + trimmed.replace(/^image\//i, "");
  const dupes = QUESTION_IMAGES.filter(
    (i) => i.id !== id && i.path === finalPath,
  );
  if (dupes.length) {
    QUESTION_IMAGES = QUESTION_IMAGES.filter(
      (i) => i.id === id || i.path !== finalPath,
    );
    dupes.forEach((d) => qimgDbDelete(d.id));
  }
  img.path = finalPath;
  qimgDbPut(img);
  uploadQuestionImageEverywhere(img);
}
function buildQuestionImageSnippet(path) {
  return `<img src="${path}" class="q-pre-image">`;
}
function copyTextToClipboard(text, successMsg) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      setLog("downloadLog", "ok", successMsg);
    })
    .catch(() => {
      setLog(
        "downloadLog",
        "err",
        `Không tự copy được, bạn tự bôi đen & copy đoạn này:\n${text}`,
      );
    });
}
function questionImageUploadBadge(img) {
  const hostCount = HOST_LIST.length || 1;
  if (img.uploadState === "uploading")
    return '<span style="color:#8a6d00;">⏳ Đang đẩy lên GitHub...</span>';
  if (img.uploadState === "done")
    return `<span style="color:#1f9d55;">✅ Đã lên ${img.uploadedHosts.length}/${hostCount} host</span>`;
  if (img.uploadState === "partial")
    return `<span style="color:#b00020;" title="${escapeHtml(img.uploadError)}">⚠️ Mới lên ${img.uploadedHosts.length}/${hostCount} host, còn lỗi</span>`;
  if (img.uploadState === "error")
    return `<span style="color:#b00020;" title="${escapeHtml(img.uploadError)}">❌ Chưa lên được host nào</span>`;
  return '<span style="color:var(--text-mute);">Chưa đẩy lên</span>';
}
function renderQuestionImageList() {
  const box = document.getElementById("questionImageList");
  const sharedBox = document.getElementById("sharedQuestionImageList");
  const countEl = document.getElementById("questionImageCount");
  if (!box) return;
  if (countEl)
    countEl.textContent = QUESTION_IMAGES.length
      ? `${QUESTION_IMAGES.length} ảnh vừa chọn trên máy này.`
      : "Chưa chọn ảnh nào trên máy này.";
  box.innerHTML =
    QUESTION_IMAGES.slice(0, QUESTION_IMAGE_LIST_LIMIT)
      .map(
        (img) =>
          `\n    <div style="display:flex;align-items:center;gap:10px;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);">\n      <img src="data:${img.mime};base64,${img.base64}" style="width:52px;height:52px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;">\n      <div style="flex:1;min-width:0;">\n        <div style="font-size:12.5px;color:var(--text-mute);margin-bottom:4px;">${escapeHtml(img.fileName)} · ${img.sizeLabel} · ${questionImageUploadBadge(img)}</div>\n        ${(img.uploadState === "partial" || img.uploadState === "error") && img.uploadError ? `<div style="font-size:11.5px;color:#b00020;margin-bottom:4px;word-break:break-word;">${escapeHtml(img.uploadError)}</div>` : ""}\n        <input type="text" value="${escapeHtml(img.path)}" data-img-id="${img.id}" class="question-image-path-input"\n          style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-size:13px;font-family:monospace;">\n      </div>\n      ${img.uploadState === "partial" || img.uploadState === "error" ? `<button type="button" class="btn btn-ghost question-image-retry-btn" data-img-id="${img.id}" style="flex-shrink:0;" title="Đẩy lại lên (các) host còn lỗi">🔄 Thử lại</button>` : ""}\n      <button type="button" class="btn btn-ghost question-image-copy-btn" data-img-id="${img.id}" style="flex-shrink:0;" title="Copy lại thẻ ảnh để dán vào Excel">📋 Copy</button>\n      <button type="button" class="btn btn-ghost question-image-remove-btn" data-img-id="${img.id}" style="flex-shrink:0;">🗑️</button>\n    </div>\n  `,
      )
      .join("") +
    (QUESTION_IMAGES.length > QUESTION_IMAGE_LIST_LIMIT ||
    QUESTION_IMAGE_LIST_LIMIT > IMAGE_LIST_PAGE_SIZE
      ? `<div style="text-align:center;margin-top:8px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">` +
        (QUESTION_IMAGES.length > QUESTION_IMAGE_LIST_LIMIT
          ? `<button type="button" id="questionImageShowMoreBtn" class="btn btn-ghost">Xem thêm (còn ${QUESTION_IMAGES.length - QUESTION_IMAGE_LIST_LIMIT})</button>`
          : "") +
        (QUESTION_IMAGE_LIST_LIMIT > IMAGE_LIST_PAGE_SIZE
          ? `<button type="button" id="questionImageShowLessBtn" class="btn btn-ghost">🔼 Thu gọn lại</button>`
          : "") +
        `</div>`
      : "");
  const questionImageShowMoreBtn = document.getElementById(
    "questionImageShowMoreBtn",
  );
  if (questionImageShowMoreBtn)
    questionImageShowMoreBtn.onclick = () => {
      QUESTION_IMAGE_LIST_LIMIT += IMAGE_LIST_PAGE_SIZE;
      renderQuestionImageList();
    };
  const questionImageShowLessBtn = document.getElementById(
    "questionImageShowLessBtn",
  );
  if (questionImageShowLessBtn)
    questionImageShowLessBtn.onclick = () => {
      QUESTION_IMAGE_LIST_LIMIT = IMAGE_LIST_PAGE_SIZE;
      renderQuestionImageList();
    };
  box.querySelectorAll(".question-image-path-input").forEach((input) => {
    input.onchange = () =>
      updateQuestionImagePath(Number(input.dataset.imgId), input.value);
  });
  box.querySelectorAll(".question-image-copy-btn").forEach((btn) => {
    btn.onclick = () => {
      const img = QUESTION_IMAGES.find(
        (i) => i.id === Number(btn.dataset.imgId),
      );
      if (!img) return;
      copyTextToClipboard(
        buildQuestionImageSnippet(img.path),
        `✅ Đã copy thẻ ảnh "${img.fileName}" — dán (Ctrl+V) vào ô "Câu hỏi" trong Excel.`,
      );
    };
  });
  box.querySelectorAll(".question-image-remove-btn").forEach((btn) => {
    btn.onclick = () => removeQuestionImage(Number(btn.dataset.imgId));
  });
  box.querySelectorAll(".question-image-retry-btn").forEach((btn) => {
    btn.onclick = () => retryQuestionImageUpload(Number(btn.dataset.imgId));
  });
  if (sharedBox)
    if (!SHARED_QUESTION_IMAGES.length)
      sharedBox.innerHTML =
        '<div class="hint" style="margin:0;">Chưa có ảnh dùng chung nào trong hệ thống.</div>';
    else {
      sharedBox.innerHTML =
        SHARED_QUESTION_IMAGES.slice()
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
          .slice(0, SHARED_IMAGE_LIST_LIMIT)
          .map(
            (row) =>
              `\n          <div style="display:flex;align-items:center;gap:10px;padding:6px 8px;border:1px dashed var(--border);border-radius:8px;">\n            ${row.thumb ? `<img src="data:image/jpeg;base64,${row.thumb}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0;">` : ""}\n            <div style="flex:1;min-width:0;">\n              <div style="font-family:monospace;font-size:12.5px;">${escapeHtml(row.path || row.id)}</div>\n              <div class="hint" style="margin:0;">${escapeHtml(row.fileName || "")} · đã lên ${(row.hostIds || []).length} host</div>\n            </div>\n            <button type="button" class="btn btn-ghost copy-shared-image-path-btn" data-path="${escapeHtml(row.path || row.id)}" style="flex-shrink:0;">📋 Copy thẻ ảnh</button>\n            <button type="button" class="btn btn-danger delete-shared-image-btn" data-path="${escapeHtml(row.path || row.id)}" data-hosts="${escapeHtml(JSON.stringify(row.hostIds || []))}" style="flex-shrink:0;">🗑️ Xoá khỏi host</button>\n          </div>\n        `,
          )
          .join("") +
        (SHARED_QUESTION_IMAGES.length > SHARED_IMAGE_LIST_LIMIT ||
        SHARED_IMAGE_LIST_LIMIT > IMAGE_LIST_PAGE_SIZE
          ? `<div style="text-align:center;margin-top:8px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">` +
            (SHARED_QUESTION_IMAGES.length > SHARED_IMAGE_LIST_LIMIT
              ? `<button type="button" id="sharedImageShowMoreBtn" class="btn btn-ghost">Xem thêm (còn ${SHARED_QUESTION_IMAGES.length - SHARED_IMAGE_LIST_LIMIT})</button>`
              : "") +
            (SHARED_IMAGE_LIST_LIMIT > IMAGE_LIST_PAGE_SIZE
              ? `<button type="button" id="sharedImageShowLessBtn" class="btn btn-ghost">🔼 Thu gọn lại</button>`
              : "") +
            `</div>`
          : "");
      const sharedImageShowMoreBtn = document.getElementById(
        "sharedImageShowMoreBtn",
      );
      if (sharedImageShowMoreBtn)
        sharedImageShowMoreBtn.onclick = () => {
          SHARED_IMAGE_LIST_LIMIT += IMAGE_LIST_PAGE_SIZE;
          renderQuestionImageList();
        };
      const sharedImageShowLessBtn = document.getElementById(
        "sharedImageShowLessBtn",
      );
      if (sharedImageShowLessBtn)
        sharedImageShowLessBtn.onclick = () => {
          SHARED_IMAGE_LIST_LIMIT = IMAGE_LIST_PAGE_SIZE;
          renderQuestionImageList();
        };
      sharedBox
        .querySelectorAll(".copy-shared-image-path-btn")
        .forEach((btn) => {
          btn.onclick = () => {
            copyTextToClipboard(
              buildQuestionImageSnippet(btn.dataset.path),
              `✅ Đã copy thẻ ảnh "${btn.dataset.path}" — dán (Ctrl+V) vào ô "Câu hỏi" trong Excel.`,
            );
          };
        });
      sharedBox.querySelectorAll(".delete-shared-image-btn").forEach((btn) => {
        btn.onclick = async () => {
          let hostIds = [];
          try {
            hostIds = JSON.parse(btn.dataset.hosts || "[]");
          } catch (err) {
            hostIds = [];
          }
          if (
            !confirm(
              `Xoá hẳn ảnh "${btn.dataset.path}" khỏi ${hostIds.length} host (GitHub) và khỏi danh sách ảnh dùng chung? Không thể hoàn tác.`,
            )
          )
            return;
          btn.disabled = true;
          btn.textContent = "⏳ Đang xoá...";
          const result = await deleteQuestionImageFromHosts(
            btn.dataset.path,
            hostIds,
          );
          if (!result.ok) {
            btn.disabled = false;
            btn.textContent = "🗑️ Xoá khỏi host";
            setLog(
              "downloadLog",
              "err",
              `⚠️ Không xoá được hết ảnh "${btn.dataset.path}" trên host:\n` +
                result.errors.join("\n"),
            );
            return;
          }
          setLog(
            "downloadLog",
            "ok",
            `✅ Đã xoá ảnh "${btn.dataset.path}" khỏi ${hostIds.length} host và khỏi danh sách ảnh dùng chung.`,
          );
          loadSharedQuestionImagesRegistry();
        };
      });
    }
}
function buildQuestionImagesPayload() {
  return QUESTION_IMAGES.map((img) => ({ path: img.path, base64: img.base64 }));
}
async function deployToNetlify(htmlContent, fileName) {
  if (!ACTIVE_HOST_IS_CONFIGURED)
    throw new Error(
      'Chưa chọn được host hợp lệ (Firestore collection "hosts" đang trống hoặc chưa tải được) — vào mục "🌐 Host lưu file bài" để kiểm tra/import trước khi deploy.',
    );
  const json = await callAdminApi("deploy-site", {
    hostId: ACTIVE_HOST_ID,
    htmlContent: htmlContent,
    fileName: fileName || "index.html",
  });
  return json.url;
}
function showNetlifyLink(label, url) {
  const box = document.getElementById("netlifyLinkBox");
  const list = document.getElementById("netlifyLinkList");
  box.style.display = "block";
  const time = new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const row = document.createElement("div");
  row.style.cssText =
    "display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px dashed #cfe3fa;";
  row.innerHTML =
    '<span style="font-size:12px;color:#666;min-width:120px;">' +
    time +
    " — " +
    label +
    "</span>" +
    '<a href="' +
    url +
    '" target="_blank" style="word-break:break-all;color:#1a73e8;flex:1;">' +
    url +
    "</a>" +
    '<button type="button" class="btn netlify-copy" style="padding:4px 10px;">📋 Copy</button>';
  row.querySelector(".netlify-copy").onclick = () => {
    navigator.clipboard.writeText(url).then(() => {
      setLog("downloadLog", "ok", "Đã copy link vào clipboard.");
    });
  };
  list.prepend(row);
}
function applyQuizMode(template, mode) {
  if (mode !== "kiemtra") return template;
  const marker = 'const QUIZ_MODE = "onluyen";';
  if (template.indexOf(marker) === -1)
    throw new Error(
      'Không tìm thấy dòng const QUIZ_MODE = "onluyen"; trong khuôn mẫu — kiểm tra lại nội dung đã dán vào tplUnifiedB64.',
    );
  return template.replace(marker, 'const QUIZ_MODE = "kiemtra";');
}
function getCustomTopicLabel() {
  const el = document.getElementById("customTopicLabelInput");
  return el ? el.value.trim() : "";
}
async function buildStudentHtml(mode, quizForSet, setIndex, setTotal) {
  const b64 = document.getElementById("tplUnifiedB64").textContent;
  const template = applyQuizMode(await b64GzipToUtf8(b64), mode);
  const customLabel = getCustomTopicLabel();
  let topicLabel = customLabel || selectedTopicsLabel();
  if (setTotal > 1 && setIndex) topicLabel = topicLabel + ` (T${setIndex})`;
  const examDurationMinutes =
    mode === "kiemtra" ? getExamDurationMinutes() : null;
  return removeAdminUiFromHtml(
    buildUpdatedHtml(
      template,
      quizForSet,
      CLASS_LIST,
      SCHOOL_LIST,
      subjectLabel(ACTIVE_SUBJECT),
      topicLabel,
      examDurationMinutes,
    ),
  );
}
async function generateAndDeploySets(mode, baseFilename, labelPrefix) {
  const activeEmail =
    EMAIL_LIST.find((e) => e.id === ACTIVE_EMAIL_ID) || EMAIL_LIST[0];
  const recipientLabel = activeEmail
    ? activeEmail.label || activeEmail.id
    : "Mặc định";
  setLog("downloadLog", "info", `📧 Kết quả sẽ gửi đến ${recipientLabel}.`);
  const allSets = pickQuestionSets();
  const fullTotal = allSets.length;
  const maxToCreate = computeMaxSetsToCreate(fullTotal);
  const sets = allSets.slice(0, maxToCreate);
  if (fullTotal > 1 && maxToCreate < fullTotal)
    setLog(
      "downloadLog",
      "info",
      `⚠️ Ngân hàng chia được ${fullTotal} bộ, nhưng chỉ tạo ${maxToCreate} bộ theo giới hạn đã nhập. Muốn tạo thêm bộ còn lại thì bấm "Tạo bộ đề" lần nữa (mỗi lần xáo trộn ngẫu nhiên lại).`,
    );
  for (let i = 0; i < sets.length; i++) {
    const quizForSet = sets[i];
    const filename =
      fullTotal > 1
        ? baseFilename.replace(/\.html$/, `-T${i + 1}.html`)
        : baseFilename;
    const setLabel = fullTotal > 1 ? ` (bộ ${i + 1}/${fullTotal})` : "";
    const html = await buildStudentHtml(mode, quizForSet, i + 1, fullTotal);
    setLog(
      "downloadLog",
      "ok",
      `Đang tạo${setLabel} với ${quizForSet.length} câu hỏi. Đang tải lên GitHub...`,
    );
    const link = await deployToNetlify(html, filename);
    setLog(
      "downloadLog",
      "ok",
      `Đã tạo "${filename}"${setLabel} với ${quizForSet.length} câu hỏi và đã đẩy lên GitHub.`,
    );
    showNetlifyLink(`${labelPrefix}${setLabel}:`, link);
  }
}
function makeUniqueDeploySuffix() {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 6);
  return `-${t}${r}`;
}
async function downloadOntap() {
  try {
    const topicPart = selectedTopicsSlug();
    const uniq = makeUniqueDeploySuffix();
    const baseFilename = `bai-on-luyen-hoc-sinh-${subjectSlug(ACTIVE_SUBJECT)}${topicPart ? "-" + topicPart : ""}${uniq}.html`;
    await generateAndDeploySets(
      "onluyen",
      baseFilename,
      `🔗 Link bài ÔN LUYỆN (${subjectLabel(ACTIVE_SUBJECT)}) vừa xuất`,
    );
  } catch (err) {
    setLog("downloadLog", "err", "Lỗi khi tạo file ôn luyện: " + err.message);
  }
}
async function downloadKiemtra() {
  try {
    const topicPart = selectedTopicsSlug();
    const uniq = makeUniqueDeploySuffix();
    const baseFilename = `bai-kiem-tra-hoc-sinh-${subjectSlug(ACTIVE_SUBJECT)}${topicPart ? "-" + topicPart : ""}${uniq}.html`;
    await generateAndDeploySets(
      "kiemtra",
      baseFilename,
      `🔗 Link bài KIỂM TRA (${subjectLabel(ACTIVE_SUBJECT)}) vừa xuất`,
    );
  } catch (err) {
    setLog("downloadLog", "err", "Lỗi khi tạo file kiểm tra: " + err.message);
  }
}
document.getElementById("exportExcelBtn").onclick = exportQuestionsToExcel;
document.getElementById("importExcelInput").onchange = (e) => {
  const f = e.target.files[0];
  if (f) importQuestionsFromExcel(f);
  e.target.value = "";
};
document.getElementById("importJsonInput").onchange = (e) => {
  const f = e.target.files[0];
  if (f) importQuestionsFromJSON(f);
  e.target.value = "";
};
document.getElementById("refreshQuizBtn").onclick = () =>
  loadQuestionsFromApi();
document.getElementById("pushQuizBtn").onclick = async () => {
  if (!QUIZ.length) {
    setLog(
      "quizLog",
      "err",
      `Chưa có câu hỏi nào của môn ${subjectLabel(ACTIVE_SUBJECT)} trong trình duyệt để đẩy lên.`,
    );
    return;
  }
  if (
    !confirm(
      `Đẩy toàn bộ ${QUIZ.length} câu hỏi đang có (môn ${subjectLabel(ACTIVE_SUBJECT)}, trong trình duyệt này) lên Firestore?\nCác câu trùng ID sẽ bị GHI ĐÈ trên Firebase.`,
    )
  )
    return;
  const btn = document.getElementById("pushQuizBtn");
  btn.disabled = true;
  setLog(
    "quizLog",
    "info",
    `Đang đẩy ${QUIZ.length} câu hỏi (môn ${subjectLabel(ACTIVE_SUBJECT)}) lên Firebase...`,
  );
  try {
    const pushResult = await pushQuestionsToFirestore(QUIZ);
    let msg = `🔥 Đã đẩy ${pushResult.ok}/${pushResult.total} câu lên Firebase (document "quizzes/${pushResult.docId}", môn ${subjectLabel(ACTIVE_SUBJECT)}).`;
    if (pushResult.failList.length)
      msg +=
        `\n⚠️ ${pushResult.failList.length} câu lỗi:\n- ` +
        pushResult.failList.join("\n- ");
    setLog("quizLog", pushResult.failList.length ? "err" : "ok", msg);
    const statusEl = document.getElementById("quizFirebaseStatus");
    if (statusEl && !pushResult.failList.length)
      statusEl.innerHTML =
        "✅ Đã đồng bộ " + pushResult.ok + " câu hỏi lên Firebase.";
  } catch (err) {
    setLog("quizLog", "err", "Lỗi khi đẩy lên Firebase: " + err.message);
  } finally {
    btn.disabled = false;
  }
};
document.getElementById("exportMergedListBtn").onclick =
  exportMergedListToExcel;
document.getElementById("importMergedListInput").onchange = (e) => {
  const f = e.target.files[0];
  if (f) importMergedListFromExcel(f);
  e.target.value = "";
};
function getExamDurationMinutes() {
  const el = document.getElementById("examDurationInput");
  const n = el ? parseInt(el.value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 50;
}
(function initExamDurationToggle() {
  const row = document.getElementById("examDurationRow");
  const ontapRadio = document.getElementById("createTypeOntap");
  const kiemtraRadio = document.getElementById("createTypeKiemtra");
  function sync() {
    if (row)
      row.style.display =
        kiemtraRadio && kiemtraRadio.checked ? "flex" : "none";
  }
  if (ontapRadio) ontapRadio.addEventListener("change", sync);
  if (kiemtraRadio) kiemtraRadio.addEventListener("change", sync);
  sync();
})();
document.getElementById("downloadBtn").onclick = async () => {
  const btn = document.getElementById("downloadBtn");
  if (btn.disabled) return;
  const checked = document.querySelector('input[name="createType"]:checked');
  const type = checked ? checked.value : "ontap";
  btn.disabled = true;
  btn.classList.add("btn-loading");
  try {
    if (type === "kiemtra") await downloadKiemtra();
    else await downloadOntap();
  } finally {
    btn.disabled = false;
    btn.classList.remove("btn-loading");
  }
};
document.getElementById("topicQuestionCount").oninput = updateTopicPoolHint;
document.getElementById("topicMaxSetsToCreate").oninput = updateTopicPoolHint;
document.getElementById("selectAllTopicsBtn").onclick = () => {
  selectedTopics = new Set(computeTopics().map((t) => t.name));
  renderTopicList();
};
document.getElementById("deselectAllTopicsBtn").onclick = () => {
  selectedTopics = new Set();
  renderTopicList();
};
document.getElementById("resetLocalBtn").onclick = async () => {
  if (
    !confirm(
      "Xoá toàn bộ dữ liệu đang lưu tạm trong trình duyệt và tải lại ngân hàng câu hỏi THẬT từ Firebase?",
    )
  )
    return;
  localStorage.removeItem(STORAGE_KEY);
  loadState();
  selectedTopics = null;
  renderAll();
  syncActiveWebAppUrl();
  renderEmailSelect();
  syncActiveHost();
  renderHostSelect();
  setLog(
    "downloadLog",
    "info",
    "Đã xoá dữ liệu tạm, đang tải lại ngân hàng câu hỏi thật từ Firebase...",
  );
  const subjectsToReload = QUIZ_LOADED_SUBJECTS.size
    ? Array.from(QUIZ_LOADED_SUBJECTS)
    : [ACTIVE_SUBJECT];
  for (const subjId of subjectsToReload) await loadQuestionsFromApi(subjId);
  setLog("downloadLog", "ok", "Đã tải lại ngân hàng câu hỏi thật từ Firebase.");
};
let qeditEditingId = null;
const QEDIT_FORM_TYPES = [
  "single",
  "multiple",
  "ordering",
  "list",
  "matching",
  "classify",
  "classify2",
  "position",
  "imagepoint",
  "dragfill",
  "selectfill",
];
const QTYPE_ALIASES = { list: "select from list", imagepoint: "hotspot" };
function qtypeLabel(type) {
  const alias = QTYPE_ALIASES[type];
  return alias ? `${type} (${alias})` : type;
}
let qeditFormMode = false;
let qeditWorkingQuestion = null;
let qeditOptionsState = [];
let qeditAnswerState = null;
let qeditItemsState = [];
let qeditListItemsState = [];
let qeditMatchLeftState = [];
let qeditMatchRightState = [];
let qeditMatchAnswerState = [];
let qeditPositionState = [];
let qeditPositionAnswerState = 0;
let qeditImgPointImage = "";
let qeditImgPointIsMulti = false;
let qeditImgPointState = [];
let qeditImgPointAnswerState = 0;
let qeditImgPointAddMode = false;
let qeditImgPointZoomMult = 1;
const IMGPT_MIN_BASE_WIDTH = 760;
const IMGPT_MAX_BASE_WIDTH = 1040;
const IMGPT_MAX_ZOOM_MULT = 6;
function qeditImgPointApplySize(stage) {
  const img = stage.querySelector(".image-stage-img");
  if (!img || !img.naturalWidth || !img.naturalHeight) return;
  const baseW = Math.min(
    IMGPT_MAX_BASE_WIDTH,
    Math.max(IMGPT_MIN_BASE_WIDTH, img.naturalWidth),
  );
  const displayW = Math.round(baseW * qeditImgPointZoomMult);
  const displayH = Math.round(
    displayW * (img.naturalHeight / img.naturalWidth),
  );
  stage.style.width = displayW + "px";
  img.style.width = displayW + "px";
  img.style.height = displayH + "px";
  const label = document.getElementById("qeditImgPointZoomLabel");
  if (label)
    label.textContent = Math.round((displayW / img.naturalWidth) * 100) + "%";
  const outBtn = document.getElementById("qeditImgPointZoomOut");
  const inBtn = document.getElementById("qeditImgPointZoomIn");
  if (outBtn) outBtn.disabled = qeditImgPointZoomMult <= 1;
  if (inBtn) inBtn.disabled = qeditImgPointZoomMult >= IMGPT_MAX_ZOOM_MULT;
}
function qeditImgPointChangeZoom(delta) {
  qeditImgPointZoomMult = Math.max(
    1,
    Math.min(
      IMGPT_MAX_ZOOM_MULT,
      Math.round((qeditImgPointZoomMult + delta) * 10) / 10,
    ),
  );
  const stage = document.querySelector(
    "#qeditImgPointPreviewWrap .image-stage",
  );
  if (stage) qeditImgPointApplySize(stage);
}
function qeditImgPointResetZoom() {
  qeditImgPointZoomMult = 1;
  const stage = document.querySelector(
    "#qeditImgPointPreviewWrap .image-stage",
  );
  if (stage) qeditImgPointApplySize(stage);
}
let qeditZonesState = [];
let qeditClassifyItemsState = [];
let qeditClassifyAnswerState = [];
let qeditClassifyHasColor = true;
let qeditClassifyItemImageTargetIdx = null;
let qeditClassifyDistractorsState = [];
let qeditClassifyDistractorImageTargetIdx = null;
let qeditMatchLeftImageTargetIdx = null;
let qeditOptionImageTargetIdx = null;
let qeditFillOptionsState = [];
let qeditFillAnswerState = [];
let qeditSelectfillBlanksState = [];
function extractSelectfillBlankIndices(template) {
  const found = new Set();
  const re = /\{(\d+)\}/g;
  let m;
  while ((m = re.exec(String(template || "")))) found.add(Number(m[1]));
  return Array.from(found).sort((a, b) => a - b);
}
function renderQeditSelectfillBlanksRows() {
  const wrap = document.getElementById("qeditSelectfillBlanksRows");
  if (!wrap) return;
  if (qeditSelectfillBlanksState.length === 0) {
    wrap.innerHTML =
      '<div class="hint" style="margin:0;">Chưa có chỗ trống nào — gõ mẫu câu có chứa {0}, {1}... rồi bấm "🔍 Quét chỗ trống".</div>';
    return;
  }
  wrap.innerHTML = qeditSelectfillBlanksState
    .map((b, idx) => {
      const answerOptionsHtml = qeditOptionsState
        .map(
          (opt, j) =>
            `<option value="${j}" ${b.answer === j ? "selected" : ""}>${qeditTruncate(String(opt.text || "(chưa nhập)"), 40)}</option>`,
        )
        .join("");
      const checkboxesHtml = qeditOptionsState
        .map((opt, j) => {
          const checked =
            !Array.isArray(b.allowed) ||
            b.allowed.length === 0 ||
            b.allowed.includes(j);
          return `<label style="display:inline-flex;align-items:center;gap:5px;font-size:13px;background:var(--surface2);border:1px solid var(--border);border-radius:999px;padding:4px 10px;">
          <input type="checkbox" data-qedit-sf-allow="${idx}:${j}" ${checked ? "checked" : ""} style="width:14px;height:14px;">
          ${qeditTruncate(String(opt.text || "(chưa nhập)"), 24)}
        </label>`;
        })
        .join("");
      return `
      <div style="border:1px solid var(--border);border-radius:10px;padding:10px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
          <span style="font-weight:800;color:var(--blue-dark);font-size:14.5px;">Chỗ trống {${b.blankIndex}}</span>
          <span>→ đáp án đúng:</span>
          <select data-qedit-sf-answer="${idx}" style="flex:1;min-width:160px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14px;">${answerOptionsHtml}</select>
        </div>
        <div style="font-size:12.5px;color:var(--text-mute);margin-bottom:6px;">Lựa chọn hiển thị trong dropdown này (bỏ tick hết = hiện tất cả):</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">${checkboxesHtml}</div>
      </div>`;
    })
    .join("");
  wrap.querySelectorAll("[data-qedit-sf-answer]").forEach((sel) => {
    sel.onchange = () => {
      qeditSelectfillBlanksState[Number(sel.dataset.qeditSfAnswer)].answer =
        Number(sel.value);
    };
  });
  wrap.querySelectorAll("[data-qedit-sf-allow]").forEach((cb) => {
    cb.onchange = () => {
      const [bi, oi] = cb.dataset.qeditSfAllow.split(":").map(Number);
      const b = qeditSelectfillBlanksState[bi];
      const set = new Set(
        Array.isArray(b.allowed)
          ? b.allowed
          : qeditOptionsState.map((_, i) => i),
      );
      if (cb.checked) set.add(oi);
      else set.delete(oi);
      b.allowed = Array.from(set).sort((a, b2) => a - b2);
      if (b.allowed.length === qeditOptionsState.length) b.allowed = [];
    };
  });
}
function scanSelectfillBlanks() {
  const template = document.getElementById(
    "qeditSelectfillTemplateInput",
  ).value;
  const indices = extractSelectfillBlankIndices(template);
  const prevByIndex = new Map(
    qeditSelectfillBlanksState.map((b) => [b.blankIndex, b]),
  );
  qeditSelectfillBlanksState = indices.map((bi) => {
    const prev = prevByIndex.get(bi);
    return prev ? prev : { blankIndex: bi, answer: 0, allowed: [] };
  });
  renderQeditSelectfillBlanksRows();
}
function renderQeditOptionsRows() {
  const wrap = document.getElementById("qeditOptionsRows");
  const isMultiple =
    qeditWorkingQuestion.type === "multiple" ||
    qeditWorkingQuestion.type === "selectfill";
  const allowImage =
    qeditWorkingQuestion.type === "single" ||
    qeditWorkingQuestion.type === "multiple";
  wrap.innerHTML = qeditOptionsState
    .map((opt, idx) => {
      const checked = isMultiple
        ? Array.isArray(qeditAnswerState) && qeditAnswerState.includes(idx)
        : qeditAnswerState === idx;
      const thumbHtml =
        allowImage && opt.image
          ? `<img src="${resolveQuestionImageUrl(opt.image)}" style="width:38px;height:38px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;" title="${escapeHtml(opt.image)}">`
          : "";
      return `\n      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">\n        <input type="${isMultiple ? "checkbox" : "radio"}" data-qedit-opt-check="${idx}"\n          ${isMultiple ? "" : 'name="qeditAnswerRadio"'} ${checked ? "checked" : ""} style="width:18px;height:18px;flex-shrink:0;">\n        ${thumbHtml}\n        <input type="text" data-qedit-opt-text="${idx}" value="${String(opt.text || "").replace(/"/g, "&quot;")}"\n          placeholder="Nội dung lựa chọn ${idx + 1}" style="flex:1;min-width:120px;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14.5px;">\n        ${allowImage ? `<button class="btn btn-ghost" type="button" data-qedit-opt-img="${idx}" style="flex-shrink:0;" title="Gắn ảnh cho lựa chọn này">🖼️ ${opt.image ? "Đổi ảnh" : "Thêm ảnh"}</button>` : ""}\n        ${allowImage && opt.image ? `<button class="icon-btn" type="button" data-qedit-opt-img-remove="${idx}" title="Bỏ ảnh, dùng lại dạng chữ" style="flex-shrink:0;">🖼️✕</button>` : ""}\n        <button class="icon-btn" type="button" data-qedit-opt-remove="${idx}" title="Xoá lựa chọn này">✕</button>\n      </div>`;
    })
    .join("");
  wrap.querySelectorAll("[data-qedit-opt-text]").forEach((inp) => {
    inp.oninput = () => {
      qeditOptionsState[Number(inp.dataset.qeditOptText)].text = inp.value;
    };
  });
  wrap.querySelectorAll("[data-qedit-opt-check]").forEach((inp) => {
    inp.onchange = () => {
      const idx = Number(inp.dataset.qeditOptCheck);
      if (isMultiple) {
        const set = new Set(
          Array.isArray(qeditAnswerState) ? qeditAnswerState : [],
        );
        if (inp.checked) set.add(idx);
        else set.delete(idx);
        qeditAnswerState = Array.from(set).sort((a, b) => a - b);
      } else qeditAnswerState = idx;
    };
  });
  wrap.querySelectorAll("[data-qedit-opt-img]").forEach((btn) => {
    btn.onclick = () => {
      qeditOptionImageTargetIdx = Number(btn.dataset.qeditOptImg);
      const imgInput = document.getElementById("qeditImageInput");
      if (imgInput) imgInput.click();
    };
  });
  wrap.querySelectorAll("[data-qedit-opt-img-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditOptImgRemove);
      qeditOptionsState[idx].image = "";
      renderQeditOptionsRows();
    };
  });
  wrap.querySelectorAll("[data-qedit-opt-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditOptRemove);
      if (qeditOptionsState.length <= 2) {
        alert("Cần giữ ít nhất 2 lựa chọn.");
        return;
      }
      qeditOptionsState.splice(idx, 1);
      if (isMultiple)
        qeditAnswerState = (
          Array.isArray(qeditAnswerState) ? qeditAnswerState : []
        )
          .filter((a) => a !== idx)
          .map((a) => (a > idx ? a - 1 : a));
      else if (qeditAnswerState === idx) qeditAnswerState = 0;
      else if (qeditAnswerState > idx) qeditAnswerState -= 1;
      qeditSelectfillBlanksState.forEach((b) => {
        if (Array.isArray(b.allowed) && b.allowed.length) {
          b.allowed = b.allowed
            .filter((a) => a !== idx)
            .map((a) => (a > idx ? a - 1 : a));
        }
        if (b.answer === idx) b.answer = 0;
        else if (b.answer > idx) b.answer -= 1;
      });
      renderQeditOptionsRows();
      renderQeditSelectfillBlanksRows();
    };
  });
}
function renderQeditOrderingRows() {
  const wrap = document.getElementById("qeditOrderingRows");
  wrap.innerHTML = qeditItemsState
    .map(
      (text, idx) =>
        `\n      <div style="display:flex;align-items:center;gap:8px;">\n        <span style="font-weight:800;color:var(--blue-dark);min-width:22px;text-align:right;">${idx + 1}.</span>\n        <input type="text" data-qedit-order-text="${idx}" value="${String(text || "").replace(/"/g, "&quot;")}"\n          placeholder="Nội dung bước ${idx + 1}" style="flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14.5px;">\n        <button class="icon-btn" type="button" data-qedit-order-up="${idx}" title="Đẩy lên trên" ${idx === 0 ? "disabled" : ""}>⬆️</button>\n        <button class="icon-btn" type="button" data-qedit-order-down="${idx}" title="Đẩy xuống dưới" ${idx === qeditItemsState.length - 1 ? "disabled" : ""}>⬇️</button>\n        <button class="icon-btn" type="button" data-qedit-order-remove="${idx}" title="Xoá bước này">✕</button>\n      </div>`,
    )
    .join("");
  wrap.querySelectorAll("[data-qedit-order-text]").forEach((inp) => {
    inp.oninput = () => {
      qeditItemsState[Number(inp.dataset.qeditOrderText)] = inp.value;
    };
  });
  wrap.querySelectorAll("[data-qedit-order-up]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditOrderUp);
      if (idx <= 0) return;
      [qeditItemsState[idx - 1], qeditItemsState[idx]] = [
        qeditItemsState[idx],
        qeditItemsState[idx - 1],
      ];
      renderQeditOrderingRows();
    };
  });
  wrap.querySelectorAll("[data-qedit-order-down]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditOrderDown);
      if (idx >= qeditItemsState.length - 1) return;
      [qeditItemsState[idx + 1], qeditItemsState[idx]] = [
        qeditItemsState[idx],
        qeditItemsState[idx + 1],
      ];
      renderQeditOrderingRows();
    };
  });
  wrap.querySelectorAll("[data-qedit-order-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditOrderRemove);
      if (qeditItemsState.length <= 2) {
        alert("Cần giữ ít nhất 2 bước.");
        return;
      }
      qeditItemsState.splice(idx, 1);
      renderQeditOrderingRows();
    };
  });
}
function renderQeditPositionRows() {
  const wrap = document.getElementById("qeditPositionRows");
  wrap.innerHTML = qeditPositionState
    .map((item, idx) => {
      const checked = qeditPositionAnswerState === idx;
      return `\n      <div style="display:flex;align-items:center;gap:8px;">\n        <input type="radio" name="qeditPositionAnswerRadio" data-qedit-pos-check="${idx}"\n          ${checked ? "checked" : ""} style="width:18px;height:18px;flex-shrink:0;" title="Đánh dấu là nút ĐÚNG">\n        <input type="text" data-qedit-pos-icon="${idx}" value="${String(item.icon || "").replace(/"/g, "&quot;")}"\n          placeholder="Icon (vd 📁)" style="width:90px;flex-shrink:0;padding:9px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:16px;text-align:center;">\n        <input type="text" data-qedit-pos-label="${idx}" value="${String(item.label || "").replace(/"/g, "&quot;")}"\n          placeholder="Nhãn nút ${idx + 1}" style="flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14.5px;">\n        <button class="icon-btn" type="button" data-qedit-pos-remove="${idx}" title="Xoá nút này">✕</button>\n      </div>`;
    })
    .join("");
  wrap.querySelectorAll("[data-qedit-pos-icon]").forEach((inp) => {
    inp.oninput = () => {
      qeditPositionState[Number(inp.dataset.qeditPosIcon)].icon = inp.value;
    };
  });
  wrap.querySelectorAll("[data-qedit-pos-label]").forEach((inp) => {
    inp.oninput = () => {
      qeditPositionState[Number(inp.dataset.qeditPosLabel)].label = inp.value;
    };
  });
  wrap.querySelectorAll("[data-qedit-pos-check]").forEach((inp) => {
    inp.onchange = () => {
      qeditPositionAnswerState = Number(inp.dataset.qeditPosCheck);
    };
  });
  wrap.querySelectorAll("[data-qedit-pos-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditPosRemove);
      if (qeditPositionState.length <= 2) {
        alert("Cần giữ ít nhất 2 nút.");
        return;
      }
      qeditPositionState.splice(idx, 1);
      if (qeditPositionAnswerState === idx) qeditPositionAnswerState = 0;
      else if (qeditPositionAnswerState > idx) qeditPositionAnswerState -= 1;
      renderQeditPositionRows();
    };
  });
}
function renderQeditImgPointRows() {
  const wrap = document.getElementById("qeditImgPointRows");
  wrap.innerHTML = qeditImgPointState
    .map((pt, idx) => {
      const checked = qeditImgPointIsMulti
        ? Array.isArray(qeditImgPointAnswerState) &&
          qeditImgPointAnswerState.includes(idx)
        : qeditImgPointAnswerState === idx;
      const numInput = (field, ph, val) =>
        `\n        <input type="number" step="0.1" data-qedit-imgpt-${field}="${idx}" value="${val === "" || val === void 0 || val === null ? "" : val}"\n          placeholder="${ph}" style="width:78px;padding:9px 8px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14px;">`;
      return `\n      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;border:1px solid var(--border);border-radius:8px;padding:8px;background:var(--surface2);">\n        <input type="${qeditImgPointIsMulti ? "checkbox" : "radio"}" data-qedit-imgpt-check="${idx}"\n          ${qeditImgPointIsMulti ? "" : 'name="qeditImgPointAnswerRadio"'} ${checked ? "checked" : ""}\n          style="width:18px;height:18px;flex-shrink:0;" title="Đánh dấu là vị trí ĐÚNG">\n        <span style="font-size:12px;color:var(--text-mute);width:16px;flex-shrink:0;">#${idx + 1}</span>\n        <label style="font-size:11.5px;color:var(--text-mute);display:flex;flex-direction:column;gap:2px;">X%${numInput("x", "X%", pt.x)}</label>\n        <label style="font-size:11.5px;color:var(--text-mute);display:flex;flex-direction:column;gap:2px;">Y%${numInput("y", "Y%", pt.y)}</label>\n        <label style="font-size:11.5px;color:var(--text-mute);display:flex;flex-direction:column;gap:2px;">Rộng%${numInput("width", "(chấm tròn)", pt.width)}</label>\n        <label style="font-size:11.5px;color:var(--text-mute);display:flex;flex-direction:column;gap:2px;">Cao%${numInput("height", "(chấm tròn)", pt.height)}</label>\n        <input type="text" data-qedit-imgpt-label="${idx}" value="${String(pt.label || "").replace(/"/g, "&quot;")}"\n          placeholder="Nhãn (không bắt buộc)" style="flex:1 1 140px;min-width:120px;padding:9px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);font-family:inherit;font-size:14px;">\n        <button class="icon-btn" type="button" data-qedit-imgpt-remove="${idx}" title="Xoá vị trí này">✕</button>\n      </div>`;
    })
    .join("");
  ["x", "y", "width", "height"].forEach((field) => {
    wrap.querySelectorAll(`[data-qedit-imgpt-${field}]`).forEach((inp) => {
      inp.oninput = () => {
        const idx = Number(
          inp.dataset[
            `qeditImgpt${field.charAt(0).toUpperCase()}${field.slice(1)}`
          ],
        );
        qeditImgPointState[idx][field] =
          inp.value === "" ? "" : Number(inp.value);
        qeditSyncImgPointPreview();
      };
    });
  });
  wrap.querySelectorAll("[data-qedit-imgpt-label]").forEach((inp) => {
    inp.oninput = () => {
      qeditImgPointState[Number(inp.dataset.qeditImgptLabel)].label = inp.value;
      qeditSyncImgPointPreview();
    };
  });
  wrap.querySelectorAll("[data-qedit-imgpt-check]").forEach((inp) => {
    inp.onchange = () => {
      const idx = Number(inp.dataset.qeditImgptCheck);
      if (qeditImgPointIsMulti) {
        const set = new Set(
          Array.isArray(qeditImgPointAnswerState)
            ? qeditImgPointAnswerState
            : [],
        );
        if (inp.checked) set.add(idx);
        else set.delete(idx);
        qeditImgPointAnswerState = Array.from(set).sort((a, b) => a - b);
      } else qeditImgPointAnswerState = idx;
      qeditSyncImgPointPreview();
    };
  });
  wrap.querySelectorAll("[data-qedit-imgpt-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditImgptRemove);
      if (qeditImgPointState.length <= 1) {
        alert("Cần giữ ít nhất 1 vị trí.");
        return;
      }
      qeditImgPointState.splice(idx, 1);
      if (qeditImgPointIsMulti)
        qeditImgPointAnswerState = (
          Array.isArray(qeditImgPointAnswerState)
            ? qeditImgPointAnswerState
            : []
        )
          .filter((a) => a !== idx)
          .map((a) => (a > idx ? a - 1 : a));
      else if (qeditImgPointAnswerState === idx) qeditImgPointAnswerState = 0;
      else if (qeditImgPointAnswerState > idx) qeditImgPointAnswerState -= 1;
      renderQeditImgPointRows();
      qeditSyncImgPointPreview();
    };
  });
}
function qeditClampPct(v, min, max) {
  if (min === void 0) min = 0;
  if (max === void 0) max = 100;
  return Math.round(Math.min(max, Math.max(min, v)) * 10) / 10;
}
function qeditSyncImgPointRowInputs(idx) {
  ["x", "y", "width", "height"].forEach((field) => {
    const el = document.querySelector(`[data-qedit-imgpt-${field}="${idx}"]`);
    if (!el) return;
    const v = qeditImgPointState[idx][field];
    el.value = v === "" || v === void 0 || v === null ? "" : v;
  });
}
function qeditToggleImgPointAnswer(idx) {
  if (qeditImgPointIsMulti) {
    const set = new Set(
      Array.isArray(qeditImgPointAnswerState) ? qeditImgPointAnswerState : [],
    );
    if (set.has(idx)) set.delete(idx);
    else set.add(idx);
    qeditImgPointAnswerState = Array.from(set).sort((a, b) => a - b);
  } else qeditImgPointAnswerState = idx;
}
function bindImgPointMarkerEvents(marker, stage, idx, isRect) {
  let dragging = false,
    moved = false,
    startX = 0,
    startY = 0;
  marker.addEventListener("pointerdown", (e) => {
    if (e.target.classList.contains("marker-resize-handle")) return;
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    try {
      marker.setPointerCapture(e.pointerId);
    } catch (err) {}
  });
  marker.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    if (
      !moved &&
      (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3)
    )
      moved = true;
    if (!moved) return;
    const rect = stage.getBoundingClientRect();
    const xPct = qeditClampPct(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = qeditClampPct(((e.clientY - rect.top) / rect.height) * 100);
    qeditImgPointState[idx].x = xPct;
    qeditImgPointState[idx].y = yPct;
    marker.style.left = xPct + "%";
    marker.style.top = yPct + "%";
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    try {
      marker.releasePointerCapture(e.pointerId);
    } catch (err) {}
    if (moved) qeditSyncImgPointRowInputs(idx);
    else {
      qeditToggleImgPointAnswer(idx);
      renderQeditImgPointRows();
      renderQeditImgPointMarkers(stage);
    }
  };
  marker.addEventListener("pointerup", endDrag);
  marker.addEventListener("pointercancel", endDrag);
  if (isRect) {
    const handle = document.createElement("div");
    handle.className = "marker-resize-handle";
    handle.title = "Kéo để chỉnh Rộng/Cao vùng này";
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        handle.setPointerCapture(e.pointerId);
      } catch (err) {}
      const rect = stage.getBoundingClientRect();
      const onMove = (ev) => {
        const pt = qeditImgPointState[idx];
        const px = typeof pt.x === "number" ? pt.x : 0;
        const py = typeof pt.y === "number" ? pt.y : 0;
        const w = qeditClampPct(
          ((ev.clientX - rect.left) / rect.width) * 100 - px,
          1,
          100 - px,
        );
        const h = qeditClampPct(
          ((ev.clientY - rect.top) / rect.height) * 100 - py,
          1,
          100 - py,
        );
        pt.width = w;
        pt.height = h;
        marker.style.width = w + "%";
        marker.style.height = h + "%";
      };
      const onUp = (ev) => {
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
        handle.removeEventListener("pointercancel", onUp);
        qeditSyncImgPointRowInputs(idx);
      };
      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
      handle.addEventListener("pointercancel", onUp);
    });
    marker.appendChild(handle);
  }
}
function renderQeditImgPointMarkers(stage) {
  stage.querySelectorAll(".image-marker").forEach((m) => m.remove());
  qeditImgPointState.forEach((pt, i) => {
    const marker = document.createElement("div");
    const isRect =
      pt.width !== "" &&
      pt.width !== void 0 &&
      pt.width !== null &&
      pt.height !== "" &&
      pt.height !== void 0 &&
      pt.height !== null;
    marker.className = "image-marker" + (isRect ? " marker-rect" : "");
    marker.style.left = (pt.x || 0) + "%";
    marker.style.top = (pt.y || 0) + "%";
    if (isRect) {
      marker.style.width = pt.width + "%";
      marker.style.height = pt.height + "%";
    }
    const isCorrect = qeditImgPointIsMulti
      ? Array.isArray(qeditImgPointAnswerState) &&
        qeditImgPointAnswerState.includes(i)
      : qeditImgPointAnswerState === i;
    if (isCorrect) marker.classList.add("correct");
    marker.innerHTML = `<span class="marker-num">${i + 1}</span>`;
    marker.title =
      (pt.label || `Vị trí ${i + 1}`) +
      " — kéo để di chuyển, bấm nhẹ để đánh dấu đúng/sai";
    bindImgPointMarkerEvents(marker, stage, i, isRect);
    stage.appendChild(marker);
  });
}
function qeditImgPointStageClick(e) {
  if (!qeditImgPointAddMode) return;
  if (e.target.closest(".image-marker")) return;
  const stage = e.currentTarget;
  const rect = stage.getBoundingClientRect();
  const xPct = qeditClampPct(((e.clientX - rect.left) / rect.width) * 100);
  const yPct = qeditClampPct(((e.clientY - rect.top) / rect.height) * 100);
  qeditImgPointState.push({
    x: xPct,
    y: yPct,
    width: "",
    height: "",
    label: "",
  });
  if (qeditImgPointIsMulti && !Array.isArray(qeditImgPointAnswerState))
    qeditImgPointAnswerState = [];
  renderQeditImgPointRows();
  renderQeditImgPointMarkers(stage);
}
function resolveQuestionImageUrl(path) {
  const p = String(path || "")
    .trim()
    .replace(/^\/+/, "");
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const active =
    (typeof HOST_LIST !== "undefined" &&
      HOST_LIST.find((h) => h.id === ACTIVE_HOST_ID)) ||
    (typeof HOST_LIST !== "undefined" && HOST_LIST[0]);
  if (!active || active.id === "default" || !active.owner || !active.repo) return p;
  if (active.pagesUrl) return active.pagesUrl.replace(/\/+$/, "") + "/" + p;
  const isUserSite = active.repo.toLowerCase() === `${active.owner.toLowerCase()}.github.io`;
  const base = isUserSite
    ? `https://${active.owner}.github.io`
    : `https://${active.owner}.github.io/${active.repo}`;
  return `${base}/${p}`;
}
function renderQeditImgPointPreview() {
  const wrap = document.getElementById("qeditImgPointPreviewWrap");
  const path = document.getElementById("qeditImgPointImagePath").value.trim();
  if (!path) {
    wrap.style.display = "block";
    wrap.innerHTML = `<div class="hint">Chưa có đường dẫn ảnh — hãy dán đường dẫn vào ô "Đường dẫn ảnh minh hoạ" ở trên rồi bấm lại.</div>`;
    return;
  }
  wrap.style.display = "block";
  let stage = wrap.querySelector(".image-stage");
  if (!stage || stage.dataset.imgPath !== path) {
    qeditImgPointZoomMult = 1;
    wrap.innerHTML = `\n      <div class="imgpt-zoom-bar">\n        <button class="btn btn-ghost" type="button" id="qeditImgPointZoomOut" title="Thu nhỏ">➖ Thu nhỏ</button>\n        <span class="imgpt-zoom-label" id="qeditImgPointZoomLabel">100%</span>\n        <button class="btn btn-ghost" type="button" id="qeditImgPointZoomIn" title="Phóng to">➕ Phóng to</button>\n        <button class="btn btn-ghost" type="button" id="qeditImgPointZoomReset" title="Về mức mặc định">↺ Vừa khung</button>\n      </div>\n      <div class="image-stage-scroll">\n        <div class="image-stage" data-img-path="${path.replace(/"/g, "&quot;")}">\n          <img class="image-stage-img" src="${resolveQuestionImageUrl(path)}" draggable="false">\n        </div>\n      </div>\n      <div class="hint" style="margin-top:8px;">\n        Ảnh gốc nhỏ/khó bấm chính xác? Bấm "➕ Phóng to" vài lần rồi cuộn trong khung để tìm đúng\n        chỗ (khoanh/kéo điểm vẫn ra đúng % như bình thường) · Kéo 1 điểm để di chuyển · nếu là\n        vùng chữ nhật, kéo ô vuông ở góc dưới-phải để chỉnh Rộng/Cao · bấm nhẹ (không kéo) vào 1\n        điểm để đánh dấu điểm đó là đáp án đúng/sai · bật ô "🖱️ Bật bấm vào ảnh để thêm điểm mới"\n        ở trên rồi bấm vào chỗ trống trên ảnh để thêm 1 điểm mới tại đúng chỗ vừa bấm.\n      </div>`;
    stage = wrap.querySelector(".image-stage");
    stage.addEventListener("click", qeditImgPointStageClick);
    if (qeditImgPointAddMode) stage.classList.add("add-mode");
    const stageImg = stage.querySelector(".image-stage-img");
    if (stageImg.complete && stageImg.naturalWidth)
      qeditImgPointApplySize(stage);
    else stageImg.addEventListener("load", () => qeditImgPointApplySize(stage));
    stageImg.addEventListener("error", () => {
      const errBox = document.createElement("div");
      errBox.className = "hint";
      errBox.style.cssText = "margin:8px 0 0;color:#b00020;font-weight:600;";
      errBox.textContent = `⚠️ Không tải được ảnh từ "${stageImg.src}". Kiểm tra: ảnh đã đẩy lên host đang chọn chưa (xem khung "Quản lý ảnh câu hỏi" phía trên), hoặc đường dẫn có gõ đúng không.`;
      stage.parentElement.insertAdjacentElement("afterend", errBox);
    });
    document.getElementById("qeditImgPointZoomOut").onclick = () =>
      qeditImgPointChangeZoom(-0.5);
    document.getElementById("qeditImgPointZoomIn").onclick = () =>
      qeditImgPointChangeZoom(0.5);
    document.getElementById("qeditImgPointZoomReset").onclick = () =>
      qeditImgPointResetZoom();
  }
  renderQeditImgPointMarkers(stage);
}
function qeditSyncImgPointPreview() {
  const wrap = document.getElementById("qeditImgPointPreviewWrap");
  if (!wrap || wrap.style.display !== "block") return;
  const stage = wrap.querySelector(".image-stage");
  if (stage) renderQeditImgPointMarkers(stage);
}
function renderQeditListItemsRows() {
  const wrap = document.getElementById("qeditListItemsRows");
  wrap.innerHTML = qeditListItemsState
    .map((item, i) => {
      const optionsHtml = item.options
        .map(
          (optText, j) =>
            `\n        <div style="display:flex;align-items:center;gap:8px;flex-wrap:nowrap;">\n          <input type="radio" name="qeditListAnswer_${i}" data-qedit-list-check="${i}:${j}" ${item.answer === j ? "checked" : ""} style="width:16px;height:16px;flex-shrink:0;">\n          <input type="text" data-qedit-list-opt-text="${i}:${j}" value="${String(optText || "").replace(/"/g, "&quot;")}"\n            placeholder="Lựa chọn ${j + 1}" style="flex:1;min-width:0;padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14.5px;">\n          <button class="icon-btn" type="button" data-qedit-list-opt-remove="${i}:${j}" title="Xoá lựa chọn này" style="flex-shrink:0;">✕</button>\n        </div>`,
        )
        .join("");
      return `\n      <div style="border:1px solid var(--border);border-radius:10px;padding:10px;">\n        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:nowrap;">\n          <span style="font-weight:800;color:var(--blue-dark);font-size:14.5px;white-space:nowrap;flex-shrink:0;">Tiểu mục #${i + 1}</span>\n          <input type="text" data-qedit-list-label="${i}" value="${String(item.label || "").replace(/"/g, "&quot;")}"\n            placeholder="Nhãn tiểu mục (vd: đầu câu, chỗ trống 1...)" style="flex:1;min-width:0;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14.5px;">\n          <button class="btn btn-danger" type="button" data-qedit-list-item-remove="${i}" title="Xoá tiểu mục này" style="flex-shrink:0;">🗑️</button>\n        </div>\n        <div style="display:flex;flex-direction:column;gap:6px;">${optionsHtml}</div>\n        <button class="admin-link" type="button" data-qedit-list-opt-add="${i}" style="margin-top:6px;">➕ Thêm lựa chọn cho tiểu mục này</button>\n      </div>`;
    })
    .join("");
  wrap.querySelectorAll("[data-qedit-list-label]").forEach((inp) => {
    inp.oninput = () => {
      qeditListItemsState[Number(inp.dataset.qeditListLabel)].label = inp.value;
    };
  });
  wrap.querySelectorAll("[data-qedit-list-opt-text]").forEach((inp) => {
    inp.oninput = () => {
      const [i, j] = inp.dataset.qeditListOptText.split(":").map(Number);
      qeditListItemsState[i].options[j] = inp.value;
    };
  });
  wrap.querySelectorAll("[data-qedit-list-check]").forEach((inp) => {
    inp.onchange = () => {
      const [i, j] = inp.dataset.qeditListCheck.split(":").map(Number);
      qeditListItemsState[i].answer = j;
    };
  });
  wrap.querySelectorAll("[data-qedit-list-opt-remove]").forEach((btn) => {
    btn.onclick = () => {
      const [i, j] = btn.dataset.qeditListOptRemove.split(":").map(Number);
      if (qeditListItemsState[i].options.length <= 2) {
        alert("Mỗi tiểu mục cần giữ ít nhất 2 lựa chọn.");
        return;
      }
      qeditListItemsState[i].options.splice(j, 1);
      if (qeditListItemsState[i].answer === j)
        qeditListItemsState[i].answer = 0;
      else if (qeditListItemsState[i].answer > j)
        qeditListItemsState[i].answer -= 1;
      renderQeditListItemsRows();
    };
  });
  wrap.querySelectorAll("[data-qedit-list-opt-add]").forEach((btn) => {
    btn.onclick = () => {
      const i = Number(btn.dataset.qeditListOptAdd);
      qeditListItemsState[i].options.push("");
      renderQeditListItemsRows();
    };
  });
  wrap.querySelectorAll("[data-qedit-list-item-remove]").forEach((btn) => {
    btn.onclick = () => {
      const i = Number(btn.dataset.qeditListItemRemove);
      if (qeditListItemsState.length <= 1) {
        alert("Cần giữ ít nhất 1 tiểu mục.");
        return;
      }
      qeditListItemsState.splice(i, 1);
      renderQeditListItemsRows();
    };
  });
}
function renderQeditMatchLeftRows() {
  const wrap = document.getElementById("qeditMatchLeftRows");
  wrap.innerHTML = qeditMatchLeftState
    .map((item, idx) => {
      const isImg = item && typeof item === "object";
      const textVal = isImg ? item.label || "" : item || "";
      const thumbHtml =
        isImg && item.image
          ? `<img src="${resolveQuestionImageUrl(item.image)}" style="width:38px;height:38px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;" title="${escapeHtml(item.image)}">`
          : "";
      return `\n      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">\n        <span style="font-weight:800;color:var(--blue-dark);font-size:14.5px;min-width:60px;white-space:nowrap;flex-shrink:0;">Trái ${idx + 1}</span>\n        ${thumbHtml}\n        <input type="text" data-qedit-mleft-text="${idx}" value="${String(textVal || "").replace(/"/g, "&quot;")}"\n          placeholder="${isImg ? "Chú thích ảnh (không bắt buộc)" : "Nội dung mục trái " + (idx + 1)}" style="flex:1;min-width:140px;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14.5px;">\n        <button class="btn btn-ghost" type="button" data-qedit-mleft-img="${idx}" style="flex-shrink:0;" title="Gắn ảnh cho mục này thay vì hiển thị chữ">🖼️ ${isImg ? "Đổi ảnh" : "Thêm ảnh"}</button>\n        ${isImg ? `<button class="icon-btn" type="button" data-qedit-mleft-img-remove="${idx}" title="Bỏ ảnh, dùng lại dạng chữ" style="flex-shrink:0;">🖼️✕</button>` : ""}\n        <button class="icon-btn" type="button" data-qedit-mleft-remove="${idx}" title="Xoá mục này" style="flex-shrink:0;">✕</button>\n      </div>`;
    })
    .join("");
  wrap.querySelectorAll("[data-qedit-mleft-text]").forEach((inp) => {
    inp.oninput = () => {
      const idx = Number(inp.dataset.qeditMleftText);
      const item = qeditMatchLeftState[idx];
      if (item && typeof item === "object") item.label = inp.value;
      else qeditMatchLeftState[idx] = inp.value;
      renderQeditMatchAnswerRows();
    };
  });
  wrap.querySelectorAll("[data-qedit-mleft-img]").forEach((btn) => {
    btn.onclick = () => {
      qeditMatchLeftImageTargetIdx = Number(btn.dataset.qeditMleftImg);
      const imgInput = document.getElementById("qeditImageInput");
      if (imgInput) imgInput.click();
    };
  });
  wrap.querySelectorAll("[data-qedit-mleft-img-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditMleftImgRemove);
      const item = qeditMatchLeftState[idx];
      qeditMatchLeftState[idx] =
        item && typeof item === "object" ? item.label || "" : "";
      renderQeditMatchLeftRows();
      renderQeditMatchAnswerRows();
    };
  });
  wrap.querySelectorAll("[data-qedit-mleft-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditMleftRemove);
      if (qeditMatchLeftState.length <= 2) {
        alert("Cần giữ ít nhất 2 mục cột trái.");
        return;
      }
      qeditMatchLeftState.splice(idx, 1);
      qeditMatchAnswerState.splice(idx, 1);
      renderQeditMatchLeftRows();
      renderQeditMatchAnswerRows();
    };
  });
}
function renderQeditMatchRightRows() {
  const wrap = document.getElementById("qeditMatchRightRows");
  wrap.innerHTML = qeditMatchRightState
    .map(
      (text, idx) =>
        `\n      <div style="display:flex;align-items:center;gap:8px;flex-wrap:nowrap;">\n        <span style="font-weight:800;color:var(--blue-dark);font-size:14.5px;min-width:60px;white-space:nowrap;flex-shrink:0;">Phải ${idx + 1}</span>\n        <input type="text" data-qedit-mright-text="${idx}" value="${String(text || "").replace(/"/g, "&quot;")}"\n          placeholder="Nội dung mục phải ${idx + 1}" style="flex:1;min-width:0;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14.5px;">\n        <button class="icon-btn" type="button" data-qedit-mright-remove="${idx}" title="Xoá mục này" style="flex-shrink:0;">✕</button>\n      </div>`,
    )
    .join("");
  wrap.querySelectorAll("[data-qedit-mright-text]").forEach((inp) => {
    inp.oninput = () => {
      qeditMatchRightState[Number(inp.dataset.qeditMrightText)] = inp.value;
      renderQeditMatchAnswerRows();
    };
  });
  wrap.querySelectorAll("[data-qedit-mright-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditMrightRemove);
      if (qeditMatchRightState.length <= 2) {
        alert("Cần giữ ít nhất 2 mục cột phải.");
        return;
      }
      qeditMatchRightState.splice(idx, 1);
      qeditMatchAnswerState = qeditMatchAnswerState.map((a) => {
        if (a === idx) return 0;
        if (a > idx) return a - 1;
        return a;
      });
      renderQeditMatchRightRows();
      renderQeditMatchAnswerRows();
    };
  });
}
function qeditMatchLeftSummary(item, i) {
  if (item && typeof item === "object")
    return "🖼️ " + (item.label || "(ảnh, mục " + (i + 1) + ")");
  return String(item || "(mục trái " + (i + 1) + " chưa nhập)");
}
function renderQeditMatchAnswerRows() {
  const wrap = document.getElementById("qeditMatchAnswerRows");
  wrap.innerHTML = qeditMatchLeftState
    .map((text, i) => {
      const optionsHtml = qeditMatchRightState
        .map(
          (rtext, j) =>
            `<option value="${j}" ${qeditMatchAnswerState[i] === j ? "selected" : ""}>${qeditTruncate(String(rtext || "(để trống)"), 40)}</option>`,
        )
        .join("");
      return `\n      <div style="display:flex;align-items:center;gap:8px;flex-wrap:nowrap;">\n        <span style="flex:1;min-width:0;font-size:14.5px;">${qeditTruncate(qeditMatchLeftSummary(text, i), 50)}</span>\n        <span style="flex-shrink:0;font-size:14.5px;">→</span>\n        <select data-qedit-manswer="${i}" style="flex:1;min-width:0;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14.5px;">${optionsHtml}</select>\n      </div>`;
    })
    .join("");
  wrap.querySelectorAll("[data-qedit-manswer]").forEach((sel) => {
    sel.onchange = () => {
      qeditMatchAnswerState[Number(sel.dataset.qeditManswer)] = Number(
        sel.value,
      );
    };
  });
}
function renderQeditClassifyZonesRows() {
  const wrap = document.getElementById("qeditClassifyZonesRows");
  wrap.innerHTML = qeditZonesState
    .map(
      (zone, idx) =>
        `\n      <div style="display:flex;align-items:center;gap:8px;">\n        <span style="font-weight:800;color:var(--blue-dark);min-width:60px;">Nhóm ${idx + 1}</span>\n        <input type="text" data-qedit-zone-label="${idx}" value="${String(zone.label || "").replace(/"/g, "&quot;")}"\n          placeholder="Tên nhóm ${idx + 1}" style="flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14.5px;">\n        ${qeditClassifyHasColor ? `<input type="color" data-qedit-zone-color="${idx}" value="${zone.color || "#2f6fed"}" title="Màu nhóm" style="width:40px;height:36px;padding:2px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);cursor:pointer;">` : ""}\n        <button class="icon-btn" type="button" data-qedit-zone-remove="${idx}" title="Xoá nhóm này">✕</button>\n      </div>`,
    )
    .join("");
  wrap.querySelectorAll("[data-qedit-zone-label]").forEach((inp) => {
    inp.oninput = () => {
      qeditZonesState[Number(inp.dataset.qeditZoneLabel)].label = inp.value;
      renderQeditClassifyItemsRows();
    };
  });
  wrap.querySelectorAll("[data-qedit-zone-color]").forEach((inp) => {
    inp.oninput = () => {
      qeditZonesState[Number(inp.dataset.qeditZoneColor)].color = inp.value;
    };
  });
  wrap.querySelectorAll("[data-qedit-zone-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditZoneRemove);
      if (qeditZonesState.length <= 2) {
        alert("Cần giữ ít nhất 2 nhóm.");
        return;
      }
      qeditZonesState.splice(idx, 1);
      qeditClassifyAnswerState = qeditClassifyAnswerState.map((a) => {
        if (a === idx) return 0;
        if (a > idx) return a - 1;
        return a;
      });
      renderQeditClassifyZonesRows();
      renderQeditClassifyItemsRows();
    };
  });
}
function renderQeditClassifyItemsRows() {
  const wrap = document.getElementById("qeditClassifyItemsRows");
  wrap.innerHTML = qeditClassifyItemsState
    .map((item, idx) => {
      const isImg = item && typeof item === "object";
      const textVal = isImg ? item.label || "" : item || "";
      const optionsHtml = qeditZonesState
        .map(
          (zone, j) =>
            `<option value="${j}" ${qeditClassifyAnswerState[idx] === j ? "selected" : ""}>${qeditTruncate(String(zone.label || "Nhóm " + (j + 1)), 30)}</option>`,
        )
        .join("");
      const thumbHtml =
        isImg && item.image
          ? `<img src="${resolveQuestionImageUrl(item.image)}" style="width:38px;height:38px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;" title="${escapeHtml(item.image)}">`
          : "";
      return `\n      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">\n        ${thumbHtml}\n        <input type="text" data-qedit-citem-text="${idx}" value="${String(textVal || "").replace(/"/g, "&quot;")}"\n          placeholder="${isImg ? "Chú thích ảnh (không bắt buộc)" : "Nội dung mục " + (idx + 1)}" style="flex:1;min-width:140px;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14.5px;">\n        <button class="btn btn-ghost" type="button" data-qedit-citem-img="${idx}" style="flex-shrink:0;" title="Gắn ảnh cho mục này thay vì hiển thị chữ">🖼️ ${isImg ? "Đổi ảnh" : "Thêm ảnh"}</button>\n        ${isImg ? `<button class="icon-btn" type="button" data-qedit-citem-img-remove="${idx}" title="Bỏ ảnh, dùng lại dạng chữ" style="flex-shrink:0;">🖼️✕</button>` : ""}\n        <span>→</span>\n        <select data-qedit-citem-zone="${idx}" style="min-width:140px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14px;">${optionsHtml}</select>\n        <button class="icon-btn" type="button" data-qedit-citem-remove="${idx}" title="Xoá mục này">✕</button>\n      </div>`;
    })
    .join("");
  wrap.querySelectorAll("[data-qedit-citem-text]").forEach((inp) => {
    inp.oninput = () => {
      const idx = Number(inp.dataset.qeditCitemText);
      const item = qeditClassifyItemsState[idx];
      if (item && typeof item === "object") item.label = inp.value;
      else qeditClassifyItemsState[idx] = inp.value;
    };
  });
  wrap.querySelectorAll("[data-qedit-citem-zone]").forEach((sel) => {
    sel.onchange = () => {
      qeditClassifyAnswerState[Number(sel.dataset.qeditCitemZone)] = Number(
        sel.value,
      );
    };
  });
  wrap.querySelectorAll("[data-qedit-citem-img]").forEach((btn) => {
    btn.onclick = () => {
      qeditClassifyItemImageTargetIdx = Number(btn.dataset.qeditCitemImg);
      const imgInput = document.getElementById("qeditImageInput");
      if (imgInput) imgInput.click();
    };
  });
  wrap.querySelectorAll("[data-qedit-citem-img-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditCitemImgRemove);
      const item = qeditClassifyItemsState[idx];
      qeditClassifyItemsState[idx] =
        item && typeof item === "object" ? item.label || "" : "";
      renderQeditClassifyItemsRows();
    };
  });
  wrap.querySelectorAll("[data-qedit-citem-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditCitemRemove);
      if (qeditClassifyItemsState.length <= 2) {
        alert("Cần giữ ít nhất 2 mục.");
        return;
      }
      qeditClassifyItemsState.splice(idx, 1);
      qeditClassifyAnswerState.splice(idx, 1);
      renderQeditClassifyItemsRows();
    };
  });
}
function renderQeditClassifyDistractorsRows() {
  const wrap = document.getElementById("qeditClassifyDistractorsRows");
  if (!wrap) return;
  wrap.innerHTML = qeditClassifyDistractorsState
    .map((item, idx) => {
      const isImg = item && typeof item === "object";
      const textVal = isImg ? item.label || "" : item || "";
      const thumbHtml =
        isImg && item.image
          ? `<img src="${resolveQuestionImageUrl(item.image)}" style="width:38px;height:38px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;" title="${escapeHtml(item.image)}">`
          : "";
      return `\n      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">\n        ${thumbHtml}\n        <input type="text" data-qedit-cdist-text="${idx}" value="${String(textVal || "").replace(/"/g, "&quot;")}"\n          placeholder="${isImg ? "Chú thích ảnh (không bắt buộc)" : "Nội dung thẻ mồi nhử " + (idx + 1)}" style="flex:1;min-width:140px;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14.5px;">\n        <button class="btn btn-ghost" type="button" data-qedit-cdist-img="${idx}" style="flex-shrink:0;" title="Gắn ảnh cho thẻ này thay vì hiển thị chữ">🖼️ ${isImg ? "Đổi ảnh" : "Thêm ảnh"}</button>\n        ${isImg ? `<button class="icon-btn" type="button" data-qedit-cdist-img-remove="${idx}" title="Bỏ ảnh, dùng lại dạng chữ" style="flex-shrink:0;">🖼️✕</button>` : ""}\n        <button class="icon-btn" type="button" data-qedit-cdist-remove="${idx}" title="Xoá thẻ mồi nhử này">✕</button>\n      </div>`;
    })
    .join("");
  wrap.querySelectorAll("[data-qedit-cdist-text]").forEach((inp) => {
    inp.oninput = () => {
      const idx = Number(inp.dataset.qeditCdistText);
      const item = qeditClassifyDistractorsState[idx];
      if (item && typeof item === "object") item.label = inp.value;
      else qeditClassifyDistractorsState[idx] = inp.value;
    };
  });
  wrap.querySelectorAll("[data-qedit-cdist-img]").forEach((btn) => {
    btn.onclick = () => {
      qeditClassifyDistractorImageTargetIdx = Number(btn.dataset.qeditCdistImg);
      const imgInput = document.getElementById("qeditImageInput");
      if (imgInput) imgInput.click();
    };
  });
  wrap.querySelectorAll("[data-qedit-cdist-img-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditCdistImgRemove);
      const item = qeditClassifyDistractorsState[idx];
      qeditClassifyDistractorsState[idx] =
        item && typeof item === "object" ? item.label || "" : "";
      renderQeditClassifyDistractorsRows();
    };
  });
  wrap.querySelectorAll("[data-qedit-cdist-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditCdistRemove);
      qeditClassifyDistractorsState.splice(idx, 1);
      renderQeditClassifyDistractorsRows();
    };
  });
}
function renderQeditFillOptionsRows() {
  const wrap = document.getElementById("qeditFillOptionsRows");
  wrap.innerHTML = qeditFillOptionsState
    .map(
      (opt, idx) =>
        `\n      <div style="display:flex;align-items:center;gap:8px;">\n        <span style="font-weight:800;color:var(--blue-dark);min-width:22px;text-align:right;">${idx + 1}.</span>\n        <input type="text" data-qedit-fillopt-text="${idx}" value="${String(opt.text || "").replace(/"/g, "&quot;")}"\n          placeholder="Từ/cụm từ ${idx + 1}" style="flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14.5px;">\n        <button class="icon-btn" type="button" data-qedit-fillopt-remove="${idx}" title="Xoá từ này khỏi ngân hàng">✕</button>\n      </div>`,
    )
    .join("");
  wrap.querySelectorAll("[data-qedit-fillopt-text]").forEach((inp) => {
    inp.oninput = () => {
      qeditFillOptionsState[Number(inp.dataset.qeditFilloptText)].text =
        inp.value;
      renderQeditFillAnswerRows();
    };
  });
  wrap.querySelectorAll("[data-qedit-fillopt-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditFilloptRemove);
      if (qeditFillOptionsState.length <= 1) {
        alert("Cần giữ ít nhất 1 từ trong ngân hàng.");
        return;
      }
      qeditFillOptionsState.splice(idx, 1);
      qeditFillAnswerState = qeditFillAnswerState.map((a) =>
        a === idx ? 0 : a > idx ? a - 1 : a,
      );
      renderQeditFillOptionsRows();
      renderQeditFillAnswerRows();
    };
  });
  updateQeditFillBlankHint();
}
function renderQeditFillAnswerRows() {
  const wrap = document.getElementById("qeditFillAnswerRows");
  wrap.innerHTML = qeditFillAnswerState
    .map((ans, idx) => {
      const optionsHtml = qeditFillOptionsState
        .map(
          (opt, j) =>
            `<option value="${j}" ${ans === j ? "selected" : ""}>${qeditTruncate(String(opt.text || "(chưa nhập)"), 30)}</option>`,
        )
        .join("");
      return `\n      <div style="display:flex;align-items:center;gap:8px;">\n        <span style="font-weight:800;color:var(--blue-dark);min-width:100px;">Chỗ trống ${idx + 1}</span>\n        <span>→</span>\n        <select data-qedit-fillans-sel="${idx}" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface2);color:var(--text);font-family:inherit;font-size:14px;">${optionsHtml}</select>\n        <button class="icon-btn" type="button" data-qedit-fillans-remove="${idx}" title="Xoá chỗ trống này">✕</button>\n      </div>`;
    })
    .join("");
  wrap.querySelectorAll("[data-qedit-fillans-sel]").forEach((sel) => {
    sel.onchange = () => {
      qeditFillAnswerState[Number(sel.dataset.qeditFillansSel)] = Number(
        sel.value,
      );
    };
  });
  wrap.querySelectorAll("[data-qedit-fillans-remove]").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.qeditFillansRemove);
      if (qeditFillAnswerState.length <= 1) {
        alert("Cần giữ ít nhất 1 chỗ trống.");
        return;
      }
      qeditFillAnswerState.splice(idx, 1);
      renderQeditFillAnswerRows();
    };
  });
  updateQeditFillBlankHint();
}
function countQeditFillBlanksInQuestion() {
  const text = document.getElementById("qeditFormQuestion").value || "";
  const matches = text.match(/_{3,}/g);
  return matches ? matches.length : 0;
}
function updateQeditFillBlankHint() {
  const hintEl = document.getElementById("qeditFillBlankCountHint");
  if (
    !hintEl ||
    !qeditWorkingQuestion ||
    qeditWorkingQuestion.type !== "dragfill"
  )
    return;
  const found = countQeditFillBlanksInQuestion();
  const declared = qeditFillAnswerState.length;
  hintEl.textContent =
    `Câu hỏi đang có ${found} dấu "___" — đang khai báo ${declared} dòng "Chỗ trống" ở trên.` +
    (found === declared ? "" : " ⚠️ Số lượng đang LỆCH NHAU, kiểm tra lại.");
  hintEl.style.color = found === declared ? "var(--muted)" : "#d64545";
}
function renderQeditForm(q) {
  document.getElementById("qeditFormQuestion").value = q.question || "";
  document.getElementById("qeditFormHint").value = q.hint || "";
  document.getElementById("qeditFormExplain").value = q.explain || "";
  const optionsGroup = document.getElementById("qeditOptionsGroup");
  const orderingGroup = document.getElementById("qeditOrderingGroup");
  const listGroup = document.getElementById("qeditListGroup");
  const matchingGroup = document.getElementById("qeditMatchingGroup");
  const classifyGroup = document.getElementById("qeditClassifyGroup");
  const positionGroup = document.getElementById("qeditPositionGroup");
  const imgPointGroup = document.getElementById("qeditImagePointGroup");
  const fillGroup = document.getElementById("qeditFillGroup");
  const selectfillTemplateGroup = document.getElementById(
    "qeditSelectfillTemplateGroup",
  );
  optionsGroup.style.display = "none";
  orderingGroup.style.display = "none";
  listGroup.style.display = "none";
  matchingGroup.style.display = "none";
  classifyGroup.style.display = "none";
  positionGroup.style.display = "none";
  imgPointGroup.style.display = "none";
  fillGroup.style.display = "none";
  selectfillTemplateGroup.style.display = "none";
  document.getElementById("qeditOptionsFillHint").style.display = "none";
  if (q.type === "single" || q.type === "multiple" || q.type === "selectfill") {
    optionsGroup.style.display = "block";
    document.getElementById("qeditFormOptionsLabel").textContent =
      q.type === "multiple"
        ? "Các lựa chọn (tick TẤT CẢ đáp án đúng — có thể nhiều hơn 1)"
        : q.type === "selectfill"
          ? "Ngân hàng lựa chọn (dùng chung cho các dropdown)"
          : "Các lựa chọn (tick đúng 1 đáp án đúng)";
    document.getElementById("qeditOptionsFillHint").style.display =
      q.type === "selectfill" ? "block" : "none";
    qeditOptionsState = (Array.isArray(q.options) ? q.options : ["", ""]).map(
      (t, i) => ({
        text: t,
        image:
          Array.isArray(q.optionImages) &&
          q.optionImages[i] &&
          q.optionImages[i].src
            ? q.optionImages[i].src
            : "",
      }),
    );
    qeditAnswerState =
      q.type === "multiple"
        ? Array.isArray(q.answer)
          ? q.answer.slice()
          : []
        : typeof q.answer === "number"
          ? q.answer
          : 0;
    renderQeditOptionsRows();
    if (q.type === "selectfill") {
      selectfillTemplateGroup.style.display = "block";
      const templateInput = document.getElementById(
        "qeditSelectfillTemplateInput",
      );
      templateInput.value = q.template || "";
      const indices = extractSelectfillBlankIndices(q.template || "");
      const ansArr = Array.isArray(q.answer) ? q.answer : [];
      const boArr = Array.isArray(q.blankOptions) ? q.blankOptions : [];
      qeditSelectfillBlanksState = indices.map((bi) => ({
        blankIndex: bi,
        answer: typeof ansArr[bi] === "number" ? ansArr[bi] : 0,
        allowed: Array.isArray(boArr[bi])
          ? boArr[bi].slice()
          : boArr[bi] && Array.isArray(boArr[bi].allowed)
            ? boArr[bi].allowed.slice()
            : [],
      }));
      renderQeditSelectfillBlanksRows();
    }
  } else if (q.type === "dragfill") {
    fillGroup.style.display = "block";
    qeditFillOptionsState = (
      Array.isArray(q.options) && q.options.length ? q.options : ["", ""]
    ).map((t) => ({ text: t }));
    qeditFillAnswerState =
      Array.isArray(q.answer) && q.answer.length ? q.answer.slice() : [0];
    renderQeditFillOptionsRows();
    renderQeditFillAnswerRows();
  } else if (q.type === "ordering") {
    orderingGroup.style.display = "block";
    const items = Array.isArray(q.items) ? q.items : ["", ""];
    const answerOrder =
      Array.isArray(q.answerOrder) && q.answerOrder.length === items.length
        ? q.answerOrder
        : items.map((_, i) => i);
    qeditItemsState = answerOrder.map((idx) => items[idx]);
    renderQeditOrderingRows();
  } else if (q.type === "list") {
    listGroup.style.display = "block";
    qeditListItemsState = (
      Array.isArray(q.items)
        ? q.items
        : [{ label: "", options: ["", ""], answer: 0 }]
    ).map((it) => ({
      label: it.label || "",
      options:
        Array.isArray(it.options) && it.options.length
          ? it.options.slice()
          : ["", ""],
      answer: typeof it.answer === "number" ? it.answer : 0,
    }));
    renderQeditListItemsRows();
  } else if (q.type === "matching") {
    matchingGroup.style.display = "block";
    qeditMatchLeftState = Array.isArray(q.left) ? q.left.slice() : ["", ""];
    qeditMatchRightState = Array.isArray(q.right) ? q.right.slice() : ["", ""];
    qeditMatchAnswerState = (
      Array.isArray(q.correctMap) ? q.correctMap : []
    ).map((v) =>
      Array.isArray(v) ? v[0] || 0 : typeof v === "number" ? v : 0,
    );
    while (qeditMatchAnswerState.length < qeditMatchLeftState.length)
      qeditMatchAnswerState.push(0);
    renderQeditMatchLeftRows();
    renderQeditMatchRightRows();
    renderQeditMatchAnswerRows();
  } else if (q.type === "classify" || q.type === "classify2") {
    classifyGroup.style.display = "block";
    qeditClassifyHasColor = q.type === "classify";
    document.getElementById("qeditClassifyZonesLabel").textContent =
      qeditClassifyHasColor
        ? "Các nhóm/vùng phân loại (chọn màu để phân biệt trực quan)"
        : "Các nhóm/vùng phân loại (dạng nhãn kéo-thả, không cần màu)";
    document.getElementById("qeditClassifyItemsLabel").textContent =
      qeditClassifyHasColor
        ? "Các mục cần phân loại (học sinh sẽ KÉO từng mục này vào đúng nhóm)"
        : "Các mục cần phân loại (học sinh sẽ KÉO nhãn nhóm thả vào từng mục này)";
    qeditZonesState = (
      Array.isArray(q.zones)
        ? q.zones
        : [{ label: "Nhóm A" }, { label: "Nhóm B" }]
    ).map((z) => ({ label: z.label || "", color: z.color || "#2f6fed" }));
    qeditClassifyItemsState = Array.isArray(q.items)
      ? q.items.map((it) => (it && typeof it === "object" ? { ...it } : it))
      : ["", ""];
    qeditClassifyItemImageTargetIdx = null;
    qeditClassifyAnswerState = Array.isArray(q.answer) ? q.answer.slice() : [];
    while (qeditClassifyAnswerState.length < qeditClassifyItemsState.length)
      qeditClassifyAnswerState.push(0);
    qeditClassifyDistractorsState = Array.isArray(q.distractors)
      ? q.distractors.map((it) =>
          it && typeof it === "object" ? { ...it } : it,
        )
      : [];
    qeditClassifyDistractorImageTargetIdx = null;
    renderQeditClassifyZonesRows();
    renderQeditClassifyItemsRows();
    renderQeditClassifyDistractorsRows();
  } else if (q.type === "position") {
    positionGroup.style.display = "block";
    qeditPositionState = (
      Array.isArray(q.toolbar)
        ? q.toolbar
        : [
            { icon: "", label: "" },
            { icon: "", label: "" },
          ]
    ).map((item) =>
      typeof item === "string"
        ? { icon: "", label: item }
        : { icon: item.icon || "", label: item.label || "" },
    );
    qeditPositionAnswerState = typeof q.answer === "number" ? q.answer : 0;
    renderQeditPositionRows();
  } else if (q.type === "imagepoint") {
    imgPointGroup.style.display = "block";
    document.getElementById("qeditImgPointImagePath").value = q.image || "";
    qeditImgPointIsMulti = Array.isArray(q.answer);
    document.getElementById("qeditImgPointMode").value = qeditImgPointIsMulti
      ? "multi"
      : "single";
    qeditImgPointState = (
      Array.isArray(q.points)
        ? q.points
        : [{ x: 10, y: 10, width: "", height: "", label: "" }]
    ).map((pt) => ({
      x: typeof pt.x === "number" ? pt.x : "",
      y: typeof pt.y === "number" ? pt.y : "",
      width: typeof pt.width === "number" ? pt.width : "",
      height: typeof pt.height === "number" ? pt.height : "",
      label: pt.label || "",
    }));
    qeditImgPointAnswerState = qeditImgPointIsMulti
      ? Array.isArray(q.answer)
        ? q.answer.slice()
        : []
      : typeof q.answer === "number"
        ? q.answer
        : 0;
    renderQeditImgPointRows();
    qeditImgPointAddMode = false;
    const addModeToggleEl = document.getElementById(
      "qeditImgPointAddModeToggle",
    );
    if (addModeToggleEl) addModeToggleEl.checked = false;
    const previewWrapEl = document.getElementById("qeditImgPointPreviewWrap");
    if (previewWrapEl) {
      previewWrapEl.style.display = "none";
      previewWrapEl.innerHTML = "";
    }
  }
}
function collectQeditFormToObject() {
  const merged = JSON.parse(JSON.stringify(qeditWorkingQuestion));
  merged.question = document.getElementById("qeditFormQuestion").value;
  const hintVal = document.getElementById("qeditFormHint").value;
  if (hintVal) merged.hint = hintVal;
  else delete merged.hint;
  merged.explain = document.getElementById("qeditFormExplain").value;
  if (merged.type === "single" || merged.type === "multiple") {
    merged.options = qeditOptionsState.map((o) => o.text);
    merged.answer =
      merged.type === "multiple"
        ? Array.isArray(qeditAnswerState)
          ? qeditAnswerState.slice()
          : []
        : typeof qeditAnswerState === "number"
          ? qeditAnswerState
          : 0;
    if (qeditOptionsState.some((o) => o.image))
      merged.optionImages = qeditOptionsState.map((o) =>
        o.image ? { src: o.image } : null,
      );
    else delete merged.optionImages;
  } else if (merged.type === "selectfill") {
    merged.options = qeditOptionsState.map((o) => o.text);
    merged.template = document.getElementById(
      "qeditSelectfillTemplateInput",
    ).value;
    const maxBlank = qeditSelectfillBlanksState.reduce(
      (m, b) => Math.max(m, b.blankIndex),
      -1,
    );
    const ansArr = new Array(maxBlank + 1).fill(0);
    const boArr = new Array(maxBlank + 1).fill(null);
    qeditSelectfillBlanksState.forEach((b) => {
      ansArr[b.blankIndex] = b.answer;
      boArr[b.blankIndex] =
        Array.isArray(b.allowed) && b.allowed.length ? b.allowed.slice() : null;
    });
    merged.answer = ansArr;
    if (boArr.some((x) => x !== null))
      merged.blankOptions = boArr.map((x) => ({
        allowed: x || qeditOptionsState.map((_, i) => i),
      }));
    else delete merged.blankOptions;
    delete merged.optionImages;
  } else if (merged.type === "dragfill") {
    merged.options = qeditFillOptionsState.map((o) => o.text);
    merged.answer = qeditFillAnswerState.slice();
  } else if (merged.type === "ordering") {
    merged.items = qeditItemsState.slice();
    merged.answerOrder = qeditItemsState.map((_, i) => i);
  } else if (merged.type === "list")
    merged.items = qeditListItemsState.map((it) => ({
      label: it.label,
      options: it.options.slice(),
      answer: it.answer,
    }));
  else if (merged.type === "matching") {
    merged.left = qeditMatchLeftState.map((it) =>
      it && typeof it === "object" ? { ...it } : it,
    );
    merged.right = qeditMatchRightState.slice();
    merged.correctMap = qeditMatchAnswerState.slice();
  } else if (merged.type === "classify" || merged.type === "classify2") {
    merged.zones = qeditZonesState.map((z) =>
      qeditClassifyHasColor
        ? { label: z.label, color: z.color }
        : { label: z.label },
    );
    merged.items = qeditClassifyItemsState.map((it) =>
      it && typeof it === "object" ? { ...it } : it,
    );
    merged.answer = qeditClassifyAnswerState.slice();
    const distractorsOut = qeditClassifyDistractorsState
      .map((it) => (it && typeof it === "object" ? { ...it } : it))
      .filter((it) =>
        it && typeof it === "object"
          ? it.image || (it.label && String(it.label).trim())
          : String(it || "").trim(),
      );
    if (distractorsOut.length) merged.distractors = distractorsOut;
    else delete merged.distractors;
  } else if (merged.type === "position") {
    merged.toolbar = qeditPositionState.map((item) => ({
      icon: item.icon,
      label: item.label,
    }));
    merged.answer = qeditPositionAnswerState;
  } else if (merged.type === "imagepoint") {
    merged.image = document
      .getElementById("qeditImgPointImagePath")
      .value.trim();
    merged.points = qeditImgPointState.map((pt) => {
      const p = {
        x: pt.x === "" ? 0 : Number(pt.x),
        y: pt.y === "" ? 0 : Number(pt.y),
      };
      if (pt.width !== "" && pt.width !== void 0 && pt.width !== null)
        p.width = Number(pt.width);
      if (pt.height !== "" && pt.height !== void 0 && pt.height !== null)
        p.height = Number(pt.height);
      if (pt.label) p.label = pt.label;
      return p;
    });
    merged.answer = qeditImgPointIsMulti
      ? Array.isArray(qeditImgPointAnswerState)
        ? qeditImgPointAnswerState.slice()
        : []
      : qeditImgPointAnswerState;
  }
  return merged;
}
const QEDIT_BASIC_SKELETONS = {
  single: {
    id: 0,
    type: "single",
    question: "",
    options: ["", "", "", ""],
    answer: 0,
    explain: "",
  },
  multiple: {
    id: 0,
    type: "multiple",
    question: "",
    options: ["", "", "", ""],
    answer: [0, 1],
    explain: "",
  },
  ordering: {
    id: 0,
    type: "ordering",
    question: "",
    items: ["Bước 1", "Bước 2", "Bước 3"],
    answerOrder: [0, 1, 2],
    explain: "",
  },
  matching: {
    id: 0,
    type: "matching",
    question: "",
    hint: "",
    left: ["", ""],
    right: ["", ""],
    correctMap: [0, 1],
    explain: "",
  },
  position: {
    id: 0,
    type: "position",
    question: "",
    hint: "",
    toolbar: [
      { icon: "", label: "" },
      { icon: "", label: "" },
      { icon: "", label: "" },
    ],
    answer: 0,
    explain: "",
  },
  list: {
    id: 0,
    type: "list",
    question: "",
    hint: "",
    items: [{ label: "", options: ["Đúng", "Sai"], answer: 0 }],
    explain: "",
  },
  imagepoint: {
    id: 0,
    type: "imagepoint",
    question: "",
    hint: "",
    image: "image/ten-anh.png",
    points: [
      { x: 10, y: 10, width: 20, height: 10 },
      { x: 40, y: 10, width: 20, height: 10 },
    ],
    answer: 0,
    explain: "",
  },
  dragfill: {
    id: 0,
    type: "dragfill",
    question: "",
    hint: "",
    options: ["", ""],
    answer: [0, 1],
    explain: "",
  },
  selectfill: {
    id: 0,
    type: "selectfill",
    question: "",
    hint: "",
    template: "Ví dụ: câu có {0} và {1}...",
    options: ["", "", ""],
    answer: [0, 0],
    explain: "",
  },
  classify: {
    id: 0,
    type: "classify",
    question: "",
    hint: "",
    zones: [
      { label: "Nhóm A", color: "#2f6fed" },
      { label: "Nhóm B", color: "#1f9d55" },
    ],
    items: ["", ""],
    answer: [0, 1],
    explain: "",
  },
  classify2: {
    id: 0,
    type: "classify2",
    question: "",
    hint: "",
    zones: [{ label: "Nhóm A" }, { label: "Nhóm B" }],
    items: ["", ""],
    answer: [0, 1],
    explain: "",
  },
};
function qeditTruncate(str, n) {
  const s = String(str || "")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > n ? s.slice(0, n) + "…" : s;
}
function renderQuestionEditorList() {
  const listEl = document.getElementById("questionEditorList");
  if (!listEl) return;
  const filterRaw =
    (document.getElementById("qeditSearchInput") || {}).value || "";
  const filter = filterRaw.trim().toLowerCase();
  const rows = QUIZ.filter((q) => {
    if (!filter) return true;
    return (
      String(q.id).includes(filter) ||
      String(q.question || "")
        .toLowerCase()
        .includes(filter)
    );
  });
  if (rows.length === 0) {
    listEl.innerHTML = `<div class="hint">Không có câu hỏi nào (hoặc không khớp tìm kiếm).</div>`;
    return;
  }
  listEl.innerHTML = rows
    .map((q) => {
      const safeQ = qeditTruncate(q.question, 90)
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `\n      <div style="border:1px solid var(--border);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">\n        <span style="font-weight:800;color:var(--blue-dark);min-width:34px;">#${q.id}</span>\n        <span class="stat-pill" style="font-size:11px;" title="${escapeHtml(qtypeLabel(q.type))}">${qtypeLabel(q.type)}</span>\n        <span style="flex:1;min-width:200px;">${safeQ || "<i>(chưa có nội dung)</i>"}</span>\n        <button class="btn btn-ghost" type="button" data-qedit-action="edit" data-qedit-id="${q.id}">✏️ Sửa</button>\n        <button class="btn btn-ghost" type="button" data-qedit-action="dup" data-qedit-id="${q.id}">📄 Nhân bản</button>\n        <button class="btn btn-danger" type="button" data-qedit-action="del" data-qedit-id="${q.id}">🗑️ Xoá</button>\n      </div>`;
    })
    .join("");
  listEl.querySelectorAll("[data-qedit-action]").forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.dataset.qeditId);
      const action = btn.dataset.qeditAction;
      const q = QUIZ.find((x) => x.id === id);
      if (!q) return;
      if (action === "edit") openQuestionEditModal(q, id);
      else if (action === "dup") duplicateQuestionInEditor(q);
      else if (action === "del") deleteQuestionInEditor(id);
    };
  });
}
function nextQuestionEditorId() {
  return Math.max(0, ...QUIZ.map((q) => Number(q.id) || 0), 0) + 1;
}
function duplicateQuestionInEditor(original) {
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = nextQuestionEditorId();
  openQuestionEditModal(copy, null);
}
function deleteQuestionInEditor(id) {
  const q = QUIZ.find((x) => x.id === id);
  if (!q) return;
  if (
    !confirm(
      `Xoá hẳn câu hỏi #${id} ("${qeditTruncate(q.question, 60)}")?\nNhớ bấm "Đẩy toàn bộ câu hỏi đang có lên Firebase" sau khi xoá để đồng bộ.`,
    )
  )
    return;
  const idx = QUIZ.findIndex((x) => x.id === id);
  if (idx > -1) QUIZ.splice(idx, 1);
  renderQuestionEditorList();
}
function openQuestionEditModal(question, editingId) {
  qeditEditingId = editingId === void 0 ? question.id : editingId;
  qeditWorkingQuestion = JSON.parse(JSON.stringify(question));
  qeditClassifyItemImageTargetIdx = null;
  qeditMatchLeftImageTargetIdx = null;
  document.getElementById("qeditModalTitle").textContent =
    qeditEditingId === null
      ? "Thêm câu hỏi mới"
      : `Sửa câu hỏi #${question.id}`;
  document.getElementById("qeditError").style.display = "none";
  document.getElementById("qeditImageStatus").textContent = "";
  if (QEDIT_FORM_TYPES.includes(question.type)) {
    qeditFormMode = true;
    document.getElementById("qeditFormArea").style.display = "block";
    document.getElementById("qeditJsonArea").style.display = "none";
    renderQeditForm(question);
  } else {
    qeditFormMode = false;
    document.getElementById("qeditFormArea").style.display = "none";
    document.getElementById("qeditJsonArea").style.display = "block";
    document.getElementById("qeditJsonArea").value = JSON.stringify(
      question,
      null,
      2,
    );
  }
  document.getElementById("questionEditModal").style.display = "flex";
}
function closeQuestionEditModal() {
  document.getElementById("questionEditModal").style.display = "none";
  qeditEditingId = null;
}
function openNewQuestionModalWithType(type) {
  const skeleton = QEDIT_BASIC_SKELETONS[type];
  if (!skeleton) {
    alert("Loại câu hỏi không hợp lệ.");
    return;
  }
  const q = JSON.parse(JSON.stringify(skeleton));
  q.id = nextQuestionEditorId();
  openQuestionEditModal(q, null);
}
async function saveQuestionEditModal() {
  const errBox = document.getElementById("qeditError");
  errBox.style.display = "none";
  let parsed;
  if (qeditFormMode) {
    parsed = collectQeditFormToObject();
    if (!parsed.question || !parsed.question.trim()) {
      errBox.textContent = "Vui lòng nhập nội dung câu hỏi.";
      errBox.style.display = "block";
      return;
    }
    if (parsed.type === "single" || parsed.type === "multiple") {
      if (parsed.options.some((t) => !t || !String(t).trim())) {
        errBox.textContent =
          "Có lựa chọn đang để trống, vui lòng nhập đủ nội dung hoặc xoá lựa chọn đó.";
        errBox.style.display = "block";
        return;
      }
      if (
        parsed.type === "multiple" &&
        (!Array.isArray(parsed.answer) || parsed.answer.length === 0)
      ) {
        errBox.textContent = "Cần tick ít nhất 1 đáp án đúng.";
        errBox.style.display = "block";
        return;
      }
    } else if (parsed.type === "selectfill") {
      if (parsed.options.some((t) => !t || !String(t).trim())) {
        errBox.textContent =
          "Có lựa chọn trong ngân hàng đang để trống, vui lòng nhập đủ nội dung hoặc xoá lựa chọn đó.";
        errBox.style.display = "block";
        return;
      }
      if (
        !parsed.template ||
        !extractSelectfillBlankIndices(parsed.template).length
      ) {
        errBox.textContent =
          'Mẫu câu cần chứa ít nhất 1 chỗ trống dạng {0}, {1}... — nhớ bấm "🔍 Quét chỗ trống" sau khi gõ.';
        errBox.style.display = "block";
        return;
      }
      if (!Array.isArray(parsed.answer) || parsed.answer.length === 0) {
        errBox.textContent =
          'Chưa có dữ liệu chỗ trống — bấm "🔍 Quét chỗ trống" rồi chọn đáp án đúng cho từng chỗ trống.';
        errBox.style.display = "block";
        return;
      }
      if (
        parsed.answer.some(
          (a) => typeof a !== "number" || a < 0 || a >= parsed.options.length,
        )
      ) {
        errBox.textContent =
          "Có chỗ trống đang chọn đáp án không hợp lệ (vượt quá số lựa chọn trong ngân hàng).";
        errBox.style.display = "block";
        return;
      }
      const templateBlanks = extractSelectfillBlankIndices(parsed.template);
      const maxTplBlank = templateBlanks.length
        ? Math.max(...templateBlanks)
        : -1;
      if (maxTplBlank >= parsed.answer.length) {
        errBox.textContent = `Mẫu câu có chỗ trống {${maxTplBlank}} nhưng chưa có đáp án tương ứng — bấm lại "🔍 Quét chỗ trống".`;
        errBox.style.display = "block";
        return;
      }
    } else if (parsed.type === "dragfill") {
      if (parsed.options.some((t) => !t || !String(t).trim())) {
        errBox.textContent =
          "Có từ trong ngân hàng đang để trống, vui lòng nhập đủ nội dung hoặc xoá từ đó.";
        errBox.style.display = "block";
        return;
      }
      if (!Array.isArray(parsed.answer) || parsed.answer.length === 0) {
        errBox.textContent = "Cần khai báo ít nhất 1 chỗ trống.";
        errBox.style.display = "block";
        return;
      }
      const blanksFound = countQeditFillBlanksInQuestion();
      if (blanksFound !== parsed.answer.length) {
        errBox.textContent = `Số dấu "___" trong câu hỏi (${blanksFound}) đang KHÁC số dòng "Chỗ trống" đã khai báo (${parsed.answer.length}), vui lòng kiểm tra lại.`;
        errBox.style.display = "block";
        return;
      }
    } else if (parsed.type === "ordering") {
      if (!Array.isArray(parsed.items) || parsed.items.length < 2) {
        errBox.textContent =
          "Cần ít nhất 2 bước để tạo câu hỏi sắp xếp thứ tự.";
        errBox.style.display = "block";
        return;
      }
      if (parsed.items.some((t) => !t || !String(t).trim())) {
        errBox.textContent =
          "Có bước đang để trống nội dung, vui lòng nhập đủ hoặc xoá bước đó.";
        errBox.style.display = "block";
        return;
      }
    } else if (parsed.type === "list") {
      if (!Array.isArray(parsed.items) || parsed.items.length < 1) {
        errBox.textContent = "Cần ít nhất 1 tiểu mục.";
        errBox.style.display = "block";
        return;
      }
      for (const it of parsed.items) {
        if (!it.label || !String(it.label).trim()) {
          errBox.textContent = "Có tiểu mục chưa nhập nhãn, vui lòng nhập đủ.";
          errBox.style.display = "block";
          return;
        }
        if (!Array.isArray(it.options) || it.options.length < 2) {
          errBox.textContent = `Tiểu mục "${it.label}" cần ít nhất 2 lựa chọn.`;
          errBox.style.display = "block";
          return;
        }
        if (it.options.some((t) => !t || !String(t).trim())) {
          errBox.textContent = `Tiểu mục "${it.label}" có lựa chọn để trống, vui lòng nhập đủ.`;
          errBox.style.display = "block";
          return;
        }
      }
    } else if (parsed.type === "matching") {
      if (!Array.isArray(parsed.left) || parsed.left.length < 2) {
        errBox.textContent = "Cần ít nhất 2 mục ở cột trái.";
        errBox.style.display = "block";
        return;
      }
      if (!Array.isArray(parsed.right) || parsed.right.length < 2) {
        errBox.textContent = "Cần ít nhất 2 mục ở cột phải.";
        errBox.style.display = "block";
        return;
      }
      if (
        parsed.left.some((t) => {
          if (t && typeof t === "object") return !t.image;
          return !t || !String(t).trim();
        }) ||
        parsed.right.some((t) => !t || !String(t).trim())
      ) {
        errBox.textContent =
          "Có mục cột trái/phải đang để trống nội dung (hoặc chưa gắn ảnh), vui lòng nhập đủ hoặc xoá mục đó.";
        errBox.style.display = "block";
        return;
      }
    } else if (parsed.type === "classify" || parsed.type === "classify2") {
      if (!Array.isArray(parsed.zones) || parsed.zones.length < 2) {
        errBox.textContent = "Cần ít nhất 2 nhóm/vùng phân loại.";
        errBox.style.display = "block";
        return;
      }
      if (parsed.zones.some((z) => !z.label || !String(z.label).trim())) {
        errBox.textContent = "Có nhóm/vùng chưa đặt tên, vui lòng nhập đủ.";
        errBox.style.display = "block";
        return;
      }
      if (!Array.isArray(parsed.items) || parsed.items.length < 2) {
        errBox.textContent = "Cần ít nhất 2 mục cần phân loại.";
        errBox.style.display = "block";
        return;
      }
      if (
        parsed.items.some((t) => {
          if (t && typeof t === "object") return !t.image;
          return !t || !String(t).trim();
        })
      ) {
        errBox.textContent =
          "Có mục đang để trống nội dung (hoặc chưa gắn ảnh), vui lòng nhập đủ hoặc xoá mục đó.";
        errBox.style.display = "block";
        return;
      }
      if (
        Array.isArray(parsed.distractors) &&
        parsed.distractors.some((t) => {
          if (t && typeof t === "object")
            return !t.image && !(t.label && String(t.label).trim());
          return !t || !String(t).trim();
        })
      ) {
        errBox.textContent =
          "Có thẻ mồi nhử đang để trống nội dung (hoặc chưa gắn ảnh), vui lòng nhập đủ hoặc xoá thẻ đó.";
        errBox.style.display = "block";
        return;
      }
    } else if (parsed.type === "position") {
      if (!Array.isArray(parsed.toolbar) || parsed.toolbar.length < 2) {
        errBox.textContent = "Cần ít nhất 2 nút trên thanh công cụ.";
        errBox.style.display = "block";
        return;
      }
      if (
        parsed.toolbar.some((item) => !item.label || !String(item.label).trim())
      ) {
        errBox.textContent =
          "Có nút đang để trống nhãn, vui lòng nhập đủ hoặc xoá nút đó.";
        errBox.style.display = "block";
        return;
      }
      if (
        parsed.toolbar.some((item) => !item.icon || !String(item.icon).trim())
      ) {
        errBox.textContent =
          "Có nút đang thiếu icon (biểu tượng), vui lòng nhập đủ cho mỗi nút.";
        errBox.style.display = "block";
        return;
      }
    } else if (parsed.type === "imagepoint") {
      if (!parsed.image || !String(parsed.image).trim()) {
        errBox.textContent = 'Cần nhập đường dẫn ảnh minh hoạ (field "image").';
        errBox.style.display = "block";
        return;
      }
      if (!Array.isArray(parsed.points) || parsed.points.length < 1) {
        errBox.textContent = "Cần ít nhất 1 vị trí trên ảnh.";
        errBox.style.display = "block";
        return;
      }
      if (
        parsed.points.some(
          (pt) =>
            typeof pt.x !== "number" ||
            typeof pt.y !== "number" ||
            isNaN(pt.x) ||
            isNaN(pt.y),
        )
      ) {
        errBox.textContent =
          "Có vị trí đang thiếu toạ độ X hoặc Y, vui lòng nhập đủ số.";
        errBox.style.display = "block";
        return;
      }
      if (Array.isArray(parsed.answer) && parsed.answer.length === 0) {
        errBox.textContent = "Cần tick ít nhất 1 vị trí đúng.";
        errBox.style.display = "block";
        return;
      }
    }
  } else
    try {
      parsed = JSON.parse(document.getElementById("qeditJsonArea").value);
    } catch (err) {
      errBox.textContent = "JSON không hợp lệ: " + err.message;
      errBox.style.display = "block";
      return;
    }
  if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
    errBox.textContent =
      "Nội dung phải là 1 OBJECT câu hỏi (dạng { ... }), không phải mảng hay giá trị đơn.";
    errBox.style.display = "block";
    return;
  }
  if (parsed.id === void 0 || parsed.id === null || parsed.id === "") {
    errBox.textContent =
      'Câu hỏi cần có trường "id" (số nguyên, không trùng câu khác).';
    errBox.style.display = "block";
    return;
  }
  if (!parsed.type) {
    errBox.textContent =
      'Câu hỏi cần có trường "type" (single/multiple/ordering/matching/position/list/imagepoint/dragfill/selectfill/classify/classify2).';
    errBox.style.display = "block";
    return;
  }
  parsed.id = Number(parsed.id);
  if (qeditEditingId !== null) {
    const idx = QUIZ.findIndex((x) => x.id === qeditEditingId);
    if (idx === -1) {
      errBox.textContent =
        "Không tìm thấy câu hỏi gốc để cập nhật (có thể đã bị xoá).";
      errBox.style.display = "block";
      return;
    }
    const dupIdx = QUIZ.findIndex((x, i) => x.id === parsed.id && i !== idx);
    if (dupIdx > -1) {
      errBox.textContent = `ID ${parsed.id} đã tồn tại ở câu khác, hãy chọn ID khác.`;
      errBox.style.display = "block";
      return;
    }
    QUIZ[idx] = parsed;
  } else {
    const dupIdx = QUIZ.findIndex((x) => x.id === parsed.id);
    if (dupIdx > -1) {
      errBox.textContent = `ID ${parsed.id} đã tồn tại, hãy chọn ID khác.`;
      errBox.style.display = "block";
      return;
    }
    QUIZ.push(parsed);
  }
  closeQuestionEditModal();
  renderQuestionEditorList();
  DOM.totalQCount.textContent = QUIZ.length;
  setLog(
    "quizLog",
    "info",
    `Đã lưu câu hỏi #${parsed.id} vào bộ nhớ tạm. Đang tự động đẩy lên Firebase...`,
  );
  const qeditSaveBtn = document.getElementById("qeditSaveBtn");
  const pushQuizBtn = document.getElementById("pushQuizBtn");
  if (qeditSaveBtn) qeditSaveBtn.disabled = true;
  if (pushQuizBtn) pushQuizBtn.disabled = true;
  try {
    const pushResult = await pushQuestionsToFirestore(QUIZ);
    let msg = `✅ Đã lưu câu hỏi #${parsed.id} và đồng bộ ${pushResult.ok}/${pushResult.total} câu lên Firebase (document "quizzes/${pushResult.docId}", môn ${subjectLabel(ACTIVE_SUBJECT)}).`;
    if (pushResult.failList.length)
      msg +=
        `\n⚠️ ${pushResult.failList.length} câu lỗi khi ghi Firebase:\n- ` +
        pushResult.failList.join("\n- ");
    setLog("quizLog", pushResult.failList.length ? "err" : "ok", msg);
    const statusEl = document.getElementById("quizFirebaseStatus");
    if (statusEl && !pushResult.failList.length)
      statusEl.innerHTML =
        "✅ Đã đồng bộ " + pushResult.ok + " câu hỏi lên Firebase.";
  } catch (err) {
    setLog(
      "quizLog",
      "err",
      `Đã lưu câu hỏi #${parsed.id} vào bộ nhớ tạm, nhưng LỖI khi tự động đẩy lên Firebase: ${err.message}. Vui lòng bấm thủ công nút "📤 Đẩy toàn bộ câu hỏi đang có lên Firebase".`,
    );
  } finally {
    if (qeditSaveBtn) qeditSaveBtn.disabled = false;
    if (pushQuizBtn) pushQuizBtn.disabled = false;
  }
}
async function handleQeditImageUpload(file) {
  const statusEl = document.getElementById("qeditImageStatus");
  if (!file || !file.type || !file.type.startsWith("image/")) {
    statusEl.textContent = "❌ File không phải ảnh.";
    return;
  }
  statusEl.textContent = "⏳ Đang tải ảnh lên...";
  try {
    const base64 = await readFileAsBase64(file);
    const ext = extensionFromMime(file.type);
    const path = "image/" + sanitizeQuestionImagePath(file.name) + "." + ext;
    replaceExistingQuestionImageByPath(path);
    const img = {
      id: questionImageSeq++,
      path: path,
      base64: base64,
      mime: file.type || "image/png",
      fileName: file.name,
      sizeLabel: formatBytes(file.size),
      uploadState: "pending",
      uploadedHosts: [],
      uploadError: "",
      autoCopiedOnce: true,
    };
    QUESTION_IMAGES.push(img);
    qimgDbPut(img);
    renderQuestionImageList();
    await uploadQuestionImageEverywhere(img);
    if (img.uploadedHosts && img.uploadedHosts.length)
      if (
        qeditFormMode &&
        qeditWorkingQuestion &&
        (qeditWorkingQuestion.type === "classify" ||
          qeditWorkingQuestion.type === "classify2") &&
        qeditClassifyItemImageTargetIdx !== null
      ) {
        const targetIdx = qeditClassifyItemImageTargetIdx;
        const existing = qeditClassifyItemsState[targetIdx];
        const existingLabel =
          existing && typeof existing === "object"
            ? existing.label || ""
            : existing || "";
        qeditClassifyItemsState[targetIdx] = {
          image: path,
          label: existingLabel,
        };
        qeditClassifyItemImageTargetIdx = null;
        statusEl.innerHTML = `✅ Đã lên site và gắn ảnh cho mục #${targetIdx + 1}: <b>${path}</b>`;
        renderQeditClassifyItemsRows();
      } else if (
        qeditFormMode &&
        qeditWorkingQuestion &&
        (qeditWorkingQuestion.type === "classify" ||
          qeditWorkingQuestion.type === "classify2") &&
        qeditClassifyDistractorImageTargetIdx !== null
      ) {
        const targetIdx = qeditClassifyDistractorImageTargetIdx;
        const existing = qeditClassifyDistractorsState[targetIdx];
        const existingLabel =
          existing && typeof existing === "object"
            ? existing.label || ""
            : existing || "";
        qeditClassifyDistractorsState[targetIdx] = {
          image: path,
          label: existingLabel,
        };
        qeditClassifyDistractorImageTargetIdx = null;
        statusEl.innerHTML = `✅ Đã lên site và gắn ảnh cho thẻ mồi nhử #${targetIdx + 1}: <b>${path}</b>`;
        renderQeditClassifyDistractorsRows();
      } else if (
        qeditFormMode &&
        qeditWorkingQuestion &&
        qeditWorkingQuestion.type === "matching" &&
        qeditMatchLeftImageTargetIdx !== null
      ) {
        const targetIdx = qeditMatchLeftImageTargetIdx;
        const existing = qeditMatchLeftState[targetIdx];
        const existingLabel =
          existing && typeof existing === "object"
            ? existing.label || ""
            : existing || "";
        qeditMatchLeftState[targetIdx] = { image: path, label: existingLabel };
        qeditMatchLeftImageTargetIdx = null;
        statusEl.innerHTML = `✅ Đã lên site và gắn ảnh cho mục trái #${targetIdx + 1}: <b>${path}</b>`;
        renderQeditMatchLeftRows();
        renderQeditMatchAnswerRows();
      } else if (
        qeditFormMode &&
        qeditWorkingQuestion &&
        (qeditWorkingQuestion.type === "single" ||
          qeditWorkingQuestion.type === "multiple") &&
        qeditOptionImageTargetIdx !== null
      ) {
        const targetIdx = qeditOptionImageTargetIdx;
        qeditOptionsState[targetIdx].image = path;
        qeditOptionImageTargetIdx = null;
        statusEl.innerHTML = `✅ Đã lên site và gắn ảnh cho lựa chọn #${targetIdx + 1}: <b>${path}</b>`;
        renderQeditOptionsRows();
      } else if (
        qeditFormMode &&
        qeditWorkingQuestion &&
        qeditWorkingQuestion.type === "imagepoint"
      ) {
        const pathInput = document.getElementById("qeditImgPointImagePath");
        if (pathInput) pathInput.value = path;
        statusEl.innerHTML = `✅ Đã lên site và tự điền đường dẫn ảnh: <b>${path}</b>`;
        const previewWrapEl = document.getElementById(
          "qeditImgPointPreviewWrap",
        );
        if (previewWrapEl && previewWrapEl.style.display === "block")
          renderQeditImgPointPreview();
      } else {
        statusEl.innerHTML = `✅ Đã lên site, đường dẫn: <b>${path}</b> (đã copy vào clipboard — dán vào đúng field JSON, ví dụ "image": "${path}")`;
        copyTextToClipboard(
          path,
          `✅ Đã copy đường dẫn ảnh "${path}" — dán vào đúng field JSON cần thiết.`,
        );
      }
    else
      statusEl.textContent =
        "⚠️ Tải ảnh chưa thành công lên host nào: " +
        (img.uploadError || "không rõ lỗi");
  } catch (err) {
    statusEl.textContent = "❌ Lỗi tải ảnh: " + err.message;
  }
}
(function initQuestionEditorUI() {
  const newBtn = document.getElementById("qeditNewBtn");
  const searchInput = document.getElementById("qeditSearchInput");
  const saveBtn = document.getElementById("qeditSaveBtn");
  const cancelBtn = document.getElementById("qeditCancelBtn");
  const imgInput = document.getElementById("qeditImageInput");
  if (newBtn)
    newBtn.onclick = () => {
      const types = Object.keys(QEDIT_BASIC_SKELETONS);
      const typeInput = prompt(
        "Nhập loại câu hỏi cần thêm (đúng 1 trong các loại sau):\n" +
          types.map(qtypeLabel).join(", "),
        "single",
      );
      if (!typeInput) return;
      const type = typeInput.trim();
      if (!QEDIT_BASIC_SKELETONS[type]) {
        alert(
          "Loại câu hỏi không hợp lệ. Vui lòng chọn 1 trong: " +
            types.map(qtypeLabel).join(", "),
        );
        return;
      }
      openNewQuestionModalWithType(type);
    };
  if (searchInput) searchInput.oninput = () => renderQuestionEditorList();
  if (saveBtn) saveBtn.onclick = saveQuestionEditModal;
  if (cancelBtn) cancelBtn.onclick = closeQuestionEditModal;
  const addOptionBtn = document.getElementById("qeditAddOptionBtn");
  if (addOptionBtn)
    addOptionBtn.onclick = () => {
      qeditOptionsState.push({ text: "" });
      renderQeditOptionsRows();
      renderQeditSelectfillBlanksRows();
    };
  const addOrderingItemBtn = document.getElementById("qeditAddOrderingItemBtn");
  if (addOrderingItemBtn)
    addOrderingItemBtn.onclick = () => {
      qeditItemsState.push("");
      renderQeditOrderingRows();
    };
  const addListItemBtn = document.getElementById("qeditAddListItemBtn");
  if (addListItemBtn)
    addListItemBtn.onclick = () => {
      qeditListItemsState.push({ label: "", options: ["", ""], answer: 0 });
      renderQeditListItemsRows();
    };
  const addMatchLeftBtn = document.getElementById("qeditAddMatchLeftBtn");
  if (addMatchLeftBtn)
    addMatchLeftBtn.onclick = () => {
      qeditMatchLeftState.push("");
      qeditMatchAnswerState.push(0);
      renderQeditMatchLeftRows();
      renderQeditMatchAnswerRows();
    };
  const addMatchRightBtn = document.getElementById("qeditAddMatchRightBtn");
  if (addMatchRightBtn)
    addMatchRightBtn.onclick = () => {
      qeditMatchRightState.push("");
      renderQeditMatchRightRows();
      renderQeditMatchAnswerRows();
    };
  const addClassifyZoneBtn = document.getElementById("qeditAddClassifyZoneBtn");
  if (addClassifyZoneBtn)
    addClassifyZoneBtn.onclick = () => {
      qeditZonesState.push({ label: "", color: "#2f6fed" });
      renderQeditClassifyZonesRows();
      renderQeditClassifyItemsRows();
    };
  const addClassifyItemBtn = document.getElementById("qeditAddClassifyItemBtn");
  if (addClassifyItemBtn)
    addClassifyItemBtn.onclick = () => {
      qeditClassifyItemsState.push("");
      qeditClassifyAnswerState.push(0);
      renderQeditClassifyItemsRows();
    };
  const addClassifyDistractorBtn = document.getElementById(
    "qeditAddClassifyDistractorBtn",
  );
  if (addClassifyDistractorBtn)
    addClassifyDistractorBtn.onclick = () => {
      qeditClassifyDistractorsState.push("");
      renderQeditClassifyDistractorsRows();
    };
  const addPositionBtn = document.getElementById("qeditAddPositionBtn");
  if (addPositionBtn)
    addPositionBtn.onclick = () => {
      qeditPositionState.push({ icon: "", label: "" });
      renderQeditPositionRows();
    };
  const addImgPointBtn = document.getElementById("qeditAddImgPointBtn");
  if (addImgPointBtn)
    addImgPointBtn.onclick = () => {
      qeditImgPointState.push({
        x: "",
        y: "",
        width: "",
        height: "",
        label: "",
      });
      renderQeditImgPointRows();
      qeditSyncImgPointPreview();
    };
  const addFillOptionBtn = document.getElementById("qeditAddFillOptionBtn");
  if (addFillOptionBtn)
    addFillOptionBtn.onclick = () => {
      qeditFillOptionsState.push({ text: "" });
      renderQeditFillOptionsRows();
      renderQeditFillAnswerRows();
    };
  const addFillAnswerBtn = document.getElementById("qeditAddFillAnswerBtn");
  if (addFillAnswerBtn)
    addFillAnswerBtn.onclick = () => {
      qeditFillAnswerState.push(0);
      renderQeditFillAnswerRows();
    };
  const scanBlanksBtn = document.getElementById("qeditScanBlanksBtn");
  if (scanBlanksBtn) scanBlanksBtn.onclick = scanSelectfillBlanks;
  const qeditFormQuestionEl = document.getElementById("qeditFormQuestion");
  if (qeditFormQuestionEl)
    qeditFormQuestionEl.addEventListener("input", updateQeditFillBlankHint);
  const previewImgPointBtn = document.getElementById("qeditPreviewImgPointBtn");
  if (previewImgPointBtn)
    previewImgPointBtn.onclick = renderQeditImgPointPreview;
  const imgPointAddModeToggle = document.getElementById(
    "qeditImgPointAddModeToggle",
  );
  if (imgPointAddModeToggle)
    imgPointAddModeToggle.onchange = () => {
      qeditImgPointAddMode = imgPointAddModeToggle.checked;
      const stage = document.querySelector(
        "#qeditImgPointPreviewWrap .image-stage",
      );
      if (stage) stage.classList.toggle("add-mode", qeditImgPointAddMode);
    };
  const imgPointModeSelect = document.getElementById("qeditImgPointMode");
  if (imgPointModeSelect)
    imgPointModeSelect.onchange = () => {
      qeditImgPointIsMulti = imgPointModeSelect.value === "multi";
      qeditImgPointAnswerState = qeditImgPointIsMulti
        ? typeof qeditImgPointAnswerState === "number"
          ? [qeditImgPointAnswerState]
          : []
        : Array.isArray(qeditImgPointAnswerState)
          ? qeditImgPointAnswerState[0] || 0
          : 0;
      renderQeditImgPointRows();
      qeditSyncImgPointPreview();
    };
  const toggleJsonBtn = document.getElementById("qeditToggleJsonBtn");
  if (toggleJsonBtn)
    toggleJsonBtn.onclick = () => {
      const merged = collectQeditFormToObject();
      qeditFormMode = false;
      document.getElementById("qeditFormArea").style.display = "none";
      document.getElementById("qeditJsonArea").style.display = "block";
      document.getElementById("qeditJsonArea").value = JSON.stringify(
        merged,
        null,
        2,
      );
    };
  if (imgInput)
    imgInput.onchange = (e) => {
      const f = e.target.files[0];
      if (f) handleQeditImageUpload(f);
      e.target.value = "";
    };
  renderQuestionEditorList();
  let qeditLastLen = -1;
  setInterval(() => {
    if (QUIZ.length !== qeditLastLen) {
      qeditLastLen = QUIZ.length;
      if (document.getElementById("questionEditModal").style.display !== "flex")
        renderQuestionEditorList();
    }
  }, 900);
})();
loadState();
renderAll();
loadQuestionsFromApi();
function renderResultRecipientNotice() {
  const el = document.getElementById("resultRecipientNotice");
  if (!el) return;
  const active =
    EMAIL_LIST.find((e) => e.id === ACTIVE_EMAIL_ID) || EMAIL_LIST[0];
  const label = active ? active.label || active.id : "Mặc định";
  el.style.display = "flex";
  el.innerHTML = "📧 Kết quả sẽ gửi đến <b>" + escapeHtml(label) + "</b>";
}
function renderEmailSelect() {
  renderResultRecipientNotice();
}
const hostSelectEl = document.getElementById("hostSelect");
const refreshHostListBtn = document.getElementById("refreshHostListBtn");
if (hostSelectEl)
  hostSelectEl.onchange = () => {
    ACTIVE_HOST_ID = hostSelectEl.value;
    syncActiveHost();
    saveState();
    renderHostStatus();
    setLog(
      "downloadLog",
      "info",
      "Đã chuyển sang host lưu file bài: " +
        (HOST_LIST.find((h) => h.id === ACTIVE_HOST_ID) || {}).label +
        ". Lựa chọn này chỉ áp dụng cho trình duyệt này.",
    );
  };
if (refreshHostListBtn)
  refreshHostListBtn.onclick = () => {
    loadHostListFromApi().then(() => {
      if (ACTIVE_HOST_IS_CONFIGURED)
        loadHostUsageList(
          HOST_LIST.map((h) => h.id),
          true,
        );
    });
  };
const questionImageInputEl = document.getElementById("questionImageInput");
const clearQuestionImagesBtnEl = document.getElementById(
  "clearQuestionImagesBtn",
);
if (questionImageInputEl)
  questionImageInputEl.onchange = async (e) => {
    await handleQuestionImageFiles(e.target.files);
    e.target.value = "";
  };
if (clearQuestionImagesBtnEl)
  clearQuestionImagesBtnEl.onclick = () => clearQuestionImages();
renderQuestionImageList();
loadQuestionImagesFromIndexedDB();
loadSharedQuestionImagesRegistry();
async function importOldHostsAndEmails() {
  const logId = "importOldDataLog";
  setLog(
    logId,
    "info",
    "⏳ Đang đọc dữ liệu cũ từ Google Sheet (HostSync + EmailScriptsSync)...",
  );
  let oldHosts = [],
    oldEmails = [];
  try {
    [oldHosts, oldEmails] = await Promise.all([
      fetchHostSheetJSONP_LEGACY(),
      fetchEmailSheetJSONP_LEGACY(),
    ]);
  } catch (err) {
    setLog(
      logId,
      "err",
      "❌ Không đọc được dữ liệu từ Google Sheet: " + err.message,
    );
    return;
  }
  if (!oldHosts.length && !oldEmails.length) {
    setLog(
      logId,
      "err",
      "Google Sheet không có dòng host/mail hợp lệ nào để import.",
    );
    return;
  }
  setLog(
    logId,
    "info",
    `⏳ Đang ghi ${oldHosts.length} host + ${oldEmails.length} mail vào Firestore...`,
  );
  let okHost = 0,
    okEmail = 0;
  const failList = [];
  for (const h of oldHosts)
    try {
      await adminSave(
        "hosts",
        { label: h.label, token: h.token, owner: h.owner, repo: h.repo, branch: h.branch, pagesUrl: h.pagesUrl },
        h.id,
      );
      okHost++;
    } catch (err) {
      failList.push(`host "${h.label}": ${err.message}`);
    }
  for (const e of oldEmails)
    try {
      await adminSave("emails", { label: e.label, url: e.url }, e.id);
      okEmail++;
    } catch (err) {
      failList.push(`mail "${e.label}": ${err.message}`);
    }
  const summary = `✅ Đã import ${okHost}/${oldHosts.length} host và ${okEmail}/${oldEmails.length} mail vào Firestore.`;
  if (failList.length)
    setLog(
      logId,
      "err",
      summary +
        `\n⚠️ ${failList.length} mục bị lỗi:\n- ` +
        failList.join("\n- "),
    );
  else {
    setLog(
      logId,
      "ok",
      summary + `\nBấm "🔄 Tải lại danh sách" ở 2 mục phía trên để xác nhận.`,
    );
    loadHostListFromApi();
    loadEmailListFromApi();
  }
}
const importOldDataBtn = document.getElementById("importOldDataBtn");
if (importOldDataBtn)
  importOldDataBtn.onclick = () => {
    if (
      !confirm(
        "Đọc toàn bộ host + mail từ Google Sheet hiện tại rồi ghi (merge) vào Firestore?\nCó thể chạy lại nhiều lần an toàn.",
      )
    )
      return;
    importOldHostsAndEmails();
  };
loadEmailListFromApi();
loadHostListFromApi();
document.querySelectorAll(".card").forEach((card) => {
  const h2 = card.querySelector(":scope > h2");
  const desc = card.querySelector(":scope > .desc");
  if (!h2 || !desc) return;
  desc.classList.add("collapsed");
  const toggle = document.createElement("span");
  toggle.className = "desc-toggle";
  toggle.textContent = "ℹ️ Xem hướng dẫn";
  toggle.onclick = (e) => {
    e.stopPropagation();
    const hidden = desc.classList.toggle("collapsed");
    toggle.textContent = hidden ? "ℹ️ Xem hướng dẫn" : "🔼 Ẩn hướng dẫn";
  };
  h2.appendChild(toggle);
});
document.querySelectorAll(".card").forEach((card) => {
  const h2 = card.querySelector(":scope > h2");
  if (!h2) return;
  const chevron = document.createElement("span");
  chevron.className = "card-chevron";
  chevron.textContent = "▾";
  h2.appendChild(chevron);
  h2.addEventListener("click", (e) => {
    if (e.target.closest(".desc-toggle")) return;
    card.classList.toggle("collapsed");
  });
});
const USER_LOGIN_MAX_ATTEMPTS = 3;
let userLoginAttemptsLeft = USER_LOGIN_MAX_ATTEMPTS;
let USER_DIRECTORY = [];
let USER_DIRECTORY_LOADING = null;
let CURRENT_ADMIN_USER = null;
const SESSION_HEARTBEAT_INTERVAL_MS = 45e3;
const APP_SESSION_ID =
  window.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : "sess-" + Date.now() + "-" + Math.random().toString(36).slice(2);
let sessionHeartbeatTimer = null;
function normalizeNameForCompare(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
const TEAMGV_LOGIN_NAME = "teamgv";
const TEAMGV_ONLY_CARD_IDS = [
  "cardResults",
  "cardQuestionImages",
  "cardQuestionBank",
  "cardQuestionEditor",
];
function isTeamGVUser(user) {
  return !!user && normalizeNameForCompare(user.ten) === TEAMGV_LOGIN_NAME;
}
function applyRoleVisibility(user) {
  const fullAccess = isTeamGVUser(user);
  TEAMGV_ONLY_CARD_IDS.forEach((id) => {
    const card = document.getElementById(id);
    if (card) card.style.display = fullAccess ? "" : "none";
  });
}
function applyDevToolsLock(user) {
  if (isTeamGVUser(user)) return;
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });
  document.addEventListener("keydown", function (e) {
    const key = String(e.key || "").toLowerCase();
    const ctrlOrCmd = e.ctrlKey || e.metaKey;
    if (key === "f12") {
      e.preventDefault();
      return false;
    }
    if (
      ctrlOrCmd &&
      e.shiftKey &&
      (key === "i" || key === "j" || key === "c")
    ) {
      e.preventDefault();
      return false;
    }
    if (ctrlOrCmd && key === "u") {
      e.preventDefault();
      return false;
    }
    if (ctrlOrCmd && key === "s") {
      e.preventDefault();
      return false;
    }
  });
}
function fetchUserDirectory() {
  if (!USER_DIRECTORY_LOADING)
    USER_DIRECTORY_LOADING = fetch(
      USER_DIRECTORY_URL + "?action=list&_=" + Date.now(),
    )
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((json) => {
        if (!json || json.ok === false || !Array.isArray(json.rows))
          throw new Error(
            (json && json.error) || "Dữ liệu trả về không hợp lệ",
          );
        USER_DIRECTORY = json.rows
          .map((r) => ({
            ten: String(r.ten || "").trim(),
            team: String(r.team || "").trim(),
            email: String(r.email || "").trim(),
            link: String(r.link || "").trim(),
          }))
          .filter((r) => r.ten);
        return USER_DIRECTORY;
      })
      .catch((err) => {
        USER_DIRECTORY_LOADING = null;
        throw err;
      });
  return USER_DIRECTORY_LOADING;
}
function logUserAccess(ten) {
  fetch(
    USER_DIRECTORY_URL +
      "?action=checkin&ten=" +
      encodeURIComponent(ten) +
      "&_=" +
      Date.now(),
  ).catch((err) =>
    console.error("Không ghi được thời gian truy cập lên sheet:", err),
  );
}
function applyLoggedInUserToEmailList(user) {
  if (!user.link) return;
  const syntheticId = "login:" + (user.email || user.ten);
  const label = user.ten + (user.team ? " - " + user.team : "");
  const byEmail = user.email && EMAIL_LIST.find((e) => e.id === user.email);
  const existingSynthetic = EMAIL_LIST.find((e) => e.id === syntheticId);
  if (byEmail) {
    byEmail.url = user.link;
    ACTIVE_EMAIL_ID = byEmail.id;
  } else if (existingSynthetic) {
    existingSynthetic.url = user.link;
    existingSynthetic.label = label;
    ACTIVE_EMAIL_ID = syntheticId;
  } else {
    EMAIL_LIST.unshift({ id: syntheticId, label: label, url: user.link });
    ACTIVE_EMAIL_ID = syntheticId;
  }
  if (typeof syncActiveWebAppUrl === "function") syncActiveWebAppUrl();
  if (typeof saveState === "function") saveState();
  if (typeof renderEmailSelect === "function") renderEmailSelect();
}
function claimUserSession(ten) {
  return fetch(
    USER_DIRECTORY_URL +
      "?action=claim-session&ten=" +
      encodeURIComponent(ten) +
      "&sessionId=" +
      encodeURIComponent(APP_SESSION_ID) +
      "&_=" +
      Date.now(),
  )
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then((json) => {
      if (!json || json.ok === false)
        throw new Error((json && json.error) || "Phản hồi không hợp lệ");
      return json;
    });
}
function startSessionHeartbeat(user) {
  if (isTeamGVUser(user)) return;
  stopSessionHeartbeat();
  sessionHeartbeatTimer = setInterval(() => {
    fetch(
      USER_DIRECTORY_URL +
        "?action=heartbeat&ten=" +
        encodeURIComponent(user.ten) +
        "&sessionId=" +
        encodeURIComponent(APP_SESSION_ID) +
        "&_=" +
        Date.now(),
    )
      .then((res) => res.json())
      .then((json) => {
        if (json && json.kicked) handleSessionKicked();
      })
      .catch((err) => console.error("Lỗi gửi heartbeat phiên đăng nhập:", err));
  }, SESSION_HEARTBEAT_INTERVAL_MS);
  window.addEventListener("beforeunload", releaseSessionOnUnload);
}
function stopSessionHeartbeat() {
  if (sessionHeartbeatTimer) {
    clearInterval(sessionHeartbeatTimer);
    sessionHeartbeatTimer = null;
  }
}
function releaseSessionOnUnload() {
  if (!CURRENT_ADMIN_USER || isTeamGVUser(CURRENT_ADMIN_USER)) return;
  try {
    fetch(
      USER_DIRECTORY_URL +
        "?action=logout&ten=" +
        encodeURIComponent(CURRENT_ADMIN_USER.ten) +
        "&sessionId=" +
        encodeURIComponent(APP_SESSION_ID),
      { keepalive: true },
    ).catch(() => {});
  } catch (err) {}
}
function handleSessionKicked() {
  stopSessionHeartbeat();
  document.body.classList.add("admin-locked");
  const overlay = document.createElement("div");
  overlay.className = "login-overlay";
  overlay.innerHTML =
    '<div class="login-box"><h2>⚠️ Phiên đăng nhập đã kết thúc</h2>' +
    '<p>Tên "' +
    escapeHtml(CURRENT_ADMIN_USER ? CURRENT_ADMIN_USER.ten : "") +
    '" vừa được dùng để đăng nhập ở một thiết bị/trình duyệt khác, nên phiên trên thiết bị này bị đóng lại.</p>' +
    '<button type="button" class="btn btn-primary" onclick="location.reload()">🔄 Tải lại trang</button></div>';
  document.body.appendChild(overlay);
}
function showLoginError(msg) {
  const el = document.getElementById("loginError");
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
}
function hideLoginError() {
  const el = document.getElementById("loginError");
  if (el) el.style.display = "none";
}
function setLoginStatus(msg) {
  const el = document.getElementById("loginStatus");
  if (el) {
    el.textContent = msg || "";
    el.style.display = msg ? "block" : "none";
  }
}
function formatGreetingTime(d) {
  const weekdays = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const pad = (n) => String(n).padStart(2, "0");
  const wd = weekdays[d.getDay()];
  const dateStr =
    pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear();
  const timeStr = pad(d.getHours()) + ":" + pad(d.getMinutes());
  return wd + ", " + dateStr + " · " + timeStr;
}
function unlockAdminApp(user) {
  CURRENT_ADMIN_USER = user;
  document.body.classList.remove("admin-locked");
  const overlay = document.getElementById("loginOverlay");
  if (overlay) {
    const box = overlay.querySelector(".login-box");
    if (box) {
      box.className = "login-box greeting-box";
      box.innerHTML =
        '<p class="greeting-title">☀️ Một ngày làm việc hiệu quả</p>' +
        '<p class="greeting-user">Bạn ' +
        escapeHtml(user.ten) +
        (user.team ? " - Team " + escapeHtml(user.team) : "") +
        "</p>" +
        '<p class="greeting-time">🕐 ' +
        escapeHtml(formatGreetingTime(new Date())) +
        "</p>" +
        '<button type="button" id="greetingStartBtn" class="btn greeting-start-btn">🚀 Bắt đầu</button>';
    }
    const closeGreeting = () => {
      overlay.classList.add("fade-out");
      setTimeout(() => overlay.remove(), 500);
    };
    const startBtn = document.getElementById("greetingStartBtn");
    if (startBtn) startBtn.addEventListener("click", closeGreeting);
    const autoCloseTimer = setTimeout(closeGreeting, 8e3);
    if (startBtn)
      startBtn.addEventListener("click", () => clearTimeout(autoCloseTimer));
  }
  const headerEl = document.querySelector(".header");
  if (headerEl) {
    const badge = document.createElement("div");
    badge.id = "currentAdminBadge";
    badge.textContent =
      "👤 " +
      user.ten +
      (user.team ? " · " + user.team : "") +
      (isTeamGVUser(user) ? " · 👑 Toàn quyền" : "");
    headerEl.appendChild(badge);
  }
  logUserAccess(user.ten);
  applyLoggedInUserToEmailList(user);
  renderResultRecipientNotice();
  applyRoleVisibility(user);
  applyDevToolsLock(user);
  startSessionHeartbeat(user);
}
async function handleLoginSubmit() {
  const input = document.getElementById("loginNameInput");
  const btn = document.getElementById("loginSubmitBtn");
  const raw = input ? input.value : "";
  const typed = normalizeNameForCompare(raw);
  hideLoginError();
  if (!typed) {
    showLoginError("Vui lòng nhập tên.");
    return;
  }
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Đang kiểm tra...";
  }
  setLoginStatus("⏳ Đang tải danh sách để đối chiếu...");
  try {
    const rows = await fetchUserDirectory();
    setLoginStatus("");
    const match = rows.find((u) => normalizeNameForCompare(u.ten) === typed);
    if (match) {
      if (isTeamGVUser(match)) {
        unlockAdminApp(match);
        return;
      }
      setLoginStatus("⏳ Đang kiểm tra phiên đăng nhập...");
      try {
        const claim = await claimUserSession(match.ten);
        if (claim.busy) {
          setLoginStatus("");
          showLoginError(
            '⚠️ Tên "' +
              match.ten +
              '" đang được sử dụng ở một thiết bị/trình duyệt khác' +
              (claim.lastActive
                ? " (hoạt động lúc " + claim.lastActive + ")"
                : "") +
              ". Vui lòng đợi người đó thoát ra rồi thử lại, hoặc liên hệ quản trị viên nếu đây là nhầm lẫn.",
          );
          if (input) {
            input.select();
            input.focus();
          }
          return;
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra phiên đăng nhập:", err);
        setLoginStatus("");
        showLoginError(
          "⚠️ Không kiểm tra được phiên đăng nhập (" +
            (err.message || err) +
            '). Kiểm tra kết nối mạng rồi bấm "Vào hệ thống" để thử lại.',
        );
        return;
      }
      unlockAdminApp(match);
      return;
    }
    userLoginAttemptsLeft--;
    if (userLoginAttemptsLeft <= 0) {
      showLoginError(
        '❌ Không tìm thấy tên "' +
          raw.trim() +
          '" trong danh sách. Bạn đã nhập sai quá số lần cho phép — vui lòng bấm "Thoát" và liên hệ quản trị viên để được cấp/kiểm tra lại tên.',
      );
      if (input) input.disabled = true;
      if (btn) {
        btn.disabled = true;
        btn.style.display = "none";
      }
      return;
    }
    showLoginError(
      '❌ Không tìm thấy tên "' +
        raw.trim() +
        '" trong danh sách. Vui lòng kiểm tra lại chính tả và nhập lại (còn ' +
        userLoginAttemptsLeft +
        " lần thử).",
    );
    if (input) {
      input.select();
      input.focus();
    }
  } catch (err) {
    console.error("Lỗi khi kiểm tra tên đăng nhập:", err);
    showLoginError(
      "⚠️ Không tải được danh sách để kiểm tra (" +
        (err.message || err) +
        '). Kiểm tra kết nối mạng rồi bấm "Vào hệ thống" để thử lại.',
    );
  } finally {
    if (btn && btn.style.display !== "none") {
      btn.disabled = false;
      btn.textContent = "✅ Vào hệ thống";
    }
  }
}
const loginFormEl = document.getElementById("loginForm");
if (loginFormEl)
  loginFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    handleLoginSubmit();
  });
const loginExitBtnEl = document.getElementById("loginExitBtn");
if (loginExitBtnEl)
  loginExitBtnEl.addEventListener("click", () => {
    const overlay = document.getElementById("loginOverlay");
    if (overlay)
      overlay.innerHTML =
        '<div class="login-box"><h2>Đã thoát</h2><p>Bạn có thể đóng tab/cửa sổ này.</p></div>';
    try {
      window.close();
    } catch (err) {}
  });
fetchUserDirectory().catch((err) =>
  console.error("Không tải trước được danh bạ user:", err),
);
