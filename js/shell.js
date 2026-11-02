/* =====================================================================
 * shell.js — Thanh menu trái + 5 trang của hệ thống
 *   1. Thông tin đăng nhập
 *   2. Tạo bài            (các khung tạo bài như cũ)
 *   3. Lịch sử tạo bài    (lưu localStorage của user)
 *   4. Dữ liệu tạo bài    (admin: ngân hàng câu hỏi, sửa câu hỏi, ảnh...)
 *   5. Danh sách user     (admin: xem danh sách lấy từ Google Sheet, tìm kiếm, xuất Excel)
 *
 * Chạy sau quan-ly-admin.js nên dùng được các hàm/biến toàn cục của file đó
 * (CURRENT_ADMIN_USER, isTeamGVUser, setActiveSubject, ...).
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

  // Bản github: danh sách user nằm trong Google Sheet (Apps Script). Các cột phụ
  // (số lần tạo bài, thời gian truy cập) nếu có trong Sheet sẽ được đọc theo tên cột.
  let loginAt = null; // thời điểm đăng nhập trên trình duyệt này
  let sessionNew = 0; // số lần tạo bài trong phiên này (cộng thêm vào số từ Sheet)
  function pickField(row, patterns) {
    if (!row) return undefined;
    for (const k of Object.keys(row)) {
      const nk = norm(k).replace(/[_\s]+/g, "");
      if (patterns.some((p) => nk.includes(p))) return row[k];
    }
    return undefined;
  }
  function serverCount(u) {
    const v = pickField(u && u.raw, ["solantao", "solan", "taobai"]);
    const n = Number(v);
    return v !== undefined && v !== "" && !isNaN(n) ? n : null;
  }
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
    const sc = serverCount(u);
    const count = sc !== null ? sc + sessionNew : Math.max(loadHistory().length, sessionNew);
    body.innerHTML =
      '<div class="profile-grid">' +
      '<div class="k">Họ và tên</div><div><b>' + esc(u.ten) + "</b>" +
      (isAdmin() ? ' <span class="badge badge-on">Toàn quyền</span>' : "") + "</div>" +
      '<div class="k">Team</div><div>' + (esc(u.team) || "—") + "</div>" +
      '<div class="k">Link app nhận kết quả</div><div>' + linkHtml + "</div>" +
      '<div class="k">Số lần tạo bài</div><div><span class="profile-big">' + count + "</span></div>" +
      '<div class="k">Đăng nhập lúc</div><div>' + esc(fmtDateTime(loginAt)) + "</div>" +
      "</div>";
    const cp = $("profileCopyLink");
    if (cp) cp.onclick = () => copyText(link, "Đã copy link nhận kết quả.");
  }
  window.addEventListener("ic3:taobai", () => {
    sessionNew++;
    renderProfile();
  });
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
  // Trang 5: Danh sách user (admin) — chỉ xem, dữ liệu lấy từ Google Sheet
  // ======================================================================
  const usersCard = document.createElement("div");
  usersCard.className = "card";
  usersCard.innerHTML =
    '<h2 style="cursor:default">👥 Danh sách user</h2>' +
    '<p class="desc">Danh sách tài khoản được phép đăng nhập, lấy từ <b>Google Sheet</b> của hệ thống. ' +
    "Muốn thêm / sửa / xoá user, hãy chỉnh trực tiếp trong Google Sheet rồi bấm <b>Tải lại</b>.</p>" +
    '<div class="toolbar">' +
    '<div class="grow"><input type="search" id="usersSearch" placeholder="🔎 Tìm theo tên, team, link..."></div>' +
    '<button type="button" class="btn btn-ghost" id="usersReloadBtn">🔄 Tải lại</button>' +
    '<button type="button" class="btn btn-ghost" id="usersExportXlsx">⬇️ Xuất Excel</button></div>' +
    '<div class="toolbar"><span class="hint" id="usersSummary" style="margin:0"></span></div>' +
    '<div id="usersLog" class="log"></div>' +
    '<div class="table-wrap"><table class="shell-table"><thead><tr>' +
    '<th class="num">#</th>' +
    '<th data-sort="ten" class="sortable" style="cursor:pointer;user-select:none" title="Bấm để sắp xếp">Tên<span class="sort-ind"></span></th>' +
    '<th data-sort="team" class="sortable" style="cursor:pointer;user-select:none" title="Bấm để sắp xếp">Team<span class="sort-ind"></span></th>' +
    "<th>Link nhận kết quả</th>" +
    "<th>Thời gian truy cập</th>" +
    '<th class="num">Số lần tạo bài</th>' +
    '</tr></thead><tbody id="usersTbody"></tbody></table></div>';
  pageEls["danh-sach-user"].appendChild(usersCard);

  let USERS = [];
  let usersLoaded = false;
  let usersSort = null; // { key: "ten" | "team", dir: 1 | -1 }
  const usersLog = () => $("usersLog");

  function cmpText(a, b) {
    return String(a || "").localeCompare(String(b || ""), "vi", { sensitivity: "base" });
  }
  function userView(r) {
    const when = pickField(r, ["thoigian", "truycap", "checkin", "lastaccess"]);
    const cnt = pickField(r, ["solantao", "solan", "taobai"]);
    return {
      ten: String(r.ten || "").trim(),
      team: String(r.team || "").trim(),
      link: String(r.link || "").trim(),
      when: when === undefined || when === "" ? "" : String(when),
      count: cnt === undefined || cnt === "" ? "" : cnt,
    };
  }
  function filteredUsers() {
    const q = norm($("usersSearch").value);
    let list = USERS.map(userView).filter((u) => u.ten);
    if (q) list = list.filter((u) => norm(u.ten + " " + u.team + " " + u.link).includes(q));
    if (usersSort) {
      const { key, dir } = usersSort;
      list = list.slice().sort((a, b) => dir * cmpText(a[key], b[key]));
    }
    return list;
  }
  function renderUsers() {
    const tbody = $("usersTbody");
    const list = filteredUsers();
    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="empty-cell">' +
        (USERS.length ? "Không có user nào khớp từ khoá." : "Chưa có user nào.") + "</td></tr>";
    } else {
      tbody.innerHTML = list
        .map(
          (u, i) =>
            "<tr>" +
            '<td class="num">' + (i + 1) + "</td>" +
            "<td><b>" + esc(u.ten) + "</b></td>" +
            "<td>" + (esc(u.team) || "—") + "</td>" +
            '<td class="linkcol">' +
            (u.link ? '<a href="' + esc(u.link) + '" target="_blank" rel="noopener">' + esc(u.link) + "</a>" : "—") + "</td>" +
            '<td class="nowrap">' + (esc(u.when) || "—") + "</td>" +
            '<td class="num">' + (u.count === "" ? "—" : esc(u.count)) + "</td></tr>",
        )
        .join("");
    }
    $("usersSummary").textContent = USERS.length
      ? "Hiển thị " + list.length + " / " + USERS.length + " user."
      : "";
    document.querySelectorAll("#page-danh-sach-user th[data-sort]").forEach((th) => {
      const ind = th.querySelector(".sort-ind");
      ind.textContent = usersSort && usersSort.key === th.dataset.sort ? (usersSort.dir === 1 ? " ▲" : " ▼") : "";
    });
  }
  async function loadUsers(silent) {
    if (typeof USER_DIRECTORY_URL === "undefined") return;
    if (!silent) showLog(usersLog(), "info", "⏳ Đang tải danh sách user từ Google Sheet...");
    try {
      const res = await fetch(USER_DIRECTORY_URL + "?action=list&_=" + Date.now());
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      if (!json || json.ok === false || !Array.isArray(json.rows))
        throw new Error((json && json.error) || "Dữ liệu trả về không hợp lệ");
      USERS = json.rows;
      usersLoaded = true;
      usersLog().className = "log";
      renderUsers();
    } catch (err) {
      showLog(usersLog(), "err", "❌ Không tải được danh sách user: " + err.message);
    }
  }
  $("usersSearch").oninput = renderUsers;
  $("usersReloadBtn").onclick = () => loadUsers(false);
  document.querySelectorAll("#page-danh-sach-user th[data-sort]").forEach((th) => {
    th.onclick = () => {
      const key = th.dataset.sort;
      if (!usersSort || usersSort.key !== key) usersSort = { key, dir: 1 };
      else if (usersSort.dir === 1) usersSort = { key, dir: -1 };
      else usersSort = null;
      renderUsers();
    };
  });
  $("usersExportXlsx").onclick = () => {
    if (typeof XLSX === "undefined") {
      showLog(usersLog(), "err", "❌ Thư viện Excel chưa tải được, kiểm tra kết nối mạng.");
      return;
    }
    const rows = filteredUsers().map((u) => ({
      "Tên": u.ten,
      "Team": u.team,
      "Link nhận kết quả": u.link,
      "Thời gian truy cập": u.when,
      "Số lần tạo bài": u.count,
    }));
    if (!rows.length) {
      showLog(usersLog(), "err", "❌ Không có dữ liệu để xuất.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "danh-sach-user.xlsx");
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

    if (page.id === "thong-tin") renderProfile();
    if (page.id === "lich-su") renderHistory();
    if (page.id === "du-lieu") syncLevelSelect();
    if (page.id === "danh-sach-user") {
      loadUsers(usersLoaded);
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
      if (typeof USER_DIRECTORY_URL !== "undefined" && !isAdmin())
        await fetch(
          USER_DIRECTORY_URL + "?action=logout&ten=" + encodeURIComponent(u.ten) +
            "&sessionId=" + encodeURIComponent(APP_SESSION_ID) + "&_=" + Date.now(),
        );
    } catch (e) {}
    location.hash = "";
    location.reload();
  };

  // ----- khi đăng nhập xong -----
  function onLoggedIn() {
    const u = currentUser();
    if (!u) return;
    if (!loginAt) loginAt = new Date().toISOString();
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
