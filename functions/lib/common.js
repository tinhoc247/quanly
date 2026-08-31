// Dùng chung cho mọi Cloud Function: khởi tạo Firebase Admin SDK 1 lần duy nhất,
// kiểm tra ADMIN_KEY, và set CORS + trả JSON.
//
// KHÁC VỚI BẢN NETLIFY CŨ:
//  - Không cần biến môi trường FIREBASE_SERVICE_ACCOUNT nữa: Cloud Function chạy
//    NGAY TRONG project Firebase nên admin.initializeApp() không cần tham số gì
//    (dùng credential mặc định của project).
//  - ADMIN_KEY giờ khai báo qua Firebase Secret (xem index.js: defineSecret("ADMIN_KEY")),
//    set bằng lệnh: firebase functions:secrets:set ADMIN_KEY
//  - Các function nhận (req, res) kiểu Express (Firebase Functions v2 onRequest),
//    KHÔNG PHẢI (event) kiểu Netlify/Lambda nữa.

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

function getDb() {
  return admin.firestore();
}

function checkAdminKey(providedKey, expectedKey) {
  if (!expectedKey) {
    throw new Error("Thiếu ADMIN_KEY (Firebase Secret) trên Cloud Functions.");
  }
  return typeof providedKey === "string" && providedKey === expectedKey;
}

// CORS mở rộng: cho phép gọi từ GitHub Pages (hoặc file:// khi test cục bộ).
// admin-save/admin-load/deploy-site vẫn được bảo vệ bởi ADMIN_KEY nên mở CORS
// rộng ở đây không phải lỗ hổng ghi dữ liệu.
function applyCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

// Xử lý preflight OPTIONS + parse JSON body chung cho mọi handler. Trả về `null`
// nếu request đã được xử lý xong ở đây (OPTIONS, hoặc method sai) — handler gọi
// nó nên `return` ngay khi nhận được null.
function handlePreflightAndMethod(req, res, allowedMethod = "POST") {
  applyCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return null;
  }
  if (req.method !== allowedMethod) {
    res.status(405).json({ status: "error", message: `Chỉ hỗ trợ phương thức ${allowedMethod}.` });
    return null;
  }
  // Firebase Functions (Express) đã tự parse JSON body vào req.body khi
  // Content-Type: application/json — không cần JSON.parse thủ công như Netlify nữa.
  return req.body && typeof req.body === "object" ? req.body : {};
}

function jsonResponse(res, statusCode, bodyObj) {
  res.status(statusCode).json(bodyObj);
}

module.exports = { getDb, checkAdminKey, applyCors, handlePreflightAndMethod, jsonResponse };
