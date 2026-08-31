const QUIZ_MODE = "onluyen";
document.body.classList.add(
  QUIZ_MODE === "kiemtra" ? "mode-kiemtra" : "mode-onluyen",
);
let securityViolationCount = 0;
let securityToastEl = null,
  securityToastMsgEl = null,
  securityToastTimer = null;
function recordSecurityViolation() {
  securityViolationCount++;
}
function showSecurityWarning(message) {
  securityViolationCount++;
  if (!securityToastEl) {
    securityToastEl = document.createElement("div");
    securityToastEl.id = "securityToast";
    securityToastEl.className = "security-toast";
    securityToastEl.innerHTML =
      '<span class="security-toast-icon">⚠️</span>' +
      '<span class="security-toast-msg"></span>';
    document.body.appendChild(securityToastEl);
    securityToastMsgEl = securityToastEl.querySelector(".security-toast-msg");
  }
  securityToastMsgEl.textContent = message;
  securityToastEl.classList.add("show");
  clearTimeout(securityToastTimer);
  securityToastTimer = setTimeout(function () {
    securityToastEl.classList.remove("show");
  }, 3200);
}
const THEME_MOON_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.4 14.7A8.5 8.5 0 1 1 9.3 3.6a7 7 0 0 0 11.1 11.1Z" fill="#f5a623"/></svg>';
const THEME_SUN_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" fill="#f5a623"/><g stroke="#f5a623" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/><line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/></g></svg>';
(function () {
  const btn = document.getElementById("themeToggle");
  const knob = document.getElementById("themeSwitchKnob");
  function syncIcon() {
    if (!btn) return;
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    const label = isDark ? "Chuyển nền sáng" : "Chuyển nền tối";
    btn.title = label;
    btn.setAttribute("aria-label", label);
    if (knob) knob.innerHTML = isDark ? THEME_SUN_ICON : THEME_MOON_ICON;
  }
  syncIcon();
  if (btn) {
    btn.onclick = () => {
      const next =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "light"
          : "dark";
      if (next === "dark")
        document.documentElement.setAttribute("data-theme", "dark");
      else document.documentElement.removeAttribute("data-theme");
      syncIcon();
    };
  }
})();
const CLASS_SHEET_CONFIG = {
  enabled: true,
  webAppUrl:
    "https://script.google.com/macros/s/AKfycbwAqMGtP5d5qVOfbAX1_CBd6TZgFBEyo-9OEcF1eYY_tQBw8b-rAt7cS4SGhcIT3GArYw/exec",
};
const DEMO_TOOLBAR_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `\n<svg xmlns="http://www.w3.org/2000/svg" width="560" height="260" viewBox="0 0 560 260">\n  <rect width="560" height="260" fill="#f4f6fb"/>\n  <rect x="16" y="16" width="528" height="228" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>\n  <rect x="32" y="32" width="220" height="14" rx="4" fill="#dbe3ef"/>\n  <rect x="32" y="56" width="140" height="10" rx="4" fill="#e8ecf3"/>\n  <g font-family="Arial,Helvetica,sans-serif">\n    <rect x="30" y="105" width="80" height="50" rx="10" fill="#eef1f7" stroke="#cbd3e1"/>\n    <text x="70" y="137" font-size="24" text-anchor="middle">📝</text>\n    <rect x="150" y="105" width="80" height="50" rx="10" fill="#eef1f7" stroke="#cbd3e1"/>\n    <text x="190" y="137" font-size="24" text-anchor="middle">🖼️</text>\n    <rect x="270" y="105" width="80" height="50" rx="10" fill="#eef1f7" stroke="#cbd3e1"/>\n    <text x="310" y="137" font-size="24" text-anchor="middle">📊</text>\n    <rect x="390" y="105" width="80" height="50" rx="10" fill="#eef1f7" stroke="#cbd3e1"/>\n    <text x="430" y="137" font-size="24" text-anchor="middle">🔗</text>\n  </g>\n  <rect x="32" y="190" width="496" height="10" rx="4" fill="#eef1f7"/>\n  <rect x="32" y="208" width="380" height="10" rx="4" fill="#eef1f7"/>\n</svg>\n`,
  );
const IS_TOUCH = "ontouchstart" in window || navigator.maxTouchPoints > 0;
const SCHOOL_LIST = [
  "THCS Huỳnh Tấn Phát",
  "THCS Nguyễn Văn Quỳ",
  "THCS Lê Quý Đôn",
  "Khác",
];
const SCHOOL_OTHER_VALUE = "Khác";
const QUIZ_LEVEL_LABEL = "";
const QUIZ_TOPIC_LABEL = "";
const CLASS_LIST = [];
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const EXAM_DURATION_MINUTES = 50;
const EXAM_DURATION_SECONDS = EXAM_DURATION_MINUTES * 60;
const TIMER_WARNING_SECONDS = 10 * 60;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 38;
let timerInterval = null;
const QUIZ = [];
let studentInfo = { id: "", name: "", school: "", class: "" };
let ACTIVE_QUIZ = QUIZ.slice();
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function shuffleWithMap(arr) {
  if (!Array.isArray(arr)) {
    console.error(
      "[LỖI DỮ LIỆU CÂU HỎI] Thiếu/sai 1 trường dữ liệu dạng danh sách (options/left/right/items/toolbar/points...) " +
        "ở câu hỏi đang xử lý — dùng tạm rỗng để không sập bài. Vào Quản lý admin kiểm tra lại câu này.",
      arr,
    );
  }
  const safeArr = Array.isArray(arr) ? arr : [];
  const order = shuffleArray(safeArr.map((_, i) => i));
  return { values: order.map((i) => safeArr[i]), order: order };
}
function randomizeQuestion(original) {
  const q = JSON.parse(JSON.stringify(original));
  switch (q.type) {
    case "single": {
      const { values: values, order: order } = shuffleWithMap(q.options);
      q.options = values;
      if (q.optionImages) q.optionImages = order.map((i) => q.optionImages[i]);
      q.answer = order.indexOf(original.answer);
      break;
    }
    case "multiple": {
      const { values: values, order: order } = shuffleWithMap(q.options);
      q.options = values;
      if (q.optionImages) q.optionImages = order.map((i) => q.optionImages[i]);
      q.answer = original.answer.map((a) => order.indexOf(a));
      break;
    }
    case "position": {
      const { values: values, order: order } = shuffleWithMap(q.toolbar);
      q.toolbar = values;
      q.answer = order.indexOf(original.answer);
      break;
    }
    case "matching": {
      const leftShuffle = shuffleWithMap(q.left);
      const rightShuffle = shuffleWithMap(q.right);
      q.left = leftShuffle.values;
      q.right = rightShuffle.values;
      q.correctMap = leftShuffle.order.map((origLeftIdx) => {
        const origRightVal = original.correctMap[origLeftIdx];
        return Array.isArray(origRightVal)
          ? origRightVal.map((origRightIdx) =>
              rightShuffle.order.indexOf(origRightIdx),
            )
          : rightShuffle.order.indexOf(origRightVal);
      });
      break;
    }
    case "list": {
      q.items = q.items.map((item) => {
        const { values: values, order: order } = shuffleWithMap(item.options);
        return { ...item, options: values, answer: order.indexOf(item.answer) };
      });
      break;
    }
    case "imagepoint": {
      const { values: values, order: order } = shuffleWithMap(q.points);
      q.points = values;
      q.answer = Array.isArray(original.answer)
        ? original.answer.map((a) => order.indexOf(a))
        : order.indexOf(original.answer);
      break;
    }
    case "dragfill": {
      const { values: values, order: order } = shuffleWithMap(q.options);
      q.options = values;
      q.answer = original.answer.map((a) => order.indexOf(a));
      break;
    }
    case "selectfill": {
      const { values: values, order: order } = shuffleWithMap(q.options);
      q.options = values;
      q.answer = original.answer.map((a) => order.indexOf(a));
      if (Array.isArray(q.blankOptions)) {
        q.blankOptions = q.blankOptions.map((bo) => {
          if (Array.isArray(bo))
            return bo.map((oldIdx) => order.indexOf(oldIdx));
          if (bo && Array.isArray(bo.allowed))
            return {
              ...bo,
              allowed: bo.allowed.map((oldIdx) => order.indexOf(oldIdx)),
            };
          return bo;
        });
      }
      break;
    }
    case "classify": {
      const { values: values, order: order } = shuffleWithMap(q.items);
      q.items = values;
      q.answer = order.map((oldIdx) => original.answer[oldIdx]);
      q.distractors = Array.isArray(original.distractors)
        ? original.distractors.slice()
        : [];
      {
        const combinedPool = q.items
          .map((_, i) => ({ key: String(i), isDistractor: false, idx: i }))
          .concat(
            q.distractors.map((_, i) => ({
              key: "d" + i,
              isDistractor: true,
              idx: i,
            })),
          );
        q._classifyPool = shuffleArray(combinedPool);
      }
      break;
    }
    case "classify2": {
      const { values: values, order: order } = shuffleWithMap(q.items);
      q.items = values;
      q.answer = order.map((oldIdx) => original.answer[oldIdx]);
      break;
    }
    case "ordering":
      break;
    default:
      break;
  }
  return q;
}
function buildActiveQuiz() {
  return shuffleArray(QUIZ).map(function (q) {
    try {
      return randomizeQuestion(q);
    } catch (err) {
      console.error(
        '[LỖI DỮ LIỆU CÂU HỎI] Câu id="' +
          (q && q.id) +
          '" (loại: ' +
          (q && q.type) +
          ") bị thiếu/sai dữ liệu nên không xáo trộn được — đang tạm dùng bản gốc. " +
          "Vào Quản lý admin kiểm tra lại câu này:",
        q,
        err,
      );
      return JSON.parse(JSON.stringify(q));
    }
  });
}
const VN_VOWEL_RE =
  /[aàáạảãăằắặẳẵâầấậẩẫeèéẹẻẽêềếệểễiìíịỉĩoòóọỏõôồốộổỗơờớợởỡuùúụủũưừứựửữyỳýỵỷỹ]/i;
