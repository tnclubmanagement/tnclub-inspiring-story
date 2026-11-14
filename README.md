# Những Câu Chuyện Truyền Cảm Hứng

Trang blog tĩnh dùng theme **[Beautiful Jekyll](https://beautifuljekyll.com)**
(Jekyll), build và host hoàn toàn miễn phí bằng **GitHub Pages**. Không cần
chạy server/backend. Mỗi bài viết là một file Markdown, có thể kèm ảnh lớn
kiểu tạp chí.

## 1. Đưa lên GitHub lần đầu

```bash
cd /Users/Tri.Ngo/training/inspiring-stories
git add .
git commit -m "Đổi sang theme Beautiful Jekyll"
```

Tạo repo mới trên GitHub (ví dụ tên `inspiring-stories`), rồi:

```bash
git branch -M main
git remote add origin https://github.com/<ten-github-cua-ban>/inspiring-stories.git
git push -u origin main
```

## 2. Bật GitHub Pages (build bằng GitHub Actions)

File build đã có sẵn ở `.github/workflows/pages-deploy.yml`, không cần sửa gì.

Vào repo trên GitHub → **Settings** → **Pages** → ở "Build and deployment",
chọn **Source: GitHub Actions** (không chọn "Deploy from a branch").

Sau khi push code, vào tab **Actions** của repo để xem quá trình build
(~1-2 phút). Xong, trang sẽ có ở:
`https://<ten-github-cua-ban>.github.io/inspiring-stories/`

## 3. Đăng bài mới — cách dễ nhất, không cần máy tính

Mỗi bài nằm trong một thư mục riêng theo dạng:
`posts/YYYY/MM/DD/ten-bai-viet/`. Cách này giúp ảnh và nội dung của một bài
luôn nằm cùng chỗ, dễ quản lý trên GitHub điện thoại.

Trên GitHub, chọn **Add file → Create new file** và nhập đường dẫn đầy đủ,
ví dụ: `posts/2026/10/20/cau-chuyen-ve-su-kien/index.md`.

Nội dung file:

```markdown
---
layout: post
date: "2026-10-20 00:00:00 +0700"
title: "Tên bài viết của bạn"
subtitle: "Một câu mô tả ngắn, tuỳ chọn"
cover-img: /posts/2026/10/20/cau-chuyen-ve-su-kien/cover.jpg
thumbnail-img: /posts/2026/10/20/cau-chuyen-ve-su-kien/cover.jpg
tags: [tag1, tag2]
---

Nội dung bài viết viết bằng Markdown bình thường ở đây.

Có thể chèn **chữ đậm**, *chữ nghiêng*, ảnh, link, v.v.
```

- Bấm **Commit changes** → xong! Sau ~1-2 phút (Actions build) bài sẽ tự
  xuất hiện trên trang.

### Thêm ảnh cho bài viết

Sau khi tạo thư mục bài viết, upload ảnh vào chính thư mục đó (chọn **Add file
→ Upload files**). Đặt ảnh bìa là `cover.jpg`, rồi dùng đường dẫn
`/posts/2026/10/20/cau-chuyen-ve-su-kien/cover.jpg` trong front matter. Các ảnh
khác của bài cũng đặt cùng thư mục và chèn bằng Markdown: `![mô tả](anh-khac.jpg)`.

### Thêm sự kiện vào lịch sử

Các mốc trong phần **Lịch sử Việt Nam** được lưu tại `_data/history-events.yml`.
Mỗi sự kiện dùng ngày và tháng theo dạng `MM-DD`, nên lịch có thể hiện sự
kiện đó lặp lại vào đúng ngày hằng năm:

```yaml
- date: "09-02"
  title: "Tên sự kiện"
  year: 1945
  description: "Mô tả ngắn về sự kiện."
  source: "Tên nguồn tham khảo"
```

Nên kiểm tra kỹ ngày tháng và ghi nguồn trước khi thêm sự kiện. Với ngày âm
lịch hoặc mốc thời gian chưa xác định chính xác, hãy ghi chú rõ trong
`description` thay vì tự quy đổi sang một ngày dương lịch cố định.

## 4. Đăng bài từ máy (nếu muốn viết bằng app soạn thảo quen thuộc)

```bash
git add posts/2026/10/20/cau-chuyen-ve-su-kien/
git commit -m "Thêm bài: Câu chuyện về sự kiên trì"
git push
```

## 5. Chạy thử trên máy trước khi đăng (tuỳ chọn)

```bash
./serve.sh
```

Mở `http://localhost:4000` để xem trước. Nhấn `Ctrl+C` trong terminal để tắt
server. Script này tự trỏ đúng phiên bản Ruby và cài gem nếu thiếu, bạn không
cần tự chạy `bundle install`/`bundle exec jekyll serve` thủ công.

Lưu ý: nếu bạn sửa `_config.yml`, phải tắt (`Ctrl+C`) và chạy lại `./serve.sh`
thì thay đổi mới áp dụng (Jekyll chỉ đọc file này lúc khởi động).

## 6. Bật bình luận bằng Facebook

Theme đã tích hợp sẵn Facebook Comments, chỉ cần lấy 1 **Facebook App ID**
miễn phí (vài bước bấm chuột, không cần viết code):

1. Vào https://developers.facebook.com/apps → **Create App** → chọn loại
   "Other" / "Consumer" (không cần use-case cụ thể) → đặt tên app bất kỳ
   (ví dụ "Inspiring Stories Comments").
2. Sau khi tạo xong, vào **App Settings → Basic**, copy **App ID**.
3. Dán App ID vào `_config.yml`, dòng `fb_comment_id: ""` → `fb_comment_id: "123456789..."`.
4. Commit, push — bình luận sẽ xuất hiện ở cuối mỗi bài khi trang đã deploy
   (không hoạt động đầy đủ trên `localhost`, chỉ hoạt động trên domain thật).

Muốn tắt comment ở một bài cụ thể: thêm `comments: false` vào phần front
matter (đầu file) của bài đó.

## 7. Tuỳ biến thêm

- `_config.yml`: đổi tên trang, tác giả, màu sắc (`page-col`, `link-col`,
  v.v.), link Facebook ở footer (`social-network-links.facebook`), avatar
  (`avatar: "/assets/img/..."`).
- `aboutme.md`: nội dung trang "Giới thiệu".
- Theme Beautiful Jekyll có sẵn: tìm kiếm, tag, chia sẻ lên mạng xã hội,
  ảnh cover lớn cho từng bài — không cần cấu hình thêm.

## Cấu trúc project

```
_config.yml       Cấu hình chung của site (tên, màu sắc, comment, v.v.)
posts/YYYY/MM/DD/ Mỗi bài gồm `index.md`, `cover.jpg` và các ảnh liên quan
aboutme.md        Trang giới thiệu
assets/img/       Ảnh dùng chung cho toàn site
.github/workflows/  Workflow build & deploy tự động lên GitHub Pages
```
