/* =====================================================================
 * shell.js — Thanh menu trái + 5 trang của hệ thống
 *   1. Thông tin đăng nhập
 *   2. Tạo bài            (các khung tạo bài như cũ)
 *   3. Lịch sử tạo bài    (lưu localStorage của user)
 *   4. Dữ liệu tạo bài    (admin: ngân hàng câu hỏi, sửa câu hỏi, ảnh...)
 *   5. Danh sách user     (admin: nhập Excel/JSON, sửa/xoá, lưu trên host)
 *
 * Chạy sau quan-ly-admin.js nên dùng được các hàm/biến toàn cục của file đó
 * (CURRENT_ADMIN_USER, isTeamGVUser, usersAdminApi, setActiveSubject, ...).
 * ===================================================================== */
(function () {
  "use strict";

  const PAGES = [
    { id: "thong-tin", icon: "👤", label: "Thông tin đăng nhập" },
    { id: "tao-bai", icon: "🚀", label: "Tạo bài" },
    { id: "lich-su", icon: "🕘", label: "Lịch sử tạo bài" },
    { id: "du-lieu", icon: "🗂️", label: "Dữ liệu tạo bài", admin: true },
    { id: "danh-sach-user", icon: "👥", label: "Danh sách user", admin: true },
  ];
  const DEFAULT_PAGE = "tao-bai";
  const HISTORY_KEY_PREFIX = "ic3_link_history_v1::";
  const HISTORY_MAX = 500;

  // ---------- tiện ích ----------
  const $ = (id) => document.getElementById(id);
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function norm(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function fmtDateTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return (
      pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes())
    );
  }
  function currentUser() {
    try {
      return typeof CURRENT_ADMIN_USER !== "undefined" ? CURRENT_ADMIN_USER : null;
    } catch (e) {
      return null;
    }
  }
  function isAdmin() {
    const u = currentUser();
    return !!u && typeof isTeamGVUser === "function" && isTeamGVUser(u);
  }
  function copyText(text, okMsg) {
    const done = () => toast(okMsg || "Đã copy.");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, cb) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      cb();
    } catch (e) {}
    ta.remove();
  }
  let toastTimer = null;
  function toast(msg) {
    let el = $("shellToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "shellToast";
      el.style.cssText =
        "position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:10050;" +
        "background:#1e2433;color:#fff;padding:10px 18px;border-radius:999px;font-size:13.5px;" +
        "box-shadow:0 6px 20px rgba(0,0,0,.3);transition:opacity .25s;";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.style.opacity = "0"), 2200);
  }
  function showLog(el, kind, text) {
    if (!el) return;
    el.className = "log show " + kind;
    el.textContent = text;
  }

  // ---------- dựng khung ----------
  const appEl = document.querySelector(".app");
  const headerEl = appEl.querySelector(".header");
  document.body.classList.add("has-shell");

  const sidebar = document.createElement("aside");
  sidebar.className = "shell-sidebar";
  sidebar.innerHTML =
    '<div class="shell-brand">IC3 · Tạo bài<small>Hệ thống quản lý đề</small></div>' +
    '<div class="shell-userchip" id="shellUserChip"><span>Chưa đăng nhập</span></div>' +
    '<nav class="shell-nav" id="shellNav"></nav>' +
    '<div class="shell-sidebar-foot"><button type="button" class="btn" id="shellLogoutBtn">🚪 Đăng xuất</button></div>';
  document.body.appendChild(sidebar);

  const burger = document.createElement("button");
  burger.type = "button";
  burger.className = "shell-burger";
  burger.setAttribute("aria-label", "Mở menu");
  burger.textContent = "☰";
  document.body.appendChild(burger);
  const backdrop = document.createElement("div");
  backdrop.className = "shell-backdrop";
  document.body.appendChild(backdrop);
  const closeSidebar = () => document.body.classList.remove("sidebar-open");
  burger.onclick = () => document.body.classList.toggle("sidebar-open");
  backdrop.onclick = closeSidebar;

  const pagesWrap = document.createElement("div");
  pagesWrap.id = "shellPages";
  headerEl.after(pagesWrap);
  const pageEls = {};
  PAGES.forEach((p) => {
    const sec = document.createElement("section");
    sec.className = "shell-page";
    sec.id = "page-" + p.id;
    pagesWrap.appendChild(sec);
    pageEls[p.id] = sec;
  });

  // ---------- chuyển các khung sẵn có vào đúng trang ----------
  function moveCards(ids, pageId) {
    ids.forEach((id) => {
      const el = $(id);
      if (el) pageEls[pageId].appendChild(el);
    });
  }
  moveCards(
    ["cardSchoolList", "cardWorking", "cardChooseHost", "cardCreateSet", "cardClearData"],
    "tao-bai",
  );

  // Trang Dữ liệu: thanh chọn cấp độ (ngân hàng câu hỏi gắn theo cấp độ đang chọn)
  const levelCard = document.createElement("div");
  levelCard.className = "card";
  levelCard.innerHTML =
    '<h2 style="cursor:default">📖 Chọn cấp độ cần chỉnh sửa dữ liệu</h2>' +
    '<p class="desc">Ngân hàng câu hỏi được lưu riêng theo từng cấp độ. Chọn cấp độ rồi cập nhật/sửa câu hỏi ở các khung bên dưới.</p>' +
    '<div class="level-bar"><select id="dataLevelSelect"></select></div>';
  pageEls["du-lieu"].appendChild(levelCard);
  moveCards(
    ["cardQuestionBank", "cardQuestionEditor", "cardQuestionImages", "cardResults"],
    "du-lieu",
  );
  const levelSelect = $("dataLevelSelect");
  function syncLevelSelect() {
    if (typeof SUBJECTS === "undefined") return;
    if (!levelSelect.options.length) {
      SUBJECTS.forEach((s) => {
        const o = document.createElement("option");
        o.value = s.id;
        o.textContent = s.icon + " " + s.label;
        levelSelect.appendChild(o);
      });
    }
    levelSelect.value = ACTIVE_SUBJECT;
  }
  levelSelect.onchange = () => {
    setActiveSubject(levelSelect.value);
  };

  // ======================================================================
  // Trang 1: Thông tin đăng nhập
  // ======================================================================
  const profileCard = document.createElement("div");
  profileCard.className = "card";
  profileCard.innerHTML = '<h2 style="cursor:default">👤 Thông tin đăng nhập</h2><div id="profileBody"></div>';
  pageEls["thong-tin"].appendChild(profileCard);

  function renderProfile() {
    const body = $("profileBody");
    const u = currentUser();
    if (!u) {
      body.innerHTML = '<p class="hint">Chưa đăng nhập.</p>';
      return;
    }
    const link = String(u.link || "").trim();
    const linkHtml = link
      ? '<div class="link-cell"><a href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(link) +
        '</a><button type="button" class="btn btn-ghost btn-sm" id="profileCopyLink">📋 Copy</button></div>'
      : '<div class="warn-box">⚠️ Tài khoản này chưa có link nhận kết quả nên chưa thể tạo bài. Vui lòng liên hệ quản trị viên.</div>';
    body.innerHTML =
      '<div class="profile-grid">' +
      '<div class="k">Họ và tên</div><div><b>' + esc(u.ten) + "</b>" +
      (isAdmin() ? ' <span class="badge badge-on">Toàn quyền</span>' : "") + "</div>" +
      '<div class="k">Team</div><div>' + (esc(u.team) || "—") + "</div>" +
      '<div class="k">Link app nhận kết quả</div><div>' + linkHtml + "</div>" +
      '<div class="k">Số lần tạo bài</div><div><span class="profile-big">' + (Number(u.soLanTaoBai) || 0) + "</span></div>" +
      '<div class="k">Đăng nhập lúc</div><div>' + esc(fmtDateTime(u.thoiGianTruyCap)) + "</div>" +
      "</div>";
    const cp = $("profileCopyLink");
    if (cp) cp.onclick = () => copyText(link, "Đã copy link nhận kết quả.");
  }
  window.addEventListener("ic3:user-updated", () => {
    renderProfile();
  });

  // ======================================================================
  // Trang 3: Lịch sử tạo bài (localStorage của user)
  // ======================================================================
  const historyCard = document.createElement("div");
  historyCard.className = "card";
  historyCard.innerHTML =
    '<h2 style="cursor:default">🕘 Lịch sử tạo bài</h2>' +
    '<p class="desc">Các link bài bạn đã tạo trên trình duyệt này (tên link, ngày tạo). ' +
    "Dữ liệu được lưu trong <b>bộ nhớ trình duyệt của bạn</b> — đổi máy hoặc xoá dữ liệu trình duyệt thì lịch sử sẽ mất.</p>" +
    '<div class="toolbar">' +
    '<div class="grow"><input type="search" id="historySearch" placeholder="🔎 Tìm theo tên link..."></div>' +
    '<button type="button" class="btn btn-danger" id="historyClearBtn">🗑️ Xoá toàn bộ lịch sử</button></div>' +
    '<div class="table-wrap"><table class="shell-table"><thead><tr>' +
    '<th class="num">#</th><th>Tên link</th><th>Ngày tạo</th><th>Link</th><th></th>' +
    '</tr></thead><tbody id="historyTbody"></tbody></table></div>' +
    '<p class="hint" id="historySummary"></p>';
  pageEls["lich-su"].appendChild(historyCard);

  function historyKey() {
    const u = currentUser();
    return HISTORY_KEY_PREFIX + norm(u ? u.ten : "guest");
  }
  function loadHistory() {
    try {
      const arr = JSON.parse(localStorage.getItem(historyKey()) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }
  function saveHistory(list) {
    try {
      localStorage.setItem(historyKey(), JSON.stringify(list.slice(0, HISTORY_MAX)));
      return true;
    } catch (e) {
      console.error("Không lưu được lịch sử vào localStorage:", e);
      return false;
    }
  }
  // Gọi từ showNetlifyLink() trong quan-ly-admin.js mỗi khi tạo xong 1 link
  window.recordLinkHistory = function (label, url) {
    let name = String(label || "")
      .replace(/^🔗\s*Link bài\s*/i, "")
      .replace(/\s*vừa xuất/i, "")
      .replace(/:\s*$/, "")
      .trim();
    const topicEl = $("customTopicLabelInput");
    const topic = topicEl ? topicEl.value.trim() : "";
    if (topic) name += " — " + topic;
    const list = loadHistory();
    list.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name || "Bài mới",
      url: String(url || ""),
      createdAt: new Date().toISOString(),
    });
    saveHistory(list);
    if (pageEls["lich-su"].classList.contains("active")) renderHistory();
  };

  function renderHistory() {
    const tbody = $("historyTbody");
    const q = norm($("historySearch").value);
    const all = loadHistory();
    const list = all.filter((h) => !q || norm(h.name).includes(q));
    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="empty-cell">' +
        (all.length ? "Không có link nào khớp từ khoá." : "Chưa có link nào. Link sẽ được lưu tại đây sau mỗi lần bạn tạo bài.") +
        "</td></tr>";
    } else {
      tbody.innerHTML = list
        .map(
          (h, i) =>
            "<tr>" +
            '<td class="num">' + (i + 1) + "</td>" +
            "<td>" + esc(h.name) + "</td>" +
            '<td class="nowrap">' + esc(fmtDateTime(h.createdAt)) + "</td>" +
            '<td class="linkcol"><a href="' + esc(h.url) + '" target="_blank" rel="noopener">' + esc(h.url) + "</a></td>" +
            '<td><div class="row-actions">' +
            '<button type="button" class="btn btn-ghost btn-sm" data-act="copy" data-id="' + esc(h.id) + '">📋 Copy</button>' +
            '<button type="button" class="btn btn-danger btn-sm" data-act="del" data-id="' + esc(h.id) + '">🗑️ Xoá</button>' +
            "</div></td></tr>",
        )
        .join("");
    }
    $("historySummary").textContent = all.length
      ? "Tổng cộng " + all.length + " link (lưu tối đa " + HISTORY_MAX + ")."
      : "";
  }
  $("historySearch").oninput = renderHistory;
  $("historyTbody").onclick = (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.act === "copy") {
      const item = loadHistory().find((h) => h.id === id);
      if (item) copyText(item.url, "Đã copy link.");
    } else if (btn.dataset.act === "del") {
      saveHistory(loadHistory().filter((h) => h.id !== id));
      renderHistory();
    }
  };
  $("historyClearBtn").onclick = () => {
    if (!loadHistory().length) return;
    if (!confirm("Xoá toàn bộ lịch sử link đã tạo trên trình duyệt này?")) return;
    saveHistory([]);
    renderHistory();
  };

  // ======================================================================
  // Trang 5: Danh sách user (admin) — lưu trên host (Firestore qua Netlify function)
  // ======================================================================
  const usersCard = document.createElement("div");
  usersCard.className = "card";
  usersCard.innerHTML =
    '<h2 style="cursor:default">👥 Danh sách user</h2>' +
    '<p class="desc">Quản lý tài khoản được phép đăng nhập. Dữ liệu được <b>lưu trên host của hệ thống</b>. ' +
    "Nhập từ Excel (.xlsx) hoặc JSON với các cột: <code>Tên</code>, <code>Team</code>, <code>Link nhận kết quả</code>. " +
    "Cột <b>SessionID</b> do hệ thống tự cấp để chặn một tên bị đăng nhập ở nhiều nơi cùng lúc — " +
    'bấm <b>Gỡ phiên</b> nếu ai đó bị kẹt phiên.</p>' +
    '<div class="toolbar">' +
    '<div class="grow"><input type="search" id="usersSearch" placeholder="🔎 Tìm theo tên, team, link..."></div>' +
    '<button type="button" class="btn btn-primary" id="usersAddBtn">➕ Thêm user</button>' +
    '<button type="button" class="btn btn-ghost" id="usersReloadBtn">🔄 Tải lại</button></div>' +
    '<div class="toolbar">' +
    '<label class="btn btn-ghost file-input-wrap">⬆️ Nhập Excel<input type="file" id="usersImportXlsx" accept=".xlsx,.xls"></label>' +
    '<label class="btn btn-ghost file-input-wrap">⬆️ Nhập JSON<input type="file" id="usersImportJson" accept=".json,application/json"></label>' +
    '<button type="button" class="btn btn-ghost" id="usersExportXlsx">⬇️ Xuất Excel</button>' +
    '<button type="button" class="btn btn-ghost" id="usersExportJson">⬇️ Xuất JSON</button>' +
    '<button type="button" class="btn btn-ghost" id="usersTemplateBtn">📄 File mẫu</button>' +
    '<button type="button" class="btn btn-ghost" id="usersLegacyBtn" title="Lấy danh sách từ Google Sheet đang dùng trước đây">📥 Nhập từ Google Sheet cũ</button>' +
    '<label class="chk"><input type="checkbox" id="usersReplaceMode"> Thay thế toàn bộ (xoá user không có trong file)</label></div>' +
    '<div class="toolbar"><button type="button" class="btn btn-danger" id="usersDeleteSelectedBtn" disabled>🗑️ Xoá các dòng đã chọn</button>' +
    '<span class="hint" id="usersSummary" style="margin:0"></span></div>' +
    '<div id="usersLog" class="log"></div>' +
    '<div class="table-wrap"><table class="shell-table"><thead><tr>' +
    '<th class="num"><input type="checkbox" id="usersSelectAll"></th>' +
    '<th class="num">#</th>' +
    '<th data-sort="ten" class="sortable" style="cursor:pointer;user-select:none" title="Bấm để sắp xếp">Tên<span class="sort-ind"></span></th>' +
    '<th data-sort="team" class="sortable" style="cursor:pointer;user-select:none" title="Bấm để sắp xếp">Team<span class="sort-ind"></span></th>' +
    '<th>Link nhận kết quả</th>' +
    '<th data-sort="time" class="sortable" style="cursor:pointer;user-select:none" title="Bấm để sắp xếp">Thời gian truy cập<span class="sort-ind"></span></th>' +
    '<th data-sort="count" class="num sortable" style="cursor:pointer;user-select:none" title="Bấm để sắp xếp">Số lần tạo bài<span class="sort-ind"></span></th>' +
    '<th>SessionID</th><th></th>' +
    '</tr></thead><tbody id="usersTbody"></tbody></table></div>';
  pageEls["danh-sach-user"].appendChild(usersCard);

  let USERS = [];
  let usersLoaded = false;
  let editingId = null; // id đang sửa, hoặc "__new__"
  const selectedIds = new Set();
  let usersTimer = null;

  const usersLog = () => $("usersLog");

  async function loadUsers(silent) {
    if (!silent) showLog(usersLog(), "info", "⏳ Đang tải danh sách user từ máy chủ...");
    try {
      const res = await usersAdminApi("list", {});
      USERS = res.users || [];
      usersLoaded = true;
      if (!silent) usersLog().className = "log";
      // bỏ chọn các id không còn tồn tại
      [...selectedIds].forEach((id) => {
        if (!USERS.some((u) => u.id === id)) selectedIds.delete(id);
      });
      renderUsers();
    } catch (err) {
      showLog(usersLog(), "err", "❌ Không tải được danh sách user: " + err.message);
    }
  }

  // Sắp xếp danh sách ngay trên trình duyệt (bấm tiêu đề cột: tăng dần -> giảm dần -> về mặc định)
  let usersSort = null; // { key: "ten"|"team"|"time"|"count", dir: 1 | -1 }
  function cmpText(a, b) {
    return String(a || "").trim().localeCompare(String(b || "").trim(), "vi", { numeric: true, sensitivity: "base" });
  }
  function sortUsersList(list) {
    if (!usersSort) return list;
    const { key, dir } = usersSort;
    const timeOf = (u) => Date.parse(u.thoiGianTruyCap) || 0;
    return list.slice().sort((a, b) => {
      let c = 0;
      if (key === "team") {
        // user chưa có team luôn nằm cuối, dù sắp tăng hay giảm
        const ea = !String(a.team || "").trim(), eb = !String(b.team || "").trim();
        if (ea !== eb) return ea ? 1 : -1;
        c = cmpText(a.team, b.team) * dir;
      } else if (key === "time") c = (timeOf(a) - timeOf(b)) * dir;
      else if (key === "count") c = ((Number(a.soLanTaoBai) || 0) - (Number(b.soLanTaoBai) || 0)) * dir;
      else c = cmpText(a.ten, b.ten) * dir;
      return c || cmpText(a.ten, b.ten); // cùng giá trị -> xếp theo tên
    });
  }
  function updateSortIndicators() {
    usersCard.querySelectorAll("th[data-sort]").forEach((th) => {
      const ind = th.querySelector(".sort-ind");
      if (!ind) return;
      ind.textContent =
        usersSort && usersSort.key === th.dataset.sort ? (usersSort.dir === 1 ? " ▲" : " ▼") : "";
    });
  }

  function filteredUsers() {
    const q = norm($("usersSearch").value);
    const base = q ? USERS.filter((u) => norm(u.ten + " " + u.team + " " + u.link).includes(q)) : USERS;
    return sortUsersList(base);
  }

  function userRowHtml(u, idx) {
    if (editingId === u.id) return userEditRowHtml(u, idx);
    const sess = u.sessionId
      ? '<span class="badge ' + (u.online ? "badge-on" : "badge-off") + '">' + (u.online ? "Đang online" : "Hết hạn") +
        '</span><div class="sess-id" title="' + esc(u.sessionId) + '">' + esc(u.sessionId.slice(0, 8)) + "…</div>"
      : '<span class="badge badge-off">Trống</span>';
    const isRoot = norm(u.ten) === "teamgv";
    return (
      "<tr>" +
      '<td class="num"><input type="checkbox" data-sel="' + esc(u.id) + '"' + (selectedIds.has(u.id) ? " checked" : "") + (isRoot ? " disabled" : "") + "></td>" +
      '<td class="num">' + (idx + 1) + "</td>" +
      "<td><b>" + esc(u.ten) + "</b></td>" +
      "<td>" + (esc(u.team) || "—") + "</td>" +
      '<td class="linkcol">' + (u.link ? '<a href="' + esc(u.link) + '" target="_blank" rel="noopener">' + esc(u.link) + "</a>" : '<span class="hint" style="margin:0">Chưa có link</span>') + "</td>" +
      '<td class="nowrap">' + esc(fmtDateTime(u.thoiGianTruyCap)) + "</td>" +
      '<td class="num">' + (Number(u.soLanTaoBai) || 0) + "</td>" +
      "<td>" + sess + "</td>" +
      '<td><div class="row-actions">' +
      '<button type="button" class="btn btn-ghost btn-sm" data-act="edit" data-id="' + esc(u.id) + '">✏️ Sửa</button>' +
      (u.sessionId ? '<button type="button" class="btn btn-ghost btn-sm" data-act="clear" data-id="' + esc(u.id) + '">🔓 Gỡ phiên</button>' : "") +
      (isRoot ? "" : '<button type="button" class="btn btn-danger btn-sm" data-act="del" data-id="' + esc(u.id) + '">🗑️ Xoá</button>') +
      "</div></td></tr>"
    );
  }

  function userEditRowHtml(u, idx) {
    const isNew = editingId === "__new__";
    return (
      '<tr class="row-editing">' +
      '<td class="num"></td><td class="num">' + (isNew ? "＋" : idx + 1) + "</td>" +
      '<td><input type="text" id="editTen" value="' + esc(u.ten) + '" placeholder="Họ và tên"></td>' +
      '<td><input type="text" id="editTeam" value="' + esc(u.team) + '" placeholder="Team"></td>' +
      '<td><input type="text" id="editLink" value="' + esc(u.link) + '" placeholder="https://script.google.com/macros/s/.../exec"></td>' +
      '<td class="nowrap">' + esc(fmtDateTime(u.thoiGianTruyCap)) + "</td>" +
      '<td class="num">' + (Number(u.soLanTaoBai) || 0) + "</td>" +
      '<td><span class="hint" style="margin:0">—</span></td>' +
      '<td><div class="row-actions">' +
      '<button type="button" class="btn btn-primary btn-sm" data-act="save">💾 Lưu</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-act="cancel">Huỷ</button>' +
      "</div></td></tr>"
    );
  }

  function renderUsers() {
    const tbody = $("usersTbody");
    const list = filteredUsers();
    let html = "";
    if (editingId === "__new__") html += userEditRowHtml({ ten: "", team: "", link: "" }, -1);
    if (!list.length && editingId !== "__new__") {
      html +=
        '<tr><td colspan="9" class="empty-cell">' +
        (USERS.length ? "Không có user nào khớp từ khoá." : "Chưa có user nào. Hãy nhập từ Excel/JSON hoặc bấm “Thêm user”.") +
        "</td></tr>";
    } else {
      html += list.map((u, i) => userRowHtml(u, i)).join("");
    }
    tbody.innerHTML = html;
    updateSortIndicators();
    const online = USERS.filter((u) => u.online).length;
    $("usersSummary").textContent = USERS.length
      ? "Tổng " + USERS.length + " user · " + online + " đang online" +
        (selectedIds.size ? " · đã chọn " + selectedIds.size : "")
      : "";
    $("usersDeleteSelectedBtn").disabled = selectedIds.size === 0;
    const all = $("usersSelectAll");
    const selectable = list.filter((u) => norm(u.ten) !== "teamgv");
    all.checked = selectable.length > 0 && selectable.every((u) => selectedIds.has(u.id));
    const first = $("editTen");
    if (first && !first.dataset.focused) {
      first.dataset.focused = "1";
      first.focus();
    }
  }

  async function saveEditingRow() {
    const user = {
      ten: $("editTen").value.trim(),
      team: $("editTeam").value.trim(),
      link: $("editLink").value.trim(),
    };
    if (!user.ten) {
      toast("Tên không được để trống.");
      return;
    }
    if (user.link && !/^https?:\/\//i.test(user.link)) {
      toast("Link phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    try {
      await usersAdminApi("upsert", {
        user,
        originalId: editingId === "__new__" ? "" : editingId,
      });
      editingId = null;
      showLog(usersLog(), "ok", "✅ Đã lưu user “" + user.ten + "” lên host.");
      await loadUsers(true);
    } catch (err) {
      showLog(usersLog(), "err", "❌ " + err.message);
    }
  }

  async function deleteUsers(ids) {
    if (!ids.length) return;
    const names = ids.map((id) => (USERS.find((u) => u.id === id) || {}).ten || id);
    const msg =
      ids.length === 1
        ? "Xoá user “" + names[0] + "”?"
        : "Xoá " + ids.length + " user đã chọn?\n\n" + names.slice(0, 10).join(", ") + (names.length > 10 ? ", ..." : "");
    if (!confirm(msg + "\nHành động này không thể hoàn tác.")) return;
    try {
      const res = await usersAdminApi("delete", { ids });
      ids.forEach((id) => selectedIds.delete(id));
      showLog(usersLog(), "ok", "🗑️ Đã xoá " + res.deleted + " user." + (res.protected ? " (Tài khoản quản trị được giữ lại.)" : ""));
      await loadUsers(true);
    } catch (err) {
      showLog(usersLog(), "err", "❌ " + err.message);
    }
  }

  $("usersTbody").onclick = async (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;
    if (act === "edit") {
      editingId = id;
      renderUsers();
    } else if (act === "cancel") {
      editingId = null;
      renderUsers();
    } else if (act === "save") {
      await saveEditingRow();
    } else if (act === "del") {
      await deleteUsers([id]);
    } else if (act === "clear") {
      try {
        await usersAdminApi("clear-session", { id });
        showLog(usersLog(), "ok", "🔓 Đã gỡ phiên đăng nhập.");
        await loadUsers(true);
      } catch (err) {
        showLog(usersLog(), "err", "❌ " + err.message);
      }
    }
  };
  $("usersTbody").onchange = (e) => {
    const cb = e.target.closest("input[data-sel]");
    if (!cb) return;
    if (cb.checked) selectedIds.add(cb.dataset.sel);
    else selectedIds.delete(cb.dataset.sel);
    renderUsers();
  };
  $("usersTbody").onkeydown = (e) => {
    if (e.key === "Enter" && e.target.closest(".row-editing")) saveEditingRow();
    if (e.key === "Escape" && editingId) {
      editingId = null;
      renderUsers();
    }
  };
  $("usersSelectAll").onchange = (e) => {
    filteredUsers().forEach((u) => {
      if (norm(u.ten) === "teamgv") return;
      if (e.target.checked) selectedIds.add(u.id);
      else selectedIds.delete(u.id);
    });
    renderUsers();
  };
  $("usersDeleteSelectedBtn").onclick = () => deleteUsers([...selectedIds]);
  $("usersSearch").oninput = renderUsers;
  usersCard.querySelector("thead").onclick = (e) => {
    const th = e.target.closest("th[data-sort]");
    if (!th) return;
    const key = th.dataset.sort;
    if (!usersSort || usersSort.key !== key) usersSort = { key, dir: 1 };
    else if (usersSort.dir === 1) usersSort = { key, dir: -1 };
    else usersSort = null;
    renderUsers();
  };
  $("usersAddBtn").onclick = () => {
    editingId = "__new__";
    $("usersSearch").value = "";
    renderUsers();
  };
  $("usersReloadBtn").onclick = () => loadUsers(false);

  // ----- Nhập / xuất -----
  const HEADER_MAP = {
    ten: "ten", hoten: "ten", hovaten: "ten", name: "ten", fullname: "ten", user: "ten", username: "ten", nguoidung: "ten",
    team: "team", nhom: "team", doi: "team", phongban: "team",
    link: "link", linknhanketqua: "link", linkketqua: "link", linkapp: "link", url: "link", webapp: "link", linkappnhanketqua: "link",
    solantaobai: "soLanTaoBai", solan: "soLanTaoBai", sobai: "soLanTaoBai",
  };
  function headerKey(h) {
    return HEADER_MAP[norm(h).replace(/[^a-z0-9]/g, "")] || null;
  }
  function rowsToUsers(rows) {
    const out = [];
    rows.forEach((r) => {
      const u = {};
      Object.keys(r || {}).forEach((k) => {
        const mapped = headerKey(k);
        if (mapped) u[mapped] = r[k];
      });
      if (u.ten && String(u.ten).trim()) out.push(u);
    });
    return out;
  }

  async function runImport(users, sourceLabel) {
    if (!users.length) {
      showLog(usersLog(), "err", "❌ Không tìm thấy dòng hợp lệ nào trong " + sourceLabel + " (cần có cột “Tên”).");
      return;
    }
    const replace = $("usersReplaceMode").checked;
    const msg =
      "Nhập " + users.length + " user từ " + sourceLabel + "?\n\n" +
      (replace
        ? "CHẾ ĐỘ THAY THẾ: user không có trong file sẽ bị XOÁ (trừ tài khoản quản trị)."
        : "Chế độ gộp: user trùng tên sẽ được cập nhật Team/Link, user mới được thêm vào; không xoá ai.");
    if (!confirm(msg)) return;
    showLog(usersLog(), "info", "⏳ Đang lưu lên host...");
    try {
      const res = await usersAdminApi("import", { users, mode: replace ? "replace" : "merge" });
      showLog(
        usersLog(),
        "ok",
        "✅ Nhập xong: thêm mới " + res.added + ", cập nhật " + res.updated +
          (res.removed ? ", xoá " + res.removed : "") + (res.skipped ? ", bỏ qua " + res.skipped + " dòng thiếu tên" : "") + ".",
      );
      await loadUsers(true);
    } catch (err) {
      showLog(usersLog(), "err", "❌ Nhập thất bại: " + err.message);
    }
  }

  $("usersImportXlsx").onchange = async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try {
      if (typeof XLSX === "undefined") throw new Error("Thư viện đọc Excel chưa tải được.");
      const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      await runImport(rowsToUsers(rows), "file Excel “" + f.name + "”");
    } catch (err) {
      showLog(usersLog(), "err", "❌ Không đọc được file Excel: " + err.message);
    }
  };
  $("usersImportJson").onchange = async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const arr = Array.isArray(data) ? data : data.users || data.rows || data.data || [];
      if (!Array.isArray(arr)) throw new Error("JSON phải là một mảng các user.");
      await runImport(rowsToUsers(arr), "file JSON “" + f.name + "”");
    } catch (err) {
      showLog(usersLog(), "err", "❌ Không đọc được file JSON: " + err.message);
    }
  };
  $("usersLegacyBtn").onclick = async () => {
    if (typeof USER_DIRECTORY_URL === "undefined") return;
    showLog(usersLog(), "info", "⏳ Đang lấy danh sách từ Google Sheet cũ...");
    try {
      const res = await fetch(USER_DIRECTORY_URL + "?action=list&_=" + Date.now());
      const json = await res.json();
      if (!json || json.ok === false || !Array.isArray(json.rows)) throw new Error((json && json.error) || "Dữ liệu không hợp lệ");
      usersLog().className = "log";
      await runImport(rowsToUsers(json.rows), "Google Sheet cũ");
    } catch (err) {
      showLog(usersLog(), "err", "❌ Không lấy được từ Google Sheet cũ: " + err.message);
    }
  };

  function xlsxDownload(rows, sheetName, fileName) {
    if (typeof XLSX === "undefined") {
      toast("Thư viện Excel chưa tải được.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 26 }, { wch: 16 }, { wch: 70 }, { wch: 18 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  }
  $("usersExportXlsx").onclick = () => {
    if (!USERS.length) return toast("Chưa có dữ liệu để xuất.");
    xlsxDownload(
      USERS.map((u) => ({
        "Tên": u.ten,
        "Team": u.team,
        "Link nhận kết quả": u.link,
        "Thời gian truy cập": fmtDateTime(u.thoiGianTruyCap),
        "Số lần tạo bài": Number(u.soLanTaoBai) || 0,
      })),
      "Users",
      "danh-sach-user.xlsx",
    );
  };
  $("usersTemplateBtn").onclick = () =>
    xlsxDownload(
      [
        { "Tên": "Nguyễn Văn A", "Team": "Team 1", "Link nhận kết quả": "https://script.google.com/macros/s/XXXX/exec" },
        { "Tên": "Trần Thị B", "Team": "Team 2", "Link nhận kết quả": "https://script.google.com/macros/s/YYYY/exec" },
      ],
      "Users",
      "mau-danh-sach-user.xlsx",
    );
  $("usersExportJson").onclick = () => {
    if (!USERS.length) return toast("Chưa có dữ liệu để xuất.");
    const data = USERS.map((u) => ({
      ten: u.ten,
      team: u.team,
      link: u.link,
      soLanTaoBai: Number(u.soLanTaoBai) || 0,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "danh-sach-user.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  };

  // ======================================================================
  // Điều hướng
  // ======================================================================
  const nav = $("shellNav");
  function buildNav() {
    const admin = isAdmin();
    let html = "";
    let sepDone = false;
    PAGES.forEach((p) => {
      if (p.admin && !admin) return;
      if (p.admin && !sepDone) {
        html += '<div class="shell-nav-label">Quản trị</div>';
        sepDone = true;
      }
      html +=
        '<button type="button" class="shell-nav-item" data-page="' + p.id + '"><span class="ico">' + p.icon +
        "</span><span>" + esc(p.label) + "</span></button>";
    });
    nav.innerHTML = html;
  }
  nav.onclick = (e) => {
    const b = e.target.closest("[data-page]");
    if (!b) return;
    location.hash = "#" + b.dataset.page;
    closeSidebar();
  };

  let activePageId = null;
  function showPage(id) {
    let page = PAGES.find((p) => p.id === id);
    if (!page || (page.admin && !isAdmin())) page = PAGES.find((p) => p.id === DEFAULT_PAGE);
    activePageId = page.id;
    PAGES.forEach((p) => pageEls[p.id].classList.toggle("active", p.id === page.id));
    nav.querySelectorAll(".shell-nav-item").forEach((b) =>
      b.classList.toggle("active", b.dataset.page === page.id),
    );
    const h1 = headerEl.querySelector("h1");
    if (h1) h1.textContent = page.icon + " " + page.label;
    const stats = headerEl.querySelector(".stat-row");
    if (stats) stats.style.display = page.id === "tao-bai" || page.id === "du-lieu" ? "" : "none";

    clearInterval(usersTimer);
    if (page.id === "thong-tin") renderProfile();
    if (page.id === "lich-su") renderHistory();
    if (page.id === "du-lieu") syncLevelSelect();
    if (page.id === "danh-sach-user") {
      loadUsers(usersLoaded);
      // tự làm mới 30s/lần để theo dõi phiên online, trừ khi đang sửa dòng
      usersTimer = setInterval(() => {
        if (!editingId && !document.hidden) loadUsers(true);
      }, 30000);
    }
    window.scrollTo({ top: 0 });
  }
  function routeFromHash() {
    showPage((location.hash || "").replace(/^#\/?/, "") || DEFAULT_PAGE);
  }
  window.addEventListener("hashchange", routeFromHash);

  // ----- đăng xuất -----
  $("shellLogoutBtn").onclick = async () => {
    const u = currentUser();
    if (!u) {
      location.reload();
      return;
    }
    if (!confirm("Đăng xuất khỏi tài khoản “" + u.ten + "”?")) return;
    try {
      if (typeof stopSessionHeartbeat === "function") stopSessionHeartbeat();
      await usersApi("logout", { ten: u.ten, sessionId: APP_SESSION_ID });
    } catch (e) {}
    location.hash = "";
    location.reload();
  };

  // ----- khi đăng nhập xong -----
  function onLoggedIn() {
    const u = currentUser();
    if (!u) return;
    $("shellUserChip").innerHTML =
      "<b>" + esc(u.ten) + "</b><span>" + (esc(u.team) || "—") + (isAdmin() ? " · 👑 Toàn quyền" : "") + "</span>";
    buildNav();
    renderProfile();
    routeFromHash();
  }
  window.addEventListener("ic3:login", onLoggedIn);

  // Trạng thái ban đầu (trước đăng nhập): chỉ hiện trang Tạo bài phía sau lớp khoá
  buildNav();
  showPage(DEFAULT_PAGE);
  if (currentUser()) onLoggedIn();
})();
