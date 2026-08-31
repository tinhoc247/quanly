// Thay thế cho việc gọi Netlify Deploy API (create deploy + PUT files + poll status).
// GitHub Contents API làm việc THEO TỪNG FILE (không phải snapshot toàn bộ site như
// Netlify), nên đơn giản hơn nhiều: PUT 1 file thì CHỈ file đó thay đổi, các file khác
// trong repo giữ nguyên — không cần "gộp danh sách file đang có" như bản Netlify cũ.

const GITHUB_API = "https://api.github.com";

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ic3-admin-cloud-functions",
  };
}

// Lấy sha hiện tại của 1 file trong repo (cần sha này để UPDATE file đã tồn tại —
// GitHub Contents API bắt buộc phải kèm sha cũ, nếu không sẽ báo lỗi "file exists").
// Trả về null nếu file chưa tồn tại (tạo mới).
async function getFileSha(owner, repo, branch, path, token) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: authHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Không đọc được thông tin file "${path}" trên GitHub (HTTP ${res.status}).`);
  const data = await res.json();
  return data && data.sha ? data.sha : null;
}

// Tạo mới hoặc cập nhật 1 file trong repo (nội dung base64).
async function putFile(owner, repo, branch, path, base64Content, token, message) {
  const existingSha = await getFileSha(owner, repo, branch, path, token);
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
  const body = {
    message: message || `Cập nhật ${path}`,
    content: base64Content,
    branch,
  };
  if (existingSha) body.sha = existingSha;
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Không đẩy được file "${path}" lên GitHub (HTTP ${res.status}). ${errBody.slice(0, 300)}`);
  }
  return res.json();
}

// Xoá 1 file khỏi repo (cần sha hiện tại). Nếu file không tồn tại, coi như đã xoá xong
// (không báo lỗi) để tránh chặn luồng chính.
async function deleteFile(owner, repo, branch, path, token, message) {
  const sha = await getFileSha(owner, repo, branch, path, token);
  if (!sha) return { deleted: false, reason: "not_found" };
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ message: message || `Xoá ${path}`, sha, branch }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Không xoá được file "${path}" trên GitHub (HTTP ${res.status}). ${errBody.slice(0, 300)}`);
  }
  return { deleted: true };
}

// URL công khai (GitHub Pages) cho 1 file trong repo.
// - Nếu repo tên đúng dạng "{owner}.github.io" (user/org site) -> không có phần /repo/.
// - Nếu host doc có field "pagesUrl" tuỳ chỉnh (vd domain riêng) -> ưu tiên dùng field đó.
function buildPagesUrl({ owner, repo, pagesUrl }, path) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  if (pagesUrl) {
    return pagesUrl.replace(/\/+$/, "") + "/" + cleanPath;
  }
  const isUserSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  const base = isUserSite ? `https://${owner}.github.io` : `https://${owner}.github.io/${repo}`;
  return base + "/" + cleanPath;
}

// URL CDN (jsDelivr) cho 1 file trong repo — dùng cho "kho ảnh dùng chung": ảnh chỉ
// đẩy lên GitHub 1 LẦN (vào đúng repo ảnh dùng chung), rồi phục vụ qua jsDelivr thay
// vì GitHub Pages — jsDelivr miễn phí, không giới hạn băng thông, có CDN toàn cầu, và
// không phụ thuộc/tốn quota Pages của bất kỳ host thi nào.
function buildJsdelivrUrl({ owner, repo, branch }, path) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch || "main"}/${cleanPath}`;
}

// Xoá cache jsDelivr cho 1 file (gọi sau khi xoá file đó khỏi GitHub, vì jsDelivr cache
// vĩnh viễn — không tự nhận biết file gốc đã bị xoá/đổi nếu không purge thủ công).
// Best-effort: lỗi purge không nên chặn luồng xoá chính (file đã xoá khỏi GitHub rồi).
async function purgeJsdelivr({ owner, repo, branch }, path) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  const url = `https://purge.jsdelivr.net/gh/${owner}/${repo}@${branch || "main"}/${cleanPath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Purge jsDelivr thất bại cho "${path}" (HTTP ${res.status}).`);
  return res.json().catch(() => ({}));
}

// Thông tin repo (dùng cho host-usage.js): size (KB, ước lượng dung lượng repo) +
// rate limit còn lại của token — GitHub KHÔNG có API "bandwidth đã dùng" như Netlify,
// nên đây là số liệu GẦN ĐÚNG NHẤT có thể lấy được, không phải bandwidth thật.
async function getRepoInfo(owner, repo, token) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`Không đọc được thông tin repo "${owner}/${repo}" (HTTP ${res.status}).`);
  return res.json();
}

async function getRateLimit(token) {
  const res = await fetch(`${GITHUB_API}/rate_limit`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`Không đọc được rate limit GitHub (HTTP ${res.status}).`);
  return res.json();
}

module.exports = { getFileSha, putFile, deleteFile, buildPagesUrl, buildJsdelivrUrl, purgeJsdelivr, getRepoInfo, getRateLimit };
