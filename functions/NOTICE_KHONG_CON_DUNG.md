# Thư mục này KHÔNG còn được dùng

`functions/index.js` (Cloud Functions) yêu cầu gói Firebase **Blaze** để deploy — kể cả khi
không phát sinh chi phí thực tế. Vì bạn chọn ưu tiên gói **Spark (free)**, backend đã được
viết lại bằng **Google Apps Script Web App** tại `../apps-script/Code.gs`, làm y hệt việc mà
5 Cloud Function ở đây từng làm (đọc/ghi Firestore, đẩy file lên GitHub) nhưng không cần Blaze.

Xem hướng dẫn cài đặt ngay trong phần comment ở đầu file `../apps-script/Code.gs`.

Thư mục `functions/` được giữ lại chỉ để tham khảo logic gốc — không cần deploy, không cần
`npm install`, không cần `firebase deploy --only functions` nữa.