function normalizeStudentName(raw) {
  const name = (raw || "").trim().replace(/\s+/g, " ");
  if (!name) return "Noname";
  if (/[0-9]/.test(name)) return "Noname";
  if (!/^[\p{L}\s]+$/u.test(name)) return "Noname";
  const words = name.split(" ");
  const titled = words.map((w) => {
    if (!VN_VOWEL_RE.test(w)) return null;
    return (
      w.charAt(0).toLocaleUpperCase("vi") + w.slice(1).toLocaleLowerCase("vi")
    );
  });
  if (titled.some((w) => w === null)) return "Noname";
  return titled.join(" ");
}
function normalizeClassName(raw) {
  const s = (raw || "").trim().toLocaleLowerCase("vi");
  if (!s) return "Noname";
  const wordToDigit = {
    một: "1",
    hai: "2",
    ba: "3",
    bốn: "4",
    tư: "4",
    năm: "5",
    sáu: "6",
    bảy: "7",
    tám: "8",
    chín: "9",
    mười: "10",
  };
  const tokens = s.split(/\s+/);
  const converted = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const next = tokens[i + 1];
    if (tok === "mười" && (next === "một" || next === "hai")) {
      converted.push(String(10 + Number(wordToDigit[next])));
      i++;
      continue;
    }
    converted.push(wordToDigit[tok] !== undefined ? wordToDigit[tok] : tok);
  }
  const joined = converted.join("");
  if (!/^\d{1,2}[a-z]\d{0,3}$/.test(joined)) return "Noname";
  return joined;
}
function stripVietnameseDiacritics(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}
function normalizeForMatch(str) {
  return stripVietnameseDiacritics(String(str || ""))
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
function checkStudentAgainstClassList(name, klass, school) {
  if (CLASS_LIST.length === 0) return { ok: true };
  const nName = normalizeForMatch(name);
  const nClass = normalizeForMatch(klass);
  const nSchool = normalizeForMatch(school);
  const nameMatches = CLASS_LIST.filter(
    (row) => normalizeForMatch(row.name) === nName,
  );
  if (nameMatches.length === 0) {
    return {
      ok: false,
      reason:
        "Không tìm thấy họ và tên này trong danh sách lớp. Vui lòng kiểm tra lại họ tên.",
    };
  }
  const classMatches = nameMatches.filter(
    (row) => normalizeForMatch(row.class) === nClass,
  );
  if (classMatches.length === 0) {
    return {
      ok: false,
      reason:
        "Họ tên đúng, nhưng lớp không khớp với danh sách. Vui lòng kiểm tra lại lớp.",
    };
  }
  const matchedRow = classMatches.find(
    (row) => normalizeForMatch(row.school) === nSchool,
  );
  if (!matchedRow) {
    return {
      ok: false,
      reason:
        "Bạn không học tại trường này. Vui lòng chọn lại đúng trường bạn đang học.",
    };
  }
  return {
    ok: true,
    matchedId:
      matchedRow.id !== undefined &&
      matchedRow.id !== null &&
      String(matchedRow.id).trim() !== ""
        ? String(matchedRow.id).trim()
        : "",
    matchedName: String(matchedRow.name || "")
      .trim()
      .replace(/\s+/g, " "),
    matchedClass: String(matchedRow.class || "")
      .trim()
      .replace(/\s+/g, " "),
    matchedSchool: String(matchedRow.school || "")
      .trim()
      .replace(/\s+/g, " "),
  };
}
function abbreviateLeadingWords(fullName, level) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return fullName;
  const n = Math.min(level, parts.length - 1);
  const out = parts.slice();
  for (let i = 0; i < n; i++) {
    out[i] = out[i].charAt(0).toUpperCase() + ".";
  }
  return out.join(" ");
}
function fitLineWithName(el, buildText, fullName, maxFontPx, minFontPx) {
  if (!el || !fullName) return;
  el.style.whiteSpace = "nowrap";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const maxAbbrevLevel = Math.max(0, parts.length - 1);
  for (let level = 0; level <= maxAbbrevLevel; level++) {
    const nameVariant =
      level === 0 ? fullName : abbreviateLeadingWords(fullName, level);
    el.textContent = buildText(nameVariant);
    let size = maxFontPx;
    el.style.fontSize = size + "px";
    while (el.scrollWidth > el.clientWidth && size > minFontPx) {
      size -= 1;
      el.style.fontSize = size + "px";
    }
    if (el.scrollWidth <= el.clientWidth + 1) return;
  }
}
function initStartScreen() {
  const schoolSelect = document.getElementById("inpSchool");
  const schoolOtherInput = document.getElementById("inpSchoolOther");
  const classSelect = document.getElementById("inpClass");
  const classFreeInput = document.getElementById("inpClassFree");
  const nameSelect = document.getElementById("inpName");
  const nameFreeInput = document.getElementById("inpNameFree");
  const startBtn = document.getElementById("startBtn");
  const errBox = document.getElementById("formError");
  const hasRoster = CLASS_LIST.length > 0;
  function resetSelect(sel, placeholder) {
    sel.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.disabled = true;
    opt.selected = true;
    opt.textContent = placeholder;
    sel.appendChild(opt);
  }
  if (hasRoster) {
    classFreeInput.style.display = "none";
    nameFreeInput.style.display = "none";
    schoolOtherInput.style.display = "none";
    classSelect.style.display = "";
    nameSelect.style.display = "";
    resetSelect(schoolSelect, "-- Chọn trường --");
    resetSelect(classSelect, "-- Chọn lớp --");
    resetSelect(nameSelect, "-- Chọn học sinh --");
    classSelect.disabled = true;
    nameSelect.disabled = true;
    const schools = Array.from(
      new Set(
        CLASS_LIST.map((r) => String(r.school || "").trim()).filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "vi"));
    schools.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      schoolSelect.appendChild(opt);
    });
    let currentClassRows = [];
    schoolSelect.onchange = () => {
      resetSelect(classSelect, "-- Chọn lớp --");
      resetSelect(nameSelect, "-- Chọn học sinh --");
      nameSelect.disabled = true;
      const school = schoolSelect.value;
      if (!school) {
        classSelect.disabled = true;
        return;
      }
      const nSchool = normalizeForMatch(school);
      const classes = Array.from(
        new Set(
          CLASS_LIST.filter((r) => normalizeForMatch(r.school) === nSchool)
            .map((r) => String(r.class || "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
      classes.forEach((name) => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        classSelect.appendChild(opt);
      });
      classSelect.disabled = false;
    };
    classSelect.onchange = () => {
      resetSelect(nameSelect, "-- Chọn học sinh --");
      const school = schoolSelect.value;
      const klass = classSelect.value;
      if (!school || !klass) {
        nameSelect.disabled = true;
        return;
      }
      const nSchool = normalizeForMatch(school);
      const nClass = normalizeForMatch(klass);
      currentClassRows = CLASS_LIST.filter(
        (r) =>
          normalizeForMatch(r.school) === nSchool &&
          normalizeForMatch(r.class) === nClass,
      );
      currentClassRows.forEach((row, idx) => {
        const opt = document.createElement("option");
        opt.value = String(idx);
        opt.textContent = `${row.id} - ${String(row.name || "").trim()}`;
        nameSelect.appendChild(opt);
      });
      nameSelect.disabled = false;
    };
    startBtn.onclick = () => {
      const school = schoolSelect.value;
      const klass = classSelect.value;
      const nameIdx = nameSelect.value;
      if (!school || !klass || nameIdx === "") {
        errBox.textContent =
          "Vui lòng chọn đầy đủ theo đúng thứ tự: Trường, rồi đến Lớp, rồi đến Họ và tên trước khi bắt đầu.";
        errBox.style.display = "block";
        return;
      }
      const row = currentClassRows[Number(nameIdx)];
      if (!row) {
        errBox.textContent = "Lựa chọn không hợp lệ. Vui lòng chọn lại từ đầu.";
        errBox.style.display = "block";
        resetSelect(classSelect, "-- Chọn lớp --");
        resetSelect(nameSelect, "-- Chọn học sinh --");
        classSelect.disabled = true;
        nameSelect.disabled = true;
        return;
      }
      const rosterCheck = checkStudentAgainstClassList(
        row.name,
        row.class,
        row.school,
      );
      if (!rosterCheck.ok) {
        errBox.textContent = rosterCheck.reason + " Vui lòng chọn lại.";
        errBox.style.display = "block";
        return;
      }
      errBox.style.display = "none";
      pendingStudentInfo = {
        id: row.id,
        name: rosterCheck.matchedName || normalizeStudentName(row.name),
        school: rosterCheck.matchedSchool || row.school,
        class: rosterCheck.matchedClass || normalizeClassName(row.class),
      };
      document.getElementById("welcomeSub").textContent =
        `Lớp ${pendingStudentInfo.class} - ${pendingStudentInfo.school}`;
      document.getElementById("welcomeModal").style.display = "flex";
      fitLineWithName(
        document.getElementById("welcomeTitle"),
        (n) => `Chào bạn, ${n}!`,
        pendingStudentInfo.name,
        22,
        14,
      );
    };
  } else {
    classSelect.style.display = "none";
    nameSelect.style.display = "none";
    classFreeInput.style.display = "";
    nameFreeInput.style.display = "";
    SCHOOL_LIST.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      schoolSelect.appendChild(opt);
    });
    schoolSelect.onchange = () => {
      if (schoolSelect.value === SCHOOL_OTHER_VALUE) {
        schoolOtherInput.style.display = "block";
        schoolOtherInput.focus();
      } else {
        schoolOtherInput.style.display = "none";
        schoolOtherInput.value = "";
      }
    };
    startBtn.onclick = () => {
      const name = nameFreeInput.value.trim();
      const schoolChoice = schoolSelect.value.trim();
      const schoolOther = schoolOtherInput.value.trim();
      const school =
        schoolChoice === SCHOOL_OTHER_VALUE ? schoolOther : schoolChoice;
      const klass = classFreeInput.value.trim();
      if (!name || !school || !klass) {
        errBox.textContent =
          "Vui lòng nhập đầy đủ thông tin trước khi bắt đầu.";
        errBox.style.display = "block";
        return;
      }
      const rosterCheck = checkStudentAgainstClassList(name, klass, school);
      if (!rosterCheck.ok) {
        errBox.textContent = rosterCheck.reason;
        errBox.style.display = "block";
        return;
      }
      errBox.style.display = "none";
      pendingStudentInfo = {
        id: rosterCheck.matchedId || "",
        name: rosterCheck.matchedName || normalizeStudentName(name),
        school: rosterCheck.matchedSchool || school,
        class: rosterCheck.matchedClass || normalizeClassName(klass),
      };
      document.getElementById("welcomeSub").textContent =
        `Lớp ${pendingStudentInfo.class} - ${pendingStudentInfo.school}`;
      document.getElementById("welcomeModal").style.display = "flex";
      fitLineWithName(
        document.getElementById("welcomeTitle"),
        (n) => `Chào bạn, ${n}!`,
        pendingStudentInfo.name,
        22,
        14,
      );
    };
  }
  document.getElementById("welcomeStartBtn").onclick = () => {
    document.getElementById("welcomeModal").style.display = "none";
    attemptClaimAndRun(enterQuizAfterLock);
  };
}
const ATTEMPT_COUNT_KEY = "ic3_ontap_attempt_counts_v1";
function attemptCountStorageKey(info) {
  return [
    normalizeForMatch(info.name),
    normalizeForMatch(info.class),
    normalizeForMatch(info.school),
  ].join("|");
}
function readAttemptCounts() {
  try {
    const raw = localStorage.getItem(ATTEMPT_COUNT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function bumpAttemptCount(info) {
  const counts = readAttemptCounts();
  const key = attemptCountStorageKey(info);
  const next = (Number(counts[key]) || 0) + 1;
  counts[key] = next;
  try {
    localStorage.setItem(ATTEMPT_COUNT_KEY, JSON.stringify(counts));
  } catch (e) {}
  return next;
}
function renderAttemptCount() {
  const wrap = document.getElementById("attemptCountWrap");
  const num = document.getElementById("attemptCount");
  if (!wrap || !num || !studentInfo) return;
  const history = getAttemptHistory(studentInfo);
  num.textContent = history.length;
  wrap.style.display = "block";
  renderAttemptHistoryList();
}
const ATTEMPT_HISTORY_KEY = "ic3_ontap_attempt_history_v1";
function readAttemptHistoryStore() {
  try {
    const raw = localStorage.getItem(ATTEMPT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function getAttemptHistory(info) {
  const store = readAttemptHistoryStore();
  const key = attemptCountStorageKey(info);
  return Array.isArray(store[key]) ? store[key] : [];
}
function addAttemptHistoryRecord(info, record) {
  const store = readAttemptHistoryStore();
  const key = attemptCountStorageKey(info);
  const list = Array.isArray(store[key]) ? store[key] : [];
  list.push(record);
  while (list.length > 20) list.shift();
  store[key] = list;
  try {
    localStorage.setItem(ATTEMPT_HISTORY_KEY, JSON.stringify(store));
  } catch (e) {}
}
function renderAttemptHistoryList() {
  const listEl = document.getElementById("attemptHistoryList");
  if (!listEl || !studentInfo) return;
  const history = getAttemptHistory(studentInfo);
  if (history.length === 0) {
    listEl.innerHTML = "";
    return;
  }
  listEl.innerHTML = history
    .map(
      (h, idx) =>
        `<div class="attempt-history-row">` +
        `<span class="ah-label">Lần ${idx + 1}:</span>` +
        `<span class="ah-score">${h.score}%</span>` +
        `<span class="ah-time">⏱ ${formatDuration(h.timeTakenSeconds)}</span>` +
        `<span class="ah-at">${h.at || ""}</span>` +
        `</div>`,
    )
    .join("");
}
function enterQuizAfterLock() {
  studentInfo = pendingStudentInfo;
  document.getElementById("studentBadge").innerHTML =
    `<div class="student-info">` +
    `<p class="student-info-name">👤 ID: ${String(studentInfo.id || "—")} · ${abbreviateLeadingWords(studentInfo.name, studentInfo.name.length > 22 ? studentInfo.name.trim().split(/\s+/).length - 1 : 0)}</p>` +
    `<p class="student-info-meta">Lớp ${studentInfo.class}, ${studentInfo.school}</p>` +
    `</div>`;
  bumpAttemptCount(studentInfo);
  renderAttemptCount();
  document.getElementById("startScreen").style.display = "none";
  document.body.classList.remove("pre-start");
  document.getElementById("quizLayout").style.display = "grid";
  ACTIVE_QUIZ = buildActiveQuiz();
  quizStartTime = Date.now();
  quizFinished = false;
  lastResult = null;
  enableFullscreenLock();
  if (QUIZ_MODE === "kiemtra") startExamTimer();
  renderAll();
}
let pendingStudentInfo = null;
initStartScreen();
let current = 0;
const state = {};
let quizStartTime = null;
let quizFinished = false;
let lastResult = null;
const TAB_LOCK_KEY = "ic3_ontap_tab_lock_v1";
const TAB_ID =
  Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
const TAB_HEARTBEAT_MS = 3e3;
const TAB_STALE_MS = 9e3;
let tabHeartbeatTimer = null;
function readTabLock() {
  try {
    const raw = localStorage.getItem(TAB_LOCK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
function writeTabLock() {
  try {
    localStorage.setItem(
      TAB_LOCK_KEY,
      JSON.stringify({ id: TAB_ID, ts: Date.now() }),
    );
  } catch (e) {}
}
function releaseTabLock() {
  if (tabHeartbeatTimer) {
    clearInterval(tabHeartbeatTimer);
    tabHeartbeatTimer = null;
  }
  try {
    const lock = readTabLock();
    if (lock && lock.id === TAB_ID) localStorage.removeItem(TAB_LOCK_KEY);
  } catch (e) {}
}
function isOtherTabHoldingLock() {
  const lock = readTabLock();
  if (!lock || lock.id === TAB_ID) return false;
  return Date.now() - lock.ts < TAB_STALE_MS;
}
function claimTabLock(callback) {
  if (isOtherTabHoldingLock()) {
    callback(false);
    return;
  }
  writeTabLock();
  setTimeout(() => {
    const lock = readTabLock();
    if (lock && lock.id === TAB_ID) {
      if (tabHeartbeatTimer) clearInterval(tabHeartbeatTimer);
      tabHeartbeatTimer = setInterval(writeTabLock, TAB_HEARTBEAT_MS);
      window.addEventListener("beforeunload", releaseTabLock);
      window.addEventListener("pagehide", releaseTabLock);
      callback(true);
    } else {
      callback(false);
    }
  }, 350);
}
function showTabConflictModal() {
  document.getElementById("welcomeModal").style.display = "none";
  document.getElementById("tabConflictModal").style.display = "flex";
}
function hideTabConflictModal() {
  document.getElementById("tabConflictModal").style.display = "none";
}
let pendingLockRetryAction = null;
function attemptClaimAndRun(onSuccess) {
  claimTabLock(function (success) {
    if (success) {
      pendingLockRetryAction = null;
      hideTabConflictModal();
      onSuccess();
    } else {
      pendingLockRetryAction = onSuccess;
      showTabConflictModal();
    }
  });
}
document.getElementById("tabConflictRetryBtn").onclick = () => {
  if (pendingLockRetryAction) attemptClaimAndRun(pendingLockRetryAction);
};
let fullscreenRequired = false;
function isFullscreenActive() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}
function requestFullscreenSafe() {
  const el = document.documentElement;
  const req =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen;
  if (req) {
    try {
      req.call(el);
    } catch (e) {}
  }
}
function showFullscreenExitModal() {
  document.getElementById("fullscreenExitModal").style.display = "flex";
}
function hideFullscreenExitModal() {
  document.getElementById("fullscreenExitModal").style.display = "none";
}
function enableFullscreenLock() {
  fullscreenRequired = true;
  requestFullscreenSafe();
}
function disableFullscreenLock() {
  fullscreenRequired = false;
  hideFullscreenExitModal();
}
[
  "fullscreenchange",
  "webkitfullscreenchange",
  "mozfullscreenchange",
  "MSFullscreenChange",
].forEach((evt) => {
  document.addEventListener(evt, () => {
    if (!fullscreenRequired) return;
    if (isFullscreenActive()) hideFullscreenExitModal();
    else showFullscreenExitModal();
  });
});
document.getElementById("fullscreenExitRetryBtn").onclick = () => {
  requestFullscreenSafe();
};
document.getElementById("resultModalCloseBtn").onclick = () => {
  document.getElementById("resultModal").style.display = "none";
};
document.addEventListener("keydown", function (e) {
  if (!fullscreenRequired) return;
  if (e.key === "F11") {
    e.preventDefault();
    requestFullscreenSafe();
  }
});
function goToQuestion(idx) {
  current = idx;
  renderAll();
  scrollToQuestionTop();
}
function scrollToQuestionTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
}
const DOM = {
  mainCard: document.getElementById("mainCard"),
  qgrid: document.getElementById("qgrid"),
  sideLegend: document.getElementById("sideLegend"),
  scoreNow: document.getElementById("scoreNow"),
  scoreLbl: document.getElementById("scoreLbl"),
  totalQCount: document.getElementById("totalQCount"),
  faceBox: document.getElementById("faceBox"),
  faceEmoji: document.getElementById("faceEmoji"),
  faceMsg: document.getElementById("faceMsg"),
  timerCircle: document.getElementById("timerCircle"),
  timerText: document.getElementById("timerText"),
  timerRingProgress: document.getElementById("timerRingProgress"),
};
function isQnavMobile() {
  return window.matchMedia("(max-width:860px)").matches;
}
function updateQnavPeekTop() {
  const header = document.querySelector(".header");
  const top = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  document.documentElement.style.setProperty("--qnav-peek-top", top + "px");
}
window.addEventListener("resize", updateQnavPeekTop);
window.addEventListener("orientationchange", updateQnavPeekTop);
function setQnavCollapsed(collapsed) {
  const layout = document.getElementById("quizLayout");
  const showBtn = document.getElementById("qnavShowBtn");
  const qnavCard = document.getElementById("qnavCard");
  if (!layout) return;
  if (!isQnavMobile()) collapsed = false;
  layout.classList.toggle("qnav-collapsed", collapsed);
  if (showBtn) showBtn.style.display = collapsed ? "block" : "none";
  if (qnavCard) qnavCard.classList.remove("qnav-peek");
  try {
    localStorage.setItem("qnav_collapsed_v1", collapsed ? "1" : "0");
  } catch (e) {}
}
(function initQnavToggle() {
  const hideBtn = document.getElementById("qnavHideBtn");
  const showBtn = document.getElementById("qnavShowBtn");
  const qnavCard = document.getElementById("qnavCard");
  if (hideBtn) hideBtn.onclick = () => setQnavCollapsed(true);
  if (showBtn) showBtn.onclick = () => setQnavCollapsed(false);
  let peekHideTimer = null;
  function peekShow() {
    if (!isQnavMobile()) return;
    updateQnavPeekTop();
    clearTimeout(peekHideTimer);
    if (qnavCard) qnavCard.classList.add("qnav-peek");
  }
  function peekHideSoon() {
    if (!isQnavMobile()) return;
    clearTimeout(peekHideTimer);
    peekHideTimer = setTimeout(() => {
      if (qnavCard) qnavCard.classList.remove("qnav-peek");
    }, 260);
  }
  if (showBtn) {
    showBtn.addEventListener("mouseenter", peekShow);
    showBtn.addEventListener("mouseleave", peekHideSoon);
  }
  if (qnavCard) {
    qnavCard.addEventListener("mouseenter", peekShow);
    qnavCard.addEventListener("mouseleave", peekHideSoon);
  }
  updateQnavPeekTop();
  let saved = null;
  try {
    saved = localStorage.getItem("qnav_collapsed_v1");
  } catch (e) {}
  setQnavCollapsed(
    isQnavMobile() ? (saved === null ? false : saved === "1") : false,
  );
})();
DOM.totalQCount.textContent = QUIZ.length;
(function updateHeaderTitleFromSelection() {
  const titleEl = document.querySelector(".header-title");
  if (!titleEl) return;
  const typeLabel = QUIZ_MODE === "kiemtra" ? "Bài kiểm tra" : "Bài ôn luyện";
  const levelLabel =
    typeof QUIZ_LEVEL_LABEL === "string" && QUIZ_LEVEL_LABEL.trim()
      ? QUIZ_LEVEL_LABEL.trim()
      : "";
  titleEl.textContent = levelLabel ? `${typeLabel} · ${levelLabel}` : typeLabel;
  const topicTextEl = document.getElementById("headerTopicText");
  if (topicTextEl) {
    const topicLabel =
      typeof QUIZ_TOPIC_LABEL === "string" && QUIZ_TOPIC_LABEL.trim()
        ? QUIZ_TOPIC_LABEL.trim()
        : "";
    topicTextEl.textContent = topicLabel ? topicLabel + " · " : "";
  }
  const durationTextEl = document.getElementById("examDurationText");
  if (durationTextEl) {
    durationTextEl.textContent =
      QUIZ_MODE === "kiemtra" &&
      typeof EXAM_DURATION_MINUTES === "number" &&
      EXAM_DURATION_MINUTES > 0
        ? ` | Thời gian làm ${EXAM_DURATION_MINUTES} phút`
        : "";
  }
})();
function formatDuration(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}
function matchAccepts(correctVal, rightIdx) {
  return Array.isArray(correctVal)
    ? correctVal.includes(rightIdx)
    : correctVal === rightIdx;
}
function matchFirstAcceptingLeft(q, rightIdx) {
  for (let i = 0; i < q.left.length; i++) {
    if (matchAccepts(q.correctMap[i], rightIdx)) return i;
  }
  return -1;
}
const ATTEMPT_CHECKERS = {
  single: (s) => s.userAnswer !== null && s.userAnswer !== undefined,
  multiple: (s, q) =>
    Array.isArray(s.userAnswer) && s.userAnswer.length === q.answer.length,
  ordering: () => true,
  matching: (s, q) =>
    !!s.pairs && Object.keys(s.pairs).length === q.left.length,
  position: (s) => s.userAnswer !== null && s.userAnswer !== undefined,
  list: (s) =>
    Array.isArray(s.userAnswer) &&
    s.userAnswer.every((v) => v !== null && v !== undefined),
  imagepoint: (s, q) =>
    Array.isArray(q.answer) && q.answerMode !== "any"
      ? Array.isArray(s.userAnswer) && s.userAnswer.length > 0
      : s.userAnswer !== null && s.userAnswer !== undefined,
  dragfill: (s, q) =>
    !!s.placed && Object.keys(s.placed).length === q.answer.length,
  selectfill: (s, q) =>
    !!s.placed && Object.keys(s.placed).length === q.answer.length,
  classify: (s, q) =>
    !!s.placed && q.items.some((_, idx) => s.placed[idx] !== undefined),
  classify2: (s, q) => !!s.placed && Object.keys(s.placed).length > 0,
};
function isAttempted(q) {
  const s = state[q.id];
  if (!s) return false;
  const checker = ATTEMPT_CHECKERS[q.type];
  return checker ? checker(s, q) : false;
}
const CORRECTNESS_CHECKERS = {
  single: (s, q) => s.userAnswer === q.answer,
  multiple: (s, q) =>
    JSON.stringify((s.userAnswer || []).slice().sort()) ===
    JSON.stringify([...q.answer].sort()),
  ordering: (s, q) => JSON.stringify(s.order) === JSON.stringify(q.answerOrder),
  matching: (s, q) =>
    q.left.every(
      (_, i) => s.pairs && matchAccepts(q.correctMap[i], s.pairs[i]),
    ),
  position: (s, q) => s.userAnswer === q.answer,
  list: (s, q) =>
    q.items.every(
      (item, idx) => s.userAnswer && s.userAnswer[idx] === item.answer,
    ),
  imagepoint: (s, q) =>
    Array.isArray(q.answer)
      ? q.answerMode === "any"
        ? q.answer.includes(s.userAnswer)
        : JSON.stringify((s.userAnswer || []).slice().sort()) ===
          JSON.stringify([...q.answer].sort())
      : s.userAnswer === q.answer,
  dragfill: (s, q) => {
    if (!s.placed) return false;
    if (q.orderIndependent === true || q.answerMode === "any") {
      const placedVals = q.answer
        .map((_, idx) => s.placed[idx])
        .slice()
        .sort();
      const correctVals = q.answer.slice().sort();
      return JSON.stringify(placedVals) === JSON.stringify(correctVals);
    }
    return q.answer.every((ans, idx) => s.placed[idx] === ans);
  },
  selectfill: (s, q) =>
    q.answer.every((ans, idx) => s.placed && s.placed[idx] === ans),
  classify: (s, q) =>
    q.answer.every((ans, idx) => s.placed && s.placed[idx] === ans),
  classify2: (s, q) =>
    q.answer.every((ans, idx) => s.placed && s.placed[idx] === ans),
};
function checkAnswerCorrect(q) {
  const s = state[q.id];
  if (!s) return false;
  const checker = CORRECTNESS_CHECKERS[q.type];
  return checker ? checker(s, q) : false;
}
function computeCorrect(q) {
  return checkAnswerCorrect(q);
}
function computeQuestionPoints(q, pointsPerQuestion) {
  const s = state[q.id];
  if (!s) return 0;
  if (q.type === "matching") {
    let correctSub = 0;
    q.left.forEach((_, i) => {
      if (s.pairs && matchAccepts(q.correctMap[i], s.pairs[i])) correctSub++;
    });
    return (pointsPerQuestion * correctSub) / q.left.length;
  }
  if (q.type === "list") {
    let correctSub = 0;
    q.items.forEach((item, idx) => {
      if (s.userAnswer && s.userAnswer[idx] === item.answer) correctSub++;
    });
    return (pointsPerQuestion * correctSub) / q.items.length;
  }
  return computeCorrect(q) ? pointsPerQuestion : 0;
}
function getScoreTier(score) {
  if (score >= 95)
    return {
      tier: "pass",
      statusClass: "pass",
      emoji: "🏆",
      statusText: "ĐẠT",
      faceClass: "perfect",
      faceMsg:
        "🎉 Tuyệt vời! Bạn đã hoàn thành bài rất tốt. Hãy tiếp tục phát huy nhé!",
    };
  if (score >= 80)
    return {
      tier: "warn",
      statusClass: "warn",
      emoji: "🥳",
      statusText: "CHƯA ĐẠT",
      faceClass: "neutral",
      faceMsg:
        "🌟 Sắp đạt rồi! Hãy xem lại những câu chưa đúng và thử lại nhé!",
    };
  return {
    tier: "fail",
    statusClass: "fail",
    emoji: "🌱",
    statusText: "CHƯA ĐẠT",
    faceClass: "sad",
    faceMsg:
      "📚 Đừng bỏ cuộc! Hãy xem lại phần giải thích, ôn tập thêm và thử lại nhé!",
  };
}
function startExamTimer() {
  if (QUIZ_MODE !== "kiemtra") return;
  const circleEl = DOM.timerCircle;
  const textEl = DOM.timerText;
  const progressEl = DOM.timerRingProgress;
  if (!circleEl || !textEl || !progressEl) return;
  progressEl.style.strokeDasharray = TIMER_CIRCUMFERENCE;
  circleEl.style.display = "block";
  circleEl.classList.remove("warning");
  if (timerInterval) clearInterval(timerInterval);
  function tick() {
    const elapsed = Math.floor((Date.now() - quizStartTime) / 1e3);
    const remaining = Math.max(0, EXAM_DURATION_SECONDS - elapsed);
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");
    textEl.textContent = `${mm}:${ss}`;
    const fraction = Math.max(0, remaining / EXAM_DURATION_SECONDS);
    progressEl.style.strokeDashoffset = TIMER_CIRCUMFERENCE * (1 - fraction);
    circleEl.classList.toggle("warning", remaining <= TIMER_WARNING_SECONDS);
    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      if (!quizFinished) {
        alert("⏰ Đã hết thời gian làm bài! Bài thi sẽ được tự động nộp.");
        submitQuiz(true);
      }
    }
  }
  tick();
  timerInterval = setInterval(tick, 1e3);
}
function stopExamTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}
function isLocked(q) {
  if (QUIZ_MODE === "kiemtra") return quizFinished;
  return quizFinished || (state[q.id] && state[q.id].checked);
}
function getUnansweredQuestionNumbers() {
  const arr = [];
  ACTIVE_QUIZ.forEach((q, idx) => {
    if (!isAttempted(q)) arr.push(idx + 1);
  });
  return arr;
}
function renderSidebar() {
  const grid = DOM.qgrid;
  grid.innerHTML = "";
  ACTIVE_QUIZ.forEach((q, i) => {
    const b = document.createElement("button");
    b.className = "qbtn";
    b.textContent = i + 1;
    if (i === current) b.classList.add("current");
    if (isLocked(q)) {
      const correct = state[q.id] && state[q.id].correct;
      b.classList.add(correct ? "done-correct" : "done-wrong");
    } else if (isAttempted(q)) {
      b.classList.add("done-attempted");
    }
    b.onclick = () => {
      goToQuestion(i);
    };
    grid.appendChild(b);
  });
  let submitNavBtn = document.getElementById("gotoSubmitBtn");
  if (!quizFinished) {
    if (!submitNavBtn) {
      submitNavBtn = document.createElement("button");
      submitNavBtn.id = "gotoSubmitBtn";
      submitNavBtn.style.width = "100%";
      submitNavBtn.style.marginBottom = "14px";
      grid.insertAdjacentElement("afterend", submitNavBtn);
    }
    const onReviewPage = current === ACTIVE_QUIZ.length;
    if (onReviewPage) {
      const unansweredNums = getUnansweredQuestionNumbers();
      submitNavBtn.className = "btn btn-primary";
      submitNavBtn.style.width = "100%";
      submitNavBtn.style.marginBottom = "14px";
      submitNavBtn.textContent = "NỘP BÀI";
      submitNavBtn.disabled = unansweredNums.length > 0;
      submitNavBtn.onclick = () => {
        const stillUnanswered = getUnansweredQuestionNumbers();
        if (stillUnanswered.length > 0) {
          alert(
            `Bạn cần hoàn thành tất cả các câu hỏi trước khi nộp bài.\nCòn ${stillUnanswered.length} câu chưa làm: Câu ${stillUnanswered.join(", Câu ")}`,
          );
          return;
        }
        submitQuiz();
      };
    } else {
      submitNavBtn.className = "btn btn-ghost";
      submitNavBtn.disabled = false;
      submitNavBtn.textContent = "📝 Nộp bài";
      submitNavBtn.onclick = () => {
        goToQuestion(ACTIVE_QUIZ.length);
      };
    }
  } else if (submitNavBtn) {
    submitNavBtn.remove();
  }
  const legend = DOM.sideLegend;
  const scoreNum = DOM.scoreNow;
  const scoreLbl = DOM.scoreLbl;
  const faceBox = DOM.faceBox;
  const faceEmoji = DOM.faceEmoji;
  const faceMsg = DOM.faceMsg;
  if (quizFinished && lastResult) {
    legend.innerHTML = `<span><i class="dot g"></i> Đúng</span><span><i class="dot r"></i> Sai</span>`;
    const percent = lastResult.score;
    faceBox.className = "face-box";
    faceEmoji.textContent = "";
    faceMsg.textContent = "";
  } else {
    legend.innerHTML = `<span><i class="dot b"></i> Đã trả lời</span><span><i class="dot n"></i> Chưa làm</span>`;
    if (scoreNum) scoreNum.textContent = "–";
    if (scoreLbl) scoreLbl.textContent = "Điểm sẽ hiển thị sau khi nộp bài";
    faceBox.className = "face-box";
  }
}
const RENDERERS = {
  single: renderSingle,
  multiple: renderMultiple,
  ordering: renderOrdering,
  matching: renderMatching,
  position: renderPosition,
  list: renderList,
  imagepoint: renderImagePoint,
  dragfill: renderDragFill,
  selectfill: renderSelectFill,
  classify: renderClassify,
  classify2: renderClassify2,
};
function ensureState(q) {
  if (state[q.id]) return state[q.id];
  switch (q.type) {
    case "single":
      state[q.id] = { userAnswer: null, checked: false };
      break;
    case "multiple":
      state[q.id] = { userAnswer: [], checked: false };
      break;
    case "ordering":
      state[q.id] = {
        order: shuffleArray(q.items.map((_, i) => i)),
        checked: false,
      };
      break;
    case "matching":
      state[q.id] = { pairs: {}, activeLeft: null, checked: false };
      break;
    case "position":
      state[q.id] = { userAnswer: null, checked: false };
      break;
    case "list":
      state[q.id] = {
        userAnswer: new Array(q.items.length).fill(null),
        checked: false,
        order: shuffleArray(q.items.map((_, i) => i)),
      };
      break;
    case "imagepoint":
      state[q.id] =
        Array.isArray(q.answer) && q.answerMode !== "any"
          ? { userAnswer: [], checked: false }
          : { userAnswer: null, checked: false };
      break;
    case "dragfill":
      state[q.id] = {
        placed: {},
        activeChip: null,
        checked: false,
        poolOrder: shuffleArray(q.options.map((_, i) => i)),
      };
      break;
    case "selectfill":
      state[q.id] = { placed: {}, checked: false };
      break;
    case "classify":
      state[q.id] = { placed: {}, activeChip: null, checked: false };
      break;
    case "classify2":
      state[q.id] = {
        placed: {},
        activeChip: null,
        activeZone: null,
        checked: false,
      };
      break;
    default:
      state[q.id] = { checked: false };
  }
  return state[q.id];
}
function textToSafeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");
  let html = div.innerHTML;
  html = html.replace(/&lt;(\/?)(b|i|u|strong|em)&gt;/gi, "<$1$2>");
  return html.replace(/\n/g, "<br>");
}
function formatExplainHtml(text) {
  const raw = String(text ?? "");
  if (!raw.trim()) return "";
  if (raw.includes("\n")) {
    let boldedFirst = false;
    const htmlLines = raw
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed === "") return "";
        const isDash = /^-\s?/.test(trimmed);
        const isSub = /^[·•*+]/.test(trimmed) || /^\s{2,}\S/.test(line);
        const safe = textToSafeHtml(trimmed);
        const shouldBold = isDash || !boldedFirst;
        if (shouldBold) boldedFirst = true;
        const content = shouldBold ? `<b>${safe}</b>` : safe;
        return isSub ? `<span class="explain-sub">${content}</span>` : content;
      })
      .filter(Boolean);
    return htmlLines.join("<br>");
  }
  const str = raw.trim();
  const m = str.match(/^(.*?[.!?])(\s+|$)/);
  const first = m ? m[1] : str;
  const rest = m ? str.slice(m[0].length).trim() : "";
  let restHtml = "";
  if (rest) {
    const parts = (function (s) {
      const out = [];
      let rem = s;
      const re = /^(.*?[.!?])(?:\s+|$)/;
      while (rem) {
        const m = rem.match(re);
        if (!m) {
          out.push(rem);
          break;
        }
        out.push(m[1]);
        rem = rem.slice(m[0].length);
        if (m[0].length === 0) break;
      }
      return out;
    })(rest).filter(Boolean);
    restHtml = parts.map((p) => "<br>" + textToSafeHtml(p)).join("");
  }
  return `<b>${textToSafeHtml(first)}</b>${restHtml}`;
}
function makePopIcon(explainHtml, kind, alignRight) {
  const icon = document.createElement("span");
  icon.className =
    "pop-icon" +
    (kind === "correct"
      ? " pop-correct"
      : kind === "wrong"
        ? " pop-wrong"
        : "") +
    (alignRight ? " pop-align-right" : "");
  icon.textContent = "i";
  icon.title = "Xem giải thích";
  const box = document.createElement("span");
  box.className = "pop-box";
  const titleEl = document.createElement("span");
  titleEl.className =
    "pop-title" +
    (kind === "correct"
      ? " pop-title-correct"
      : kind === "wrong"
        ? " pop-title-wrong"
        : "");
  titleEl.textContent =
    kind === "correct"
      ? "✅ Đáp án đúng"
      : kind === "wrong"
        ? "❌ Đáp án sai"
        : "💡 Giải thích";
  box.appendChild(titleEl);
  const bodyEl = document.createElement("span");
  bodyEl.style.display = "block";
  bodyEl.innerHTML = explainHtml;
  box.appendChild(bodyEl);
  icon.appendChild(box);
  icon.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasOpen = icon.classList.contains("pop-open");
    document
      .querySelectorAll(".pop-icon.pop-open, .explain-trigger.pop-open")
      .forEach((el) => {
        if (el !== icon) el.classList.remove("pop-open");
      });
    icon.classList.toggle("pop-open", !wasOpen);
  });
  return icon;
}
document.addEventListener("click", () => {
  document
    .querySelectorAll(".pop-icon.pop-open, .explain-trigger.pop-open")
    .forEach((el) => el.classList.remove("pop-open"));
});
function buildQuestionPreImageEl(q, side) {
  const preImg = document.createElement("img");
  preImg.className = "q-pre-image zoomable-img";
  preImg.src = q.preImage;
  preImg.alt = "";
  preImg.addEventListener("click", (e) => {
    e.stopPropagation();
    openImageZoom(q.preImage);
  });
  const align = q.imageAlign || "center";
  if (align === "left") preImg.style.margin = side === "after" ? "16px auto 0 0" : "0 auto 16px 0";
  else if (align === "right") preImg.style.margin = side === "after" ? "16px 0 0 auto" : "0 0 16px auto";
  else preImg.style.margin = side === "after" ? "16px auto 0" : "0 auto 16px";
  return preImg;
}
function renderAll() {
  renderSidebar();
  const mount = DOM.mainCard;
  mount.innerHTML = "";
  const isReviewPage = !quizFinished && current === ACTIVE_QUIZ.length;
  if (isReviewPage) {
    renderReviewPage(mount);
    return;
  }
  const q = ACTIVE_QUIZ[current];
  const label = document.createElement("div");
  label.className = "q-label";
  label.textContent = quizFinished
    ? `XEM LẠI CÂU: ${current + 1} / ${ACTIVE_QUIZ.length}`
    : `CÂU HỎI: ${current + 1} / ${ACTIVE_QUIZ.length}`;
  mount.appendChild(label);
  const layout = q.preImage ? q.imageLayout || "stack" : null;
  if (layout === "row") {
    const rowWrap = document.createElement("div");
    rowWrap.className = "q-row-wrap";
    const textCol = document.createElement("div");
    textCol.className = "q-row-text";
    const qt = document.createElement("p");
    qt.className = "q-text";
    qt.textContent = q.question;
    textCol.appendChild(qt);
    if (q.hint) {
      const hint = document.createElement("p");
      hint.className = "q-hint";
      hint.textContent = q.hint;
      textCol.appendChild(hint);
    }
    const imgCol = document.createElement("div");
    imgCol.className = "q-row-image";
    const preImg = document.createElement("img");
    preImg.src = q.preImage;
    preImg.alt = "";
    preImg.classList.add("zoomable-img");
    preImg.addEventListener("click", (e) => {
      e.stopPropagation();
      openImageZoom(q.preImage);
    });
    imgCol.appendChild(preImg);
    const position = q.imagePosition || "right";
    if (position === "left") {
      rowWrap.appendChild(imgCol);
      rowWrap.appendChild(textCol);
    } else {
      rowWrap.appendChild(textCol);
      rowWrap.appendChild(imgCol);
    }
    mount.appendChild(rowWrap);
  } else {
    if (q.preImage && layout !== "after") {
      mount.appendChild(buildQuestionPreImageEl(q, "before"));
    }
    const qt = document.createElement("p");
    qt.className = "q-text";
    qt.textContent = q.question;
    mount.appendChild(qt);
    if (q.hint) {
      const hint = document.createElement("p");
      hint.className = "q-hint";
      hint.textContent = q.hint;
      mount.appendChild(hint);
    }
    if (q.preImage && layout === "after") {
      mount.appendChild(buildQuestionPreImageEl(q, "after"));
    }
  }
  const body = document.createElement("div");
  body.id = "qBody";
  mount.appendChild(body);
  const s = ensureState(q);
  const renderFn = RENDERERS[q.type];
  if (renderFn) renderFn(q, body, s);
  if (isLocked(q)) {
    const correct = state[q.id] && state[q.id].correct;
    const section = document.createElement("div");
    section.className = "explain-section";
    const sectionLabel = document.createElement("div");
    sectionLabel.className =
      "explain-section-label " + (correct ? "label-correct" : "label-wrong");
    sectionLabel.innerHTML = `<span class="dot"></span><span>Giải thích đáp án</span>`;
    section.appendChild(sectionLabel);
    const explainBox = document.createElement("div");
    explainBox.className = "explain " + (correct ? "correct-box" : "wrong-box");
    const iconEl = document.createElement("span");
    iconEl.textContent = correct ? "✅" : "❌";
    explainBox.appendChild(iconEl);
    const bodyEl = document.createElement("span");
    bodyEl.innerHTML = formatExplainHtml(q.explain);
    explainBox.appendChild(bodyEl);
    section.appendChild(explainBox);
    mount.appendChild(section);
  }
  renderNav(mount, q, s);
}
function renderReviewPage(mount) {
  const unansweredNums = getUnansweredQuestionNumbers();
  const label = document.createElement("div");
  label.className = "q-label";
  label.textContent = "TRANG NỘP BÀI";
  mount.appendChild(label);
  if (unansweredNums.length > 0) {
    const warn = document.createElement("div");
    warn.className = "submit-warning";
    warn.innerHTML =
      `⚠️ <b>Bạn cần hoàn thành tất cả câu hỏi trước khi nộp bài.</b><br>` +
      `Còn <b>${unansweredNums.length}</b> câu chưa làm: ` +
      unansweredNums
        .map((n) => `<span class="warn-qnum" data-q="${n}">Câu ${n}</span>`)
        .join(" ");
    mount.appendChild(warn);
    warn.querySelectorAll(".warn-qnum").forEach((el) => {
      el.onclick = () => {
        goToQuestion(Number(el.dataset.q) - 1);
      };
    });
  } else {
    const ok = document.createElement("div");
    ok.className = "explain correct-box";
    ok.innerHTML = `<span>✅</span><span><b>Đã hoàn thành ${ACTIVE_QUIZ.length}/${ACTIVE_QUIZ.length} câu.</b> Bấm "NỘP BÀI" để xem kết quả.</span>`;
    mount.appendChild(ok);
  }
  const nav = document.createElement("div");
  nav.className = "nav-row";
  const prev = document.createElement("button");
  prev.className = "btn btn-ghost";
  prev.innerHTML =
    '<span class="nav-label-full">← QUAY LẠI</span><span class="nav-label-short">← QUAY LẠI</span>';
  prev.onclick = () => {
    goToQuestion(ACTIVE_QUIZ.length - 1);
  };
  nav.appendChild(prev);
  mount.appendChild(nav);
}
function renderNav(mount, q, s) {
  if (!quizFinished) {
    const nav = document.createElement("div");
    nav.className = "nav-row";
    const prev = document.createElement("button");
    prev.className = "btn btn-ghost";
    prev.innerHTML =
      '<span class="nav-label-full">← TRƯỚC</span><span class="nav-label-short">← Trước</span>';
    prev.disabled = current === 0;
    prev.onclick = () => {
      goToQuestion(current - 1);
    };
    nav.appendChild(prev);
    if (QUIZ_MODE === "onluyen") {
      const checkBtn = document.createElement("button");
      checkBtn.className = "btn btn-check";
      checkBtn.innerHTML = isLocked(q)
        ? '<span class="nav-label-full">✓ Đã kiểm tra</span><span class="nav-label-short">✓ Đã kiểm tra</span>'
        : '<span class="nav-label-full">Kiểm tra đáp án</span><span class="nav-label-short">Kiểm tra</span>';
      checkBtn.disabled = isLocked(q) || !isAttempted(q);
      checkBtn.onclick = () => {
        const correct = checkAnswerCorrect(q);
        state[q.id].correct = correct;
        state[q.id].checked = true;
        renderAll();
      };
      nav.appendChild(checkBtn);
    }
    const next = document.createElement("button");
    next.className = "btn btn-primary";
    next.innerHTML =
      '<span class="nav-label-full">TIẾP THEO →</span><span class="nav-label-short">Tiếp →</span>';
    next.onclick = () => {
      goToQuestion(current + 1);
    };
    nav.appendChild(next);
    mount.appendChild(nav);
  } else {
    const nav = document.createElement("div");
    nav.className = "nav-row";
    const prev = document.createElement("button");
    prev.className = "btn btn-ghost";
    prev.innerHTML =
      '<span class="nav-label-full">← TRƯỚC</span><span class="nav-label-short">← Trước</span>';
    prev.disabled = current === 0;
    prev.onclick = () => {
      goToQuestion(current - 1);
    };
    nav.appendChild(prev);
    const backBtn = document.createElement("button");
    backBtn.className = "btn btn-ghost";
    backBtn.innerHTML =
      '<span class="nav-label-full">📊 Xem kết quả</span><span class="nav-label-short">📊 Kết quả</span>';
    backBtn.onclick = () => showResultScreen();
    nav.appendChild(backBtn);
    const next = document.createElement("button");
    next.className = "btn btn-primary";
    next.innerHTML =
      '<span class="nav-label-full">TIẾP THEO →</span><span class="nav-label-short">Tiếp →</span>';
    next.disabled = current === ACTIVE_QUIZ.length - 1;
    next.onclick = () => {
      goToQuestion(current + 1);
    };
    nav.appendChild(next);
    mount.appendChild(nav);
  }
}
function openImageZoom(src) {
  let ov = document.getElementById("imgZoomOverlay");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "imgZoomOverlay";
    const closeBtn = document.createElement("div");
    closeBtn.className = "img-zoom-close";
    closeBtn.textContent = "×";
    const img = document.createElement("img");
    ov.appendChild(closeBtn);
    ov.appendChild(img);
    ov.addEventListener("click", function () {
      ov.classList.remove("active");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") ov.classList.remove("active");
    });
    document.body.appendChild(ov);
  }
  ov.querySelector("img").src = src;
  ov.classList.add("active");
}
function renderChoiceQuestion(q, body, s, multi) {
  const wrap = document.createElement("div");
  wrap.className = "options";
  const selectedSet = multi ? new Set(s.userAnswer) : null;
  const locked = isLocked(q);
  q.options.forEach((opt, i) => {
    const el = document.createElement("div");
    el.className = "option";
    const isCorrect = multi ? q.answer.includes(i) : i === q.answer;
    const isChosen = multi ? selectedSet.has(i) : s.userAnswer === i;
    if (locked) {
      el.classList.add("disabled");
      if (isCorrect) el.classList.add("correct");
      else if (isChosen) el.classList.add("wrong");
    } else if (isChosen) {
      el.classList.add("selected");
    }
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = OPTION_LETTERS[i];
    el.appendChild(tag);
    const optImg = q.optionImages && q.optionImages[i];
    const makeOptImg = () => {
      const img = document.createElement("img");
      img.className = "option-img zoomable-img";
      img.src = optImg.src;
      img.alt = "";
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        openImageZoom(optImg.src);
      });
      return img;
    };
    if (optImg && optImg.position !== "after") el.appendChild(makeOptImg());
    const textWrap = document.createElement("span");
    const textInner = document.createElement(
      locked && isCorrect ? "b" : "span",
    );
    textInner.textContent = opt;
    textWrap.appendChild(textInner);
    el.appendChild(textWrap);
    if (optImg && optImg.position === "after") el.appendChild(makeOptImg());
    if (!locked) {
      el.onclick = () => {
        if (multi) {
          if (selectedSet.has(i)) {
            selectedSet.delete(i);
          } else {
            const maxPick = Array.isArray(q.answer)
              ? q.answer.length
              : Infinity;
            if (selectedSet.size >= maxPick) return;
            selectedSet.add(i);
          }
          s.userAnswer = Array.from(selectedSet);
        } else {
          s.userAnswer = i;
        }
        renderAll();
      };
    }
    wrap.appendChild(el);
  });
  body.appendChild(wrap);
}
function renderSingle(q, body, s) {
  renderChoiceQuestion(q, body, s, false);
}
function renderMultiple(q, body, s) {
  renderChoiceQuestion(q, body, s, true);
}
function renderList(q, body, s) {
  const wrap = document.createElement("div");
  wrap.className = "list-items";
  const locked = isLocked(q);
  const order = s.order || q.items.map((_, i) => i);
  order.forEach((idx) => {
    const item = q.items[idx];
    const row = document.createElement("div");
    row.className = "list-item-row";
    const label = document.createElement("span");
    label.className = "list-item-label";
    label.textContent = `* ${item.label}`;
    row.appendChild(label);
    const select = document.createElement("select");
    select.className = "select-input";
    select.disabled = locked;
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "- Select -";
    placeholder.disabled = true;
    placeholder.selected = s.userAnswer[idx] === null;
    select.appendChild(placeholder);
    item.options.forEach((opt, i) => {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = opt;
      if (s.userAnswer[idx] === i) o.selected = true;
      select.appendChild(o);
    });
    if (locked) {
      select.classList.add(
        s.userAnswer[idx] === item.answer ? "correct" : "wrong",
      );
    }
    if (!locked) {
      select.onchange = (e) => {
        s.userAnswer[idx] =
          e.target.value === "" ? null : Number(e.target.value);
        renderAll();
      };
    }
    row.appendChild(select);
    if (locked && s.userAnswer[idx] !== item.answer) {
      const note = document.createElement("span");
      note.className = "list-correct-note";
      note.innerHTML = `Đáp án đúng: <b>${item.options[item.answer]}</b>`;
      row.appendChild(note);
    }
    wrap.appendChild(row);
  });
  body.appendChild(wrap);
}
function renderOrdering(q, body, s) {
  const wrap = document.createElement("div");
  wrap.className = "order-list";
  const locked = isLocked(q);
  function getRowAtClientY(clientY, excludeRow) {
    const rows = Array.from(wrap.querySelectorAll(".order-item"));
    for (const row of rows) {
      if (row === excludeRow) continue;
      const rect = row.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) return row;
    }
    return null;
  }
  function clearDragoverTargets() {
    wrap
      .querySelectorAll(".order-item")
      .forEach((r) => r.classList.remove("dragover-target"));
  }
  s.order.forEach((itemIdx, pos) => {
    const row = document.createElement("div");
    row.className = "order-item";
    row.dataset.pos = pos;
    if (locked) {
      const isCorrectPos = itemIdx === q.answerOrder[pos];
      row.classList.add(isCorrectPos ? "correct" : "wrong");
      row.innerHTML = `<span class="num">${pos + 1}</span><span class="txt">${isCorrectPos ? `<b>${q.items[itemIdx]}</b>` : q.items[itemIdx]}</span>`;
    } else {
      row.innerHTML = `<span class="num">${pos + 1}</span><span class="txt">${q.items[itemIdx]}</span>`;
    }
    if (!locked) {
      const btns = document.createElement("div");
      btns.className = "order-btns";
      const dragIcon = document.createElement("span");
      dragIcon.className = "icon-btn drag-handle";
      dragIcon.textContent = "⠿";
      dragIcon.title =
        "Giữ và kéo để sắp xếp (có thể kéo ở bất kỳ đâu trên dòng)";
      dragIcon.style.pointerEvents = "none";
      const up = document.createElement("button");
      up.className = "icon-btn";
      up.textContent = "↑";
      up.disabled = pos === 0;
      up.onclick = (e) => {
        e.stopPropagation();
        [s.order[pos - 1], s.order[pos]] = [s.order[pos], s.order[pos - 1]];
        renderAll();
      };
      const down = document.createElement("button");
      down.className = "icon-btn";
      down.textContent = "↓";
      down.disabled = pos === s.order.length - 1;
      down.onclick = (e) => {
        e.stopPropagation();
        [s.order[pos + 1], s.order[pos]] = [s.order[pos], s.order[pos + 1]];
        renderAll();
      };
      up.addEventListener("pointerdown", (e) => e.stopPropagation());
      down.addEventListener("pointerdown", (e) => e.stopPropagation());
      btns.appendChild(dragIcon);
      btns.appendChild(up);
      btns.appendChild(down);
      row.appendChild(btns);
      row.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".icon-btn:not(.drag-handle)")) return;
        e.preventDefault();
        const startPos = Number(row.dataset.pos);
        row.classList.add("dragging");
        document.body.classList.add("ordering-drag-active");
        function onMove(ev) {
          clearDragoverTargets();
          const overRow = getRowAtClientY(ev.clientY, row);
          if (overRow) overRow.classList.add("dragover-target");
        }
        function onUp(ev) {
          document.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerup", onUp);
          document.removeEventListener("pointercancel", onUp);
          document.body.classList.remove("ordering-drag-active");
          clearDragoverTargets();
          const overRow = getRowAtClientY(ev.clientY, row);
          if (overRow) {
            const toPos = Number(overRow.dataset.pos);
            if (toPos !== startPos) {
              const moved = s.order.splice(startPos, 1)[0];
              s.order.splice(toPos, 0, moved);
            }
          }
          renderAll();
        }
        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
        document.addEventListener("pointercancel", onUp);
      });
    }
    wrap.appendChild(row);
  });
  body.appendChild(wrap);
}
const PAIR_COLORS = [
  "#2f6fed",
  "#f59e0b",
  "#8b5cf6",
  "#0ea5e9",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];
function renderMatching(q, body, s) {
  const wrap = document.createElement("div");
  wrap.className = "match-wrap";
  wrap.id = "matchWrap";
  const locked = isLocked(q);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "match-svg");
  svg.id = "matchSvg";
  wrap.appendChild(svg);
  const leftCol = document.createElement("div");
  leftCol.className = "match-col";
  const rightCol = document.createElement("div");
  rightCol.className = "match-col";
  function unlink(leftIdx) {
    delete s.pairs[leftIdx];
    renderAll();
  }
  function assignPair(leftIdx, rightIdx) {
    Object.keys(s.pairs).forEach((k) => {
      if (Number(k) !== leftIdx && s.pairs[k] === rightIdx) delete s.pairs[k];
    });
    s.pairs[leftIdx] = rightIdx;
  }
  function matchCellHtml(txt) {
    if (txt && typeof txt === "object" && txt.image) {
      const safeLabel = (txt.label || "").replace(/"/g, "&quot;");
      return `<span class="match-item-img-wrap"><img class="match-item-img" src="${txt.image}" alt="${safeLabel}">${txt.label ? `<span>${txt.label}</span>` : ""}</span>`;
    }
    return txt;
  }
  function colorForLeft(i) {
    return PAIR_COLORS[i % PAIR_COLORS.length];
  }
  q.left.forEach((txt, i) => {
    const el = document.createElement("div");
    el.className = "match-item";
    el.dataset.side = "left";
    el.dataset.idx = i;
    el.draggable = !locked && !IS_TOUCH;
    const linked = s.pairs[i] !== undefined;
    const color = colorForLeft(i);
    if (s.activeLeft === i) el.classList.add("active");
    const isCorrectPairLeft =
      locked && matchAccepts(q.correctMap[i], s.pairs[i]);
    if (locked) {
      if (isCorrectPairLeft) {
        el.style.borderColor = "var(--green)";
        el.style.background = "var(--green-pale)";
      } else {
        el.style.borderColor = "var(--red)";
        el.style.background = "var(--red-pale)";
      }
    } else if (linked) {
      el.style.borderColor = color;
      el.style.background = color + "14";
    }
    let inner = "";
    if (linked || locked) {
      const badgeBg = locked
        ? isCorrectPairLeft
          ? "var(--green)"
          : "var(--red)"
        : color;
      inner += `<span class="pair-badge" style="background:${badgeBg}">${locked ? (isCorrectPairLeft ? "✓" : "✕") : i + 1}</span>`;
    }
    inner +=
      locked && isCorrectPairLeft
        ? `<span><b>${matchCellHtml(txt)}</b></span>`
        : `<span>${matchCellHtml(txt)}</span>`;
    if (linked && !locked) {
      inner += `<button class="unlink-btn" title="Bỏ nối">✕</button>`;
    }
    el.innerHTML = inner;
    if (!locked) {
      el.onclick = (e) => {
        if (e.target.classList.contains("unlink-btn")) {
          unlink(i);
          return;
        }
        s.activeLeft = s.activeLeft === i ? null : i;
        renderAll();
      };
      el.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", String(i));
        el.classList.add("dragging");
      });
      el.addEventListener("dragend", () => el.classList.remove("dragging"));
    }
    leftCol.appendChild(el);
  });
  q.right.forEach((txt, i) => {
    const el = document.createElement("div");
    el.className = "match-item";
    el.dataset.side = "right";
    el.dataset.idx = i;
    const leftMatchIdx = Object.keys(s.pairs).find((k) => s.pairs[k] === i);
    const linked = leftMatchIdx !== undefined;
    const correctLeftForThisRight = matchFirstAcceptingLeft(q, i);
    if (locked) {
      const wasMatchedCorrectly =
        linked && matchAccepts(q.correctMap[Number(leftMatchIdx)], i);
      let badge = "";
      if (wasMatchedCorrectly) {
        el.style.borderColor = "var(--green)";
        el.style.background = "var(--green-pale)";
        badge = `<span class="pair-badge" style="background:var(--green)">✓</span>`;
      } else if (linked) {
        el.style.borderColor = "var(--red)";
        el.style.background = "var(--red-pale)";
        badge = `<span class="pair-badge" style="background:var(--red)">✕</span>`;
      } else {
        const color = colorForLeft(correctLeftForThisRight);
        el.style.borderColor = color;
        el.style.borderStyle = "dashed";
        el.style.background = color + "1f";
        badge = `<span class="pair-badge" style="background:${color};opacity:.9;">★</span>`;
      }
      el.innerHTML = `${badge}${wasMatchedCorrectly ? `<span><b>${matchCellHtml(txt)}</b></span>` : `<span>${matchCellHtml(txt)}</span>`}`;
    } else if (linked) {
      const color = colorForLeft(Number(leftMatchIdx));
      el.style.borderColor = color;
      el.style.background = color + "14";
      el.innerHTML = `<span class="pair-badge" style="background:${color}">${Number(leftMatchIdx) + 1}</span><span>${matchCellHtml(txt)}</span>`;
    } else {
      el.innerHTML = `<span>${matchCellHtml(txt)}</span>`;
    }
    if (!locked) {
      el.onclick = () => {
        if (s.activeLeft !== null && s.activeLeft !== undefined) {
          assignPair(s.activeLeft, i);
          s.activeLeft = null;
          renderAll();
        }
      };
      el.addEventListener("dragover", (e) => {
        e.preventDefault();
        el.classList.add("dragover");
      });
      el.addEventListener("dragleave", () => el.classList.remove("dragover"));
      el.addEventListener("drop", (e) => {
        e.preventDefault();
        el.classList.remove("dragover");
        const leftIdx = Number(e.dataTransfer.getData("text/plain"));
        assignPair(leftIdx, i);
        s.activeLeft = null;
        renderAll();
      });
    }
    rightCol.appendChild(el);
  });
  wrap.appendChild(leftCol);
  wrap.appendChild(rightCol);
  body.appendChild(wrap);
  const hintRow = document.createElement("div");
  hintRow.className = "match-hint-row";
  hintRow.innerHTML = locked
    ? `<span>✓ = nối đúng &nbsp; ✕ = nối sai &nbsp; ★ (viền nét đứt) = đáp án đúng cho mục đang sai</span><span>Số câu đúng: ${q.left.filter((_, i) => matchAccepts(q.correctMap[i], s.pairs[i])).length}/${q.left.length}</span>`
    : `<span>💡 Kéo-thả hoặc bấm chọn từng cặp để nối — mỗi cặp có 1 màu riêng</span><span>Đã nối: ${Object.keys(s.pairs).length}/${q.left.length}</span>`;
  body.appendChild(hintRow);
  requestAnimationFrame(() => drawMatchLines(q, s));
}
function drawMatchLines(q, s) {
  const wrap = document.getElementById("matchWrap");
  const svg = document.getElementById("matchSvg");
  if (!wrap || !svg) return;
  const wrapRect = wrap.getBoundingClientRect();
  svg.innerHTML = "";
  svg.setAttribute("viewBox", `0 0 ${wrapRect.width} ${wrapRect.height}`);
  const locked = isLocked(ACTIVE_QUIZ[current]);
  function pathBetween(leftIdx, rightIdx, color, dashed, width) {
    const leftEl = wrap.querySelector(
      `.match-item[data-side="left"][data-idx="${leftIdx}"]`,
    );
    const rightEl = wrap.querySelector(
      `.match-item[data-side="right"][data-idx="${rightIdx}"]`,
    );
    if (!leftEl || !rightEl) return;
    const lr = leftEl.getBoundingClientRect();
    const rr = rightEl.getBoundingClientRect();
    const x1 = lr.right - wrapRect.left;
    const y1 = lr.top + lr.height / 2 - wrapRect.top;
    const x2 = rr.left - wrapRect.left;
    const y2 = rr.top + rr.height / 2 - wrapRect.top;
    const midX = (x1 + x2) / 2;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`,
    );
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", width || "2.5");
    path.setAttribute("fill", "none");
    path.setAttribute("opacity", dashed ? "0.7" : "0.9");
    if (dashed) path.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(path);
  }
  Object.keys(s.pairs).forEach((leftIdxStr) => {
    const leftIdx = Number(leftIdxStr);
    const rightIdx = s.pairs[leftIdx];
    const isCorrectPair = locked
      ? matchAccepts(q.correctMap[leftIdx], rightIdx)
      : true;
    const color = locked
      ? isCorrectPair
        ? "#1f9d55"
        : "#e0433c"
      : PAIR_COLORS[leftIdx % PAIR_COLORS.length];
    pathBetween(leftIdx, rightIdx, color, false, locked ? "3" : "2.5");
    if (locked && !isCorrectPair) {
      const correctTarget = Array.isArray(q.correctMap[leftIdx])
        ? q.correctMap[leftIdx][0]
        : q.correctMap[leftIdx];
      pathBetween(
        leftIdx,
        correctTarget,
        PAIR_COLORS[leftIdx % PAIR_COLORS.length],
        true,
      );
    }
  });
}
let matchResizeTimeout = null;
window.addEventListener("resize", () => {
  if (!ACTIVE_QUIZ[current] || ACTIVE_QUIZ[current].type !== "matching") return;
  clearTimeout(matchResizeTimeout);
  matchResizeTimeout = setTimeout(() => {
    const q = ACTIVE_QUIZ[current];
    const s = state[q.id];
    if (s) drawMatchLines(q, s);
  }, 120);
});
function renderPosition(q, body, s) {
  const stage = document.createElement("div");
  stage.className = "position-stage";
  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";
  const locked = isLocked(q);
  q.toolbar.forEach((item, i) => {
    const btn = document.createElement("div");
    btn.className = "toolbar-btn";
    if (locked) {
      if (i === q.answer) btn.classList.add("correct");
      else if (i === s.userAnswer) btn.classList.add("wrong");
    } else if (s.userAnswer === i) {
      btn.classList.add("selected");
    }
    btn.innerHTML =
      locked && i === q.answer
        ? `<span class="ic">${item.icon}</span><span><b>${item.label}</b></span>`
        : `<span class="ic">${item.icon}</span><span>${item.label}</span>`;
    if (!locked) {
      btn.onclick = () => {
        s.userAnswer = i;
        renderAll();
      };
    }
    toolbar.appendChild(btn);
  });
  stage.appendChild(toolbar);
  body.appendChild(stage);
}
function renderImagePoint(q, body, s) {
  const isOrMode = Array.isArray(q.answer) && q.answerMode === "any";
  const isMulti = Array.isArray(q.answer) && !isOrMode;
  const stageWrap = document.createElement("div");
  stageWrap.style.textAlign = "center";
  const stage = document.createElement("div");
  stage.className = "image-stage";
  const locked = isLocked(q);
  const img = document.createElement("img");
  img.className = "image-stage-img";
  img.src = q.image;
  img.alt = q.question;
  img.draggable = false;
  stage.appendChild(img);
  const selected = isMulti ? new Set(s.userAnswer) : null;
  q.points.forEach((pt, i) => {
    const marker = document.createElement("div");
    const isRect = pt.width != null && pt.height != null;
    marker.className = isRect ? "image-marker marker-rect" : "image-marker";
    if (isRect) {
      if (pt.right != null) {
        marker.style.right = pt.right + "%";
      } else {
        marker.style.left = pt.x + "%";
      }
      marker.style.top = pt.y + "%";
      marker.style.width = pt.width + "%";
      marker.style.height = pt.height + "%";
    } else {
      marker.style.left = pt.x + "%";
      marker.style.top = pt.y + "%";
    }
    const isCorrectPoint =
      isMulti || isOrMode ? q.answer.includes(i) : i === q.answer;
    const isPicked = isMulti ? selected.has(i) : s.userAnswer === i;
    if (locked) {
      marker.classList.add("disabled");
      if (isCorrectPoint) marker.classList.add("correct");
      else if (isPicked) marker.classList.add("wrong");
    } else if (isPicked) {
      marker.classList.add("selected");
    }
    marker.innerHTML = `<span class="marker-num">${i + 1}</span>`;
    marker.title = pt.label || `Vị trí ${i + 1}`;
    if (!locked) {
      marker.onclick = () => {
        if (isMulti) {
          if (selected.has(i)) {
            selected.delete(i);
          } else {
            const maxPick = q.answer.length;
            if (selected.size >= maxPick) return;
            selected.add(i);
          }
          s.userAnswer = Array.from(selected);
        } else {
          s.userAnswer = i;
        }
        renderAll();
      };
    }
    stage.appendChild(marker);
  });
  stageWrap.appendChild(stage);
  body.appendChild(stageWrap);
  const colorKey = document.createElement("div");
  colorKey.className = "image-legend";
  colorKey.style.marginTop = "10px";
  colorKey.innerHTML = locked
    ? `<span class="image-marker-legend-key"><i class="swatch" style="background:#1f9d55;"></i>Đáp án đúng</span>\n       <span class="image-marker-legend-key"><i class="swatch" style="background:#e0433c;"></i>Bạn chọn sai</span>`
    : `<span class="image-marker-legend-key"><i class="swatch" style="background:#94a3b8;"></i>Chưa chọn</span>\n       <span class="image-marker-legend-key"><i class="swatch" style="background:#2f6fed;"></i>Đã chọn</span>`;
  body.appendChild(colorKey);
}
function renderDragFill(q, body, s) {
  if (!s.placed) s.placed = {};
  if (s.activeChip === undefined) s.activeChip = null;
  if (!s.poolOrder) s.poolOrder = shuffleArray(q.options.map((_, i) => i));
  const locked = isLocked(q);
  const dragfillOrderIndependent =
    q.orderIndependent === true || q.answerMode === "any";
  const dragfillOverallCorrect = dragfillOrderIndependent
    ? (function () {
        const placedVals = q.answer
          .map((_, idx) => s.placed[idx])
          .slice()
          .sort();
        const correctVals = q.answer.slice().sort();
        return JSON.stringify(placedVals) === JSON.stringify(correctVals);
      })()
    : null;
  const wrap = document.createElement("div");
  wrap.className = "dragfill-wrap";
  function makeBlank(blankIdx, opts) {
    opts = opts || {};
    const blankEl = document.createElement("span");
    blankEl.className =
      "dragfill-blank" + (opts.block ? " dragfill-blank-block" : "");
    const placedOpt = s.placed[blankIdx];
    if (locked) {
      blankEl.classList.add("disabled");
      const isCorrectBlank = dragfillOrderIndependent
        ? dragfillOverallCorrect
          ? true
          : placedOpt === q.answer[blankIdx]
        : placedOpt === q.answer[blankIdx];
      blankEl.classList.add(isCorrectBlank ? "correct" : "wrong");
      const blankText =
        placedOpt !== undefined ? q.options[placedOpt] : "________";
      if (isCorrectBlank) {
        blankEl.innerHTML = `<b>${blankText}</b>`;
      } else {
        const correctText = q.options[q.answer[blankIdx]];
        blankEl.innerHTML = `<s>${blankText}</s><br><b>Đáp án đúng: ${correctText}</b>`;
      }
    } else {
      if (placedOpt !== undefined) {
        blankEl.classList.add("filled");
        blankEl.textContent = q.options[placedOpt];
      } else {
        blankEl.textContent = "________";
      }
      blankEl.onclick = () => {
        if (placedOpt !== undefined) {
          delete s.placed[blankIdx];
          renderAll();
        } else if (s.activeChip !== null) {
          s.placed[blankIdx] = s.activeChip;
          s.activeChip = null;
          renderAll();
        }
      };
      blankEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        blankEl.classList.add("dragover");
      });
      blankEl.addEventListener("dragleave", () =>
        blankEl.classList.remove("dragover"),
      );
      blankEl.addEventListener("drop", (e) => {
        e.preventDefault();
        blankEl.classList.remove("dragover");
        const optIdx = Number(e.dataTransfer.getData("text/plain"));
        if (Number.isNaN(optIdx)) return;
        s.placed[blankIdx] = optIdx;
        s.activeChip = null;
        renderAll();
      });
    }
    return blankEl;
  }
  if (q.layout === "email") {
    const emailBox = document.createElement("div");
    emailBox.className = "dragfill-email";
    const fieldsGrid = document.createElement("div");
    fieldsGrid.className = "dragfill-email-fields";
    (q.emailFields || []).forEach((f) => {
      const field = document.createElement("div");
      field.className = "dragfill-email-field";
      const label = document.createElement("label");
      label.textContent = f.label;
      field.appendChild(label);
      field.appendChild(makeBlank(f.blank));
      fieldsGrid.appendChild(field);
    });
    emailBox.appendChild(fieldsGrid);
    if (q.emailSubject) {
      const subject = document.createElement("div");
      subject.className = "dragfill-email-subject";
      subject.textContent = q.emailSubject;
      emailBox.appendChild(subject);
    }
    const bodyBox = document.createElement("div");
    bodyBox.className = "dragfill-email-body";
    if (q.emailGreeting) {
      const greet = document.createElement("div");
      greet.textContent = q.emailGreeting;
      bodyBox.appendChild(greet);
    }
    if (q.emailContentBlank != null) {
      bodyBox.appendChild(makeBlank(q.emailContentBlank, { block: true }));
    }
    if (q.emailSign) {
      const sign = document.createElement("div");
      sign.className = "dragfill-email-sign";
      sign.textContent = q.emailSign;
      bodyBox.appendChild(sign);
    }
    emailBox.appendChild(bodyBox);
    wrap.appendChild(emailBox);
  } else {
    const sentence = document.createElement("div");
    sentence.className = "dragfill-sentence";
    const parts = q.template.split(/(\{\d+\})/g);
    parts.forEach((part) => {
      const m = part.match(/^\{(\d+)\}$/);
      if (m) {
        sentence.appendChild(makeBlank(Number(m[1])));
      } else if (part) {
        sentence.appendChild(document.createTextNode(part));
      }
    });
    wrap.appendChild(sentence);
  }
  if (!locked) {
    const usedOptionIdxs = new Set(Object.values(s.placed));
    const pool = document.createElement("div");
    pool.className = "dragfill-pool";
    const remaining = s.poolOrder.filter((i) => !usedOptionIdxs.has(i));
    if (remaining.length === 0) {
      const empty = document.createElement("span");
      empty.className = "dragfill-pool-empty";
      empty.textContent =
        "Đã dùng hết các thẻ từ — bấm vào 1 ô trống để bỏ ra nếu muốn đổi lại.";
      pool.appendChild(empty);
    } else {
      remaining.forEach((i) => {
        const chip = document.createElement("div");
        chip.className = "dragfill-chip";
        if (s.activeChip === i) chip.classList.add("active");
        chip.textContent = q.options[i];
        chip.draggable = !IS_TOUCH;
        chip.onclick = () => {
          s.activeChip = s.activeChip === i ? null : i;
          renderAll();
        };
        chip.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", String(i));
        });
        pool.appendChild(chip);
      });
    }
    wrap.appendChild(pool);
  }
  body.appendChild(wrap);
}
function classifyZoneLabel(q, zoneIdx) {
  if (zoneIdx === -1) return q.noMatchLabel || "Không khớp (gây nhiễu)";
  return (q.zones[zoneIdx] && q.zones[zoneIdx].label) || "";
}
function classifyZoneDescriptors(q) {
  return q.zones.map((zone, idx) => ({
    idx: idx,
    label: zone.label,
    color: zone.color,
    isNoMatch: false,
  }));
}
function classifyItemContentHTML(item) {
  const isObj = item && typeof item === "object";
  const label = isObj ? item.label || "" : String(item);
  const imgHtml =
    isObj && item.image
      ? `<img src="${item.image}" alt="" style="display:block;max-width:100%;max-height:64px;object-fit:contain;border-radius:6px;margin:0 auto 4px;">`
      : "";
  const labelHtml = label ? `<span>${label}</span>` : "";
  return `<span style="display:flex;flex-direction:column;align-items:center;gap:2px;">${imgHtml}${labelHtml}</span>`;
}
function renderClassify(q, body, s) {
  if (!s.placed) s.placed = {};
  if (s.activeChip === undefined) s.activeChip = null;
  const locked = isLocked(q);
  const zoneDescriptors = classifyZoneDescriptors(q);
  const pool =
    q._classifyPool ||
    q.items
      .map((_, i) => ({ key: String(i), isDistractor: false, idx: i }))
      .concat(
        (q.distractors || []).map((_, i) => ({
          key: "d" + i,
          isDistractor: true,
          idx: i,
        })),
      );
  const wrap = document.createElement("div");
  wrap.className = "classify-wrap";
  const hintRow = document.createElement("div");
  hintRow.className = "match-hint-row";
  const placedCount = q.items.filter(
    (_, i) => s.placed[i] !== undefined,
  ).length;
  hintRow.innerHTML = locked
    ? `<span>✓ = xếp đúng &nbsp; ✕ = xếp sai (kèm gợi ý đáp án đúng)</span><span>Số mục đúng: ${q.items.filter((_, i) => s.placed[i] === q.answer[i]).length}/${q.items.length}</span>`
    : `<span>🖐️ Kéo-thả (hoặc bấm chọn rồi bấm vào nhóm) để phân loại</span><span>Đã phân loại: ${placedCount}/${q.items.length}</span>`;
  wrap.appendChild(hintRow);
  function makeChip(entry, placedInZone) {
    const key = entry.key;
    const content = entry.isDistractor
      ? (q.distractors || [])[entry.idx]
      : q.items[entry.idx];
    const chip = document.createElement("div");
    chip.className = "classify-chip";
    if (entry.isDistractor) chip.classList.add("distractor");
    if (placedInZone) chip.classList.add("placed");
    if (s.activeChip === key) chip.classList.add("active");
    const badgeIcon = entry.isDistractor && locked ? "🎭" : "⠿";
    if (locked && !entry.isDistractor) {
      const isCorrect = s.placed[key] === q.answer[entry.idx];
      chip.classList.add(isCorrect ? "correct" : "wrong");
      if (isCorrect) {
        chip.innerHTML = `<span class="classify-chip-badge">${badgeIcon}</span>${classifyItemContentHTML(content)}`;
      } else {
        const correctZoneLabel = classifyZoneLabel(q, q.answer[entry.idx]);
        chip.innerHTML = `<span class="classify-chip-badge">${badgeIcon}</span>${classifyItemContentHTML(content)}<small>(Đúng: ${correctZoneLabel})</small>`;
      }
    } else {
      const displayBadge = placedInZone ? "✕" : badgeIcon;
      chip.innerHTML = `<span class="classify-chip-badge">${displayBadge}</span>${classifyItemContentHTML(content)}`;
      if (entry.isDistractor && locked)
        chip.title = "Thẻ mồi nhử — không cần xếp, không tính điểm";
      else if (placedInZone) chip.title = "Bấm để bỏ chọn";
    }
    if (!locked) {
      chip.draggable = !IS_TOUCH;
      chip.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", key);
        chip.classList.add("dragging");
      });
      chip.addEventListener("dragend", () => chip.classList.remove("dragging"));
      chip.onclick = (e) => {
        e.stopPropagation();
        if (placedInZone) {
          delete s.placed[key];
          s.activeChip = null;
        } else {
          s.activeChip = s.activeChip === key ? null : key;
        }
        renderAll();
      };
    }
    return chip;
  }
  const zonesRow = document.createElement("div");
  zonesRow.className = "classify-zones";
  zoneDescriptors.forEach((zoneDesc) => {
    const zoneIdx = zoneDesc.idx;
    const zoneEl = document.createElement("div");
    zoneEl.className = "classify-zone";
    zoneEl.style.setProperty("--zone-color", zoneDesc.color);
    if (zoneDesc.isNoMatch) zoneEl.style.borderStyle = "dashed";
    const title = document.createElement("div");
    title.className = "classify-zone-title";
    title.textContent = zoneDesc.label;
    zoneEl.appendChild(title);
    const zoneBody = document.createElement("div");
    zoneBody.className = "classify-zone-body";
    pool.forEach((entry) => {
      if (s.placed[entry.key] === zoneIdx)
        zoneBody.appendChild(makeChip(entry, true));
    });
    const badge = document.createElement("div");
    badge.className = "classify-zone-badge";
    badge.textContent = zoneDesc.isNoMatch ? "∅" : zoneIdx + 1;
    zoneBody.appendChild(badge);
    if (!locked) {
      zoneBody.addEventListener("dragover", (e) => {
        e.preventDefault();
        zoneBody.classList.add("dragover");
      });
      zoneBody.addEventListener("dragleave", () =>
        zoneBody.classList.remove("dragover"),
      );
      zoneBody.addEventListener("drop", (e) => {
        e.preventDefault();
        zoneBody.classList.remove("dragover");
        const key = e.dataTransfer.getData("text/plain");
        if (!key) return;
        s.placed[key] = zoneIdx;
        s.activeChip = null;
        renderAll();
      });
      zoneBody.addEventListener("click", () => {
        if (s.activeChip !== null) {
          s.placed[s.activeChip] = zoneIdx;
          s.activeChip = null;
          renderAll();
        }
      });
    }
    zoneEl.appendChild(zoneBody);
    zonesRow.appendChild(zoneEl);
  });
  wrap.appendChild(zonesRow);
  const unplacedEntries = pool.filter(
    (entry) => s.placed[entry.key] === undefined,
  );
  const unplacedToShow = locked
    ? unplacedEntries.filter((e) => !e.isDistractor)
    : unplacedEntries;
  if (!locked || unplacedToShow.length) {
    const poolTitle = document.createElement("div");
    poolTitle.style.cssText =
      "font-size:13px;font-weight:700;color:var(--text-mute);margin-bottom:8px;";
    poolTitle.textContent = "📦 Các mục cần phân loại:";
    wrap.appendChild(poolTitle);
    const pool2 = document.createElement("div");
    pool2.className = "classify-pool";
    if (unplacedToShow.length === 0) {
      const empty = document.createElement("span");
      empty.className = "classify-pool-empty";
      empty.textContent =
        "Đã xếp hết các thẻ — bấm vào 1 thẻ trong khung để đưa nó trở lại đây nếu muốn đổi lại.";
      pool2.appendChild(empty);
    } else {
      unplacedToShow.forEach((entry) =>
        pool2.appendChild(makeChip(entry, false)),
      );
    }
    wrap.appendChild(pool2);
  }
  body.appendChild(wrap);
}
function renderClassify2(q, body, s) {
  if (!s.placed) s.placed = {};
  if (s.activeChip === undefined) s.activeChip = null;
  if (s.activeZone === undefined) s.activeZone = null;
  const locked = isLocked(q);
  const zoneDescriptors = classifyZoneDescriptors(q);
  const wrap = document.createElement("div");
  wrap.className = "classify2-wrap";
  function zoneTotal(zoneIdx) {
    return q.answer.filter((a) => a === zoneIdx).length;
  }
  function zonePlacedCount(zoneIdx) {
    return Object.values(s.placed).filter((v) => v === zoneIdx).length;
  }
  function zoneAvailable(zoneIdx) {
    return zoneTotal(zoneIdx) - zonePlacedCount(zoneIdx);
  }
  function makeChip(zoneIdx, chipKey) {
    const chip = document.createElement("div");
    chip.className = "classify2-chip";
    if (s.activeChip === chipKey) chip.classList.add("active");
    chip.textContent = classifyZoneLabel(q, zoneIdx);
    if (!locked) {
      chip.draggable = !IS_TOUCH;
      chip.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", String(zoneIdx));
        chip.classList.add("dragging");
      });
      chip.addEventListener("dragend", () => chip.classList.remove("dragging"));
      chip.onclick = (e) => {
        e.stopPropagation();
        if (s.activeChip === chipKey) {
          s.activeChip = null;
          s.activeZone = null;
        } else {
          s.activeChip = chipKey;
          s.activeZone = zoneIdx;
        }
        renderAll();
      };
    }
    return chip;
  }
  const pool = document.createElement("div");
  pool.className = "classify2-pool";
  let anyAvailable = false;
  zoneDescriptors.forEach((zoneDesc) => {
    const zoneIdx = zoneDesc.idx;
    const avail = zoneAvailable(zoneIdx);
    for (let i = 0; i < avail; i++) {
      anyAvailable = true;
      pool.appendChild(makeChip(zoneIdx, zoneIdx + ":" + i));
    }
  });
  if (!anyAvailable) {
    const empty = document.createElement("span");
    empty.className = "classify2-pool-empty";
    empty.textContent =
      "Đã dùng hết nhãn — bấm vào 1 ô đã điền để đưa nhãn trở lại đây nếu muốn đổi lại.";
    pool.appendChild(empty);
  }
  wrap.appendChild(pool);
  const rows = document.createElement("div");
  rows.className = "classify2-rows";
  q.items.forEach((item, itemIdx) => {
    const row = document.createElement("div");
    row.className = "classify2-row";
    const box = document.createElement("div");
    box.className = "classify2-box";
    const placedZone = s.placed[itemIdx];
    const isFilled = placedZone !== undefined;
    if (isFilled) {
      box.classList.add("filled");
      box.textContent = classifyZoneLabel(q, placedZone);
      if (locked) {
        const isCorrect = placedZone === q.answer[itemIdx];
        box.classList.add(isCorrect ? "correct" : "wrong");
        if (!isCorrect) {
          box.title = `Đúng: ${classifyZoneLabel(q, q.answer[itemIdx])}`;
        }
      }
    } else {
      box.textContent = "";
      if (locked) {
        box.classList.add("wrong");
        box.title = `Đúng: ${classifyZoneLabel(q, q.answer[itemIdx])}`;
      }
    }
    if (!locked) {
      box.addEventListener("dragover", (e) => {
        e.preventDefault();
        box.classList.add("dragover");
      });
      box.addEventListener("dragleave", () => box.classList.remove("dragover"));
      box.addEventListener("drop", (e) => {
        e.preventDefault();
        box.classList.remove("dragover");
        const zoneIdx = Number(e.dataTransfer.getData("text/plain"));
        if (Number.isNaN(zoneIdx)) return;
        s.placed[itemIdx] = zoneIdx;
        s.activeChip = null;
        s.activeZone = null;
        renderAll();
      });
      box.onclick = () => {
        if (isFilled) {
          delete s.placed[itemIdx];
          s.activeChip = null;
          s.activeZone = null;
          renderAll();
        } else if (s.activeZone !== null) {
          s.placed[itemIdx] = s.activeZone;
          s.activeChip = null;
          s.activeZone = null;
          renderAll();
        }
      };
    }
    const label = document.createElement("div");
    label.className = "classify2-label";
    label.innerHTML = classifyItemContentHTML(item);
    row.appendChild(box);
    row.appendChild(label);
    rows.appendChild(row);
  });
  wrap.appendChild(rows);
  body.appendChild(wrap);
}
function renderSelectFill(q, body, s) {
  if (!s.placed) s.placed = {};
  const locked = isLocked(q);
  const wrap = document.createElement("div");
  wrap.className = "selectfill-wrap";
  const sentence = document.createElement("div");
  sentence.className = "selectfill-sentence";
  const parts = q.template.split(/(\{\d+\})/g);
  parts.forEach((part) => {
    const m = part.match(/^\{(\d+)\}$/);
    if (m) {
      const blankIdx = Number(m[1]);
      const placedOpt = s.placed[blankIdx];
      if (locked) {
        const blankEl = document.createElement("span");
        blankEl.className = "selectfill-blank disabled";
        const isCorrectBlank = placedOpt === q.answer[blankIdx];
        blankEl.classList.add(isCorrectBlank ? "correct" : "wrong");
        const blankText =
          placedOpt !== undefined ? q.options[placedOpt] : "________";
        blankEl.innerHTML = isCorrectBlank ? `<b>${blankText}</b>` : blankText;
        sentence.appendChild(blankEl);
        if (!isCorrectBlank) {
          const hint = document.createElement("span");
          hint.className = "selectfill-correct-inline";
          hint.innerHTML = `✓ ${q.options[q.answer[blankIdx]]}`;
          sentence.appendChild(hint);
        }
      } else {
        const selectEl = document.createElement("select");
        selectEl.className = "selectfill-blank";
        if (placedOpt !== undefined) selectEl.classList.add("filled");
        const placeholderOpt = document.createElement("option");
        placeholderOpt.value = "";
        placeholderOpt.textContent = "________";
        selectEl.appendChild(placeholderOpt);
        const allowedIdx =
          Array.isArray(q.blankOptions) &&
          Array.isArray(q.blankOptions[blankIdx])
            ? q.blankOptions[blankIdx]
            : q.options.map((_, i) => i);
        allowedIdx.forEach((i) => {
          const optEl = document.createElement("option");
          optEl.value = String(i);
          optEl.textContent = q.options[i];
          selectEl.appendChild(optEl);
        });
        selectEl.value = placedOpt !== undefined ? String(placedOpt) : "";
        selectEl.onchange = (e) => {
          const val = e.target.value;
          if (val === "") {
            delete s.placed[blankIdx];
          } else {
            s.placed[blankIdx] = Number(val);
          }
          renderAll();
        };
        sentence.appendChild(selectEl);
      }
    } else if (part) {
      sentence.appendChild(document.createTextNode(part));
    }
  });
  wrap.appendChild(sentence);
  body.appendChild(wrap);
}
function getQuizHeaderTitle() {
  return (
    document.querySelector(".header-title")?.textContent?.trim() ||
    document.title
  );
}
function getResultQuizTitle() {
  const parts = [];
  if (typeof QUIZ_LEVEL_LABEL === "string" && QUIZ_LEVEL_LABEL.trim())
    parts.push(QUIZ_LEVEL_LABEL.trim());
  if (typeof QUIZ_TOPIC_LABEL === "string" && QUIZ_TOPIC_LABEL.trim())
    parts.push(QUIZ_TOPIC_LABEL.trim());
  if (parts.length) return parts.join(" - ");
  return getQuizHeaderTitle();
}
function formatStartTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${hh}:${mm} ${dd}/${MM}/${yy}`;
}
function sendResultToClassSheet(
  score,
  correctCount,
  passed,
  timeTakenSeconds,
  points,
) {
  if (!CLASS_SHEET_CONFIG.enabled || !CLASS_SHEET_CONFIG.webAppUrl) return;
  const payload = {
    id: studentInfo.id || "",
    submittedAt: new Date().toLocaleString("vi-VN"),
    name: studentInfo.name,
    class: studentInfo.class,
    school: studentInfo.school,
    quizTitle: getResultQuizTitle(),
    mode: QUIZ_MODE === "kiemtra" ? "Kiểm tra" : "Ôn tập",
    score:
      QUIZ_MODE === "kiemtra" && points !== undefined
        ? `${points}/1000 (${score}%)`
        : score,
    passed: passed,
    correctCount: correctCount,
    totalCount: ACTIVE_QUIZ.length,
    startTime: quizStartTime ? formatStartTime(quizStartTime) : "",
  };
  try {
    let iframe = document.getElementById("sheetSubmitFrame");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.name = "sheetSubmitFrame";
      iframe.id = "sheetSubmitFrame";
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    }
    const form = document.createElement("form");
    form.method = "POST";
    form.action = CLASS_SHEET_CONFIG.webAppUrl;
    form.target = "sheetSubmitFrame";
    form.style.display = "none";
    Object.keys(payload).forEach((key) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(payload[key]);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    form.remove();
  } catch (err) {
    console.error("Gửi kết quả vào Google Sheet của lớp thất bại:", err);
  }
}
function fireConfetti() {
  const COLORS = [
    "#e0433c",
    "#2f6fed",
    "#1f9d55",
    "#f4c542",
    "#a855f7",
    "#ec4899",
    "#14b8a6",
    "#f97316",
  ];
  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  const COUNT = 90;
  for (let i = 0; i < COUNT; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const left = Math.random() * 100;
    const duration = 2.6 + Math.random() * 0.9;
    const delay = Math.random() * 0.5;
    const drift = Math.random() * 140 - 70 + "px";
    const spin =
      (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540) + "deg";
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    piece.style.left = left + "vw";
    piece.style.background = color;
    piece.style.animationDuration = duration + "s";
    piece.style.animationDelay = delay + "s";
    piece.style.setProperty("--confetti-drift", drift);
    piece.style.setProperty("--confetti-spin", spin);
    if (Math.random() > 0.5) piece.style.borderRadius = "50%";
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => {
    layer.remove();
  }, 3600);
}
function submitQuiz(force) {
  if (!force) {
    const stillUnanswered = getUnansweredQuestionNumbers();
    if (stillUnanswered.length > 0) {
      alert(
        `Bạn cần hoàn thành tất cả các câu hỏi trước khi nộp bài.\nCòn ${stillUnanswered.length} câu chưa làm: Câu ${stillUnanswered.join(", Câu ")}`,
      );
      return;
    }
  }
  quizFinished = true;
  releaseTabLock();
  disableFullscreenLock();
  if (QUIZ_MODE === "kiemtra") stopExamTimer();
  if (current >= ACTIVE_QUIZ.length) current = ACTIVE_QUIZ.length - 1;
  const timeTakenSeconds = quizStartTime
    ? Math.round((Date.now() - quizStartTime) / 1e3)
    : 0;
  let correctCount, score, passed, points, isPerfect;
  if (QUIZ_MODE === "kiemtra") {
    const pointsPerQuestion = 1e3 / ACTIVE_QUIZ.length;
    correctCount = 0;
    let rawPoints = 0;
    ACTIVE_QUIZ.forEach((q) => {
      ensureState(q);
      const correct = computeCorrect(q);
      state[q.id].correct = correct;
      if (correct) correctCount++;
      rawPoints += computeQuestionPoints(q, pointsPerQuestion);
    });
    points = Math.round(rawPoints);
    score = Math.round((points / 1e3) * 100);
    passed = score >= 95;
    isPerfect = points >= 1e3;
    lastResult = {
      score: score,
      points: points,
      correctCount: correctCount,
      passed: passed,
      isPerfect: isPerfect,
      timeTakenSeconds: timeTakenSeconds,
    };
  } else {
    correctCount = 0;
    ACTIVE_QUIZ.forEach((q) => {
      ensureState(q);
      const correct = checkAnswerCorrect(q);
      state[q.id].correct = correct;
      state[q.id].checked = true;
      if (correct) correctCount++;
    });
    score = Math.round((correctCount / ACTIVE_QUIZ.length) * 100);
    passed = score >= 95;
    lastResult = {
      score: score,
      correctCount: correctCount,
      passed: passed,
      timeTakenSeconds: timeTakenSeconds,
    };
  }
  if (studentInfo) {
    addAttemptHistoryRecord(studentInfo, {
      score: score,
      correctCount: correctCount,
      total: ACTIVE_QUIZ.length,
      timeTakenSeconds: timeTakenSeconds,
      at: formatStartTime(Date.now()),
    });
    renderAttemptCount();
  }
  showResultScreen();
  if (QUIZ_MODE === "kiemtra") {
    showResultPopup();
    if (isPerfect) fireConfetti();
  } else {
    fireConfetti();
  }
  if (QUIZ_MODE === "kiemtra") {
    sendResultToClassSheet(
      score,
      correctCount,
      passed,
      timeTakenSeconds,
      points,
    );
  } else {
    sendResultToClassSheet(score, correctCount, passed, timeTakenSeconds);
  }
}
function showResultPopup() {
  if (QUIZ_MODE !== "kiemtra") return;
  if (!lastResult) return;
  const {
    points: points,
    score: score,
    passed: passed,
    isPerfect: isPerfect,
  } = lastResult;
  const modal = document.getElementById("resultModal");
  if (!modal) return;
  const emojiEl = document.getElementById("resultModalEmoji");
  const titleEl = document.getElementById("resultModalTitle");
  const descEl = document.getElementById("resultModalDesc");
  if (isPerfect) {
    emojiEl.textContent = "🏆";
    titleEl.textContent = "Chúc mừng!";
    descEl.innerHTML = `<b>Chúc mừng ${textToSafeHtml(studentInfo.name)} đã xuất sắc hoàn thành bài!</b><br>Đạt điểm tuyệt đối <b>1000/1000 (100%)</b>.`;
  } else {
    emojiEl.textContent = passed ? "🎉" : "📋";
    titleEl.textContent = passed ? "Hoàn thành bài!" : "Đã nộp bài";
    descEl.innerHTML = `Bạn đã hoàn thành bài làm.<br>Điểm đạt: <b>${points}/1000</b> — <b>${score}%</b>.`;
  }
  modal.style.display = "flex";
}
function showResultScreen() {
  if (!lastResult) return;
  const {
    score: score,
    correctCount: correctCount,
    passed: passed,
    timeTakenSeconds: timeTakenSeconds,
    points: points,
    isPerfect: isPerfect,
  } = lastResult;
  const scoreDisplay =
    QUIZ_MODE === "kiemtra" && points !== undefined
      ? `${points}<span class="result-score-max">/1000</span>`
      : `${score}<span class="result-score-max">%</span>`;
  const scoreSubline =
    QUIZ_MODE === "kiemtra" && points !== undefined
      ? `<p class="result-detail-line" style="margin-top:-6px;color:var(--text-mute);">Tương đương <b>${score}%</b></p>`
      : "";
  const perfectBadge =
    QUIZ_MODE === "kiemtra" && isPerfect
      ? `<p class="result-detail-line" style="color:var(--gold-text);font-weight:800;">🏆 Điểm tuyệt đối!</p>`
      : "";
  const resultTier = getScoreTier(score);
  const encouragementEmoji =
    resultTier.faceMsg.match(/^[^\s]+/)?.[0] || resultTier.emoji;
  const encouragementText = resultTier.faceMsg.replace(/^[^\s]+\s*/, "");
  const mount = DOM.mainCard;
  mount.innerHTML = `\n    <div class="result-card">\n      <div class="result-encouragement ${resultTier.faceClass}"><span class="result-encouragement-emoji">${encouragementEmoji}</span><span>${textToSafeHtml(encouragementText)}</span></div>\n      <div class="q-label" style="justify-content:center;display:block;text-align:center;">KẾT QUẢ BÀI LÀM</div>\n      <div class="result-score">${scoreDisplay}</div>\n      ${scoreSubline}\n      <div class="result-status ${resultTier.statusClass}">${resultTier.emoji} ${resultTier.statusText}</div>\n      ${perfectBadge}\n      <p class="result-detail-line">Bạn trả lời đúng <b>${correctCount}/${ACTIVE_QUIZ.length}</b> câu hỏi.</p>\n      <p class="result-time-line">⏱ Tổng thời gian làm bài: <b>${formatDuration(timeTakenSeconds)}</b></p>\n      <div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap;">\n        <button class="btn btn-primary" onclick="restartQuiz()">Làm lại</button>\n      </div>\n      <p class="result-submit-note">Bài đã được gửi</p>\n    </div>\n  `;
  renderSidebar();
}
function restartQuiz() {
  attemptClaimAndRun(function () {
    const resultModal = document.getElementById("resultModal");
    if (resultModal) resultModal.style.display = "none";
    Object.keys(state).forEach((k) => delete state[k]);
    current = 0;
    quizFinished = false;
    lastResult = null;
    ACTIVE_QUIZ = buildActiveQuiz();
    quizStartTime = Date.now();
    enableFullscreenLock();
    if (QUIZ_MODE === "kiemtra") startExamTimer();
    renderAll();
  });
}
(function () {
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    showSecurityWarning("Thao tác chuột phải đã bị chặn trong lúc làm bài.");
  });
  document.addEventListener("keydown", function (e) {
    const k = e.key;
    if (
      k === "F12" ||
      (e.ctrlKey &&
        e.shiftKey &&
        (k === "I" ||
          k === "i" ||
          k === "J" ||
          k === "j" ||
          k === "C" ||
          k === "c")) ||
      (e.ctrlKey && (k === "U" || k === "u" || k === "S" || k === "s")) ||
      (e.metaKey &&
        e.altKey &&
        (k === "I" || k === "i" || k === "J" || k === "j"))
    ) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityWarning("Phím tắt này đã bị chặn trong lúc làm bài.");
      return false;
    }
  });
  let devtoolsWarned = false;
  function checkDevtoolsOpen() {
    const threshold = 160;
    const widthGap = window.outerWidth - window.innerWidth;
    const heightGap = window.outerHeight - window.innerHeight;
    if ((widthGap > threshold || heightGap > threshold) && !devtoolsWarned) {
      devtoolsWarned = true;
      showSecurityWarning(
        "Phát hiện dấu hiệu công cụ nhà phát triển (DevTools) đang mở.",
      );
    }
    if (!(widthGap > threshold || heightGap > threshold)) {
      devtoolsWarned = false;
    }
  }
  setInterval(checkDevtoolsOpen, 1e3);
})();
(function () {
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });
  ["copy", "cut"].forEach(function (evt) {
    document.addEventListener(evt, function (e) {
      var t = e.target;
      if (t && t.closest && t.closest("input, textarea, select")) return;
      e.preventDefault();
      showSecurityWarning(
        "Sao chép / cắt nội dung không được phép trong lúc làm bài.",
      );
    });
  });
  document.addEventListener("dragstart", function (e) {
    if (e.target && e.target.tagName === "IMG") e.preventDefault();
  });
  document.addEventListener("keydown", function (e) {
    var k = e.key;
    var block =
      k === "F12" ||
      (e.ctrlKey &&
        e.shiftKey &&
        ["I", "i", "J", "j", "C", "c"].indexOf(k) !== -1) ||
      (e.ctrlKey && ["u", "U", "s", "S", "p", "P"].indexOf(k) !== -1);
    if (block) {
      e.preventDefault();
      if (e.ctrlKey && ["p", "P"].indexOf(k) !== -1) {
        showSecurityWarning("Chức năng in trang đã bị chặn trong lúc làm bài.");
      }
    }
  });
  var blurOverlay = document.createElement("div");
  blurOverlay.id = "blurOverlay";
  blurOverlay.innerHTML =
    '<div class="blur-box">🚫 Nội dung bài làm đã được ẩn vì bạn vừa rời khỏi cửa sổ này.<br>Quay lại đây để tiếp tục làm bài.</div>';
  function setBlur(active) {
    blurOverlay.style.display = active ? "flex" : "none";
  }
  window.addEventListener("blur", function () {
    setBlur(true);
    recordSecurityViolation();
  });
  window.addEventListener("focus", function () {
    setBlur(false);
  });
  document.addEventListener("visibilitychange", function () {
    setBlur(document.hidden);
  });
})();
