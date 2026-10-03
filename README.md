# Những Câu Chuyện Truyền Cảm Hứng

Trang blog tĩnh dùng theme **[Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy)**
(Jekyll), build và host hoàn toàn miễn phí bằng **GitHub Pages**. Không cần
chạy server/backend. Mỗi bài viết là một file Markdown.

## 1. Đưa lên GitHub lần đầu

```bash
cd /Users/Tri.Ngo/training/inspiring-stories
git init
git add .
git commit -m "Khởi tạo blog"
```

Tạo repo mới trên GitHub (ví dụ tên `inspiring-stories`), rồi:

```bash
git branch -M main
git remote add origin https://github.com/<ten-github-cua-ban>/inspiring-stories.git
git push -u origin main
```

## 2. Bật GitHub Pages (build bằng GitHub Actions)

Theme Chirpy cần build qua GitHub Actions (file đã có sẵn ở
`.github/workflows/pages-deploy.yml`, không cần sửa gì).

Vào repo trên GitHub → **Settings** → **Pages** → ở "Build and deployment",
chọn **Source: GitHub Actions** (không chọn "Deploy from a branch").

Sau khi push code, vào tab **Actions** của repo để xem quá trình build
(~1-2 phút). Xong, trang sẽ có ở:
`https://<ten-github-cua-ban>.github.io/inspiring-stories/`

### Cập nhật `_config.yml` cho đúng URL

Mở `_config.yml`, sửa:
```yaml
url: "https://<ten-github-cua-ban>.github.io"
baseurl: "/inspiring-stories"
```
(Nếu repo của bạn tên đúng dạng `<ten-github-cua-ban>.github.io` thì để `baseurl: ""`)

Commit và push lại sau khi sửa — Actions sẽ tự build lại.

## 3. Đăng bài mới — cách dễ nhất, không cần máy tính

Vào GitHub (web hoặc app điện thoại) → mở repo → vào thư mục `_posts/` →
**Add file → Create new file**.

- Tên file **phải** theo định dạng: `YYYY-MM-DD-ten-bai-viet.md`
  (ví dụ: `2026-10-05-cau-chuyen-ve-su-kien-tri.md`)
- Nội dung file:

```markdown
---
title: "Tên bài viết của bạn"
date: 2026-10-05 08:00:00 +0700
categories: [Chủ đề]
tags: [tag1, tag2]
---

Nội dung bài viết viết bằng Markdown bình thường ở đây.

Có thể chèn **chữ đậm**, *chữ nghiêng*, ảnh, link, v.v.
```

- Bấm **Commit changes** → xong! Sau ~1-2 phút (Actions build) bài sẽ tự
  xuất hiện trên trang.

## 4. Đăng bài từ máy (nếu muốn viết bằng app soạn thảo quen thuộc)

Tạo file `.md` mới trong `_posts/` theo đúng format trên, rồi:

```bash
git add _posts/2026-10-05-cau-chuyen-ve-su-kien-tri.md
git commit -m "Thêm bài: Câu chuyện về sự kiên trì"
git push
```

## 5. Chạy thử trên máy trước khi đăng (tuỳ chọn)

Cần Ruby + Bundler. Lần đầu:

```bash
bundle install
bundle exec jekyll serve
```

Mở `http://localhost:4000` để xem trước. Phần bình luận Facebook sẽ không
hiển thị đầy đủ khi chạy ở `localhost` (Facebook yêu cầu domain public thật),
nhưng sẽ hoạt động bình thường khi đã deploy lên GitHub Pages.

## 6. Bình luận bằng Facebook

Phần bình luận dùng **Facebook Comments Plugin** (`_includes/comments/facebook.html`)
— không cần tạo Facebook App, không cần backend. Mỗi bài viết sẽ có khung
bình luận riêng dựa theo URL của bài viết.

Muốn tắt comment ở một bài cụ thể: thêm `comments: false` vào phần front
matter (đầu file) của bài đó.

## 7. Tuỳ biến thêm

- `_config.yml`: đổi tên trang, mô tả, avatar, link Facebook/GitHub ở sidebar.
- `_tabs/about.md`: nội dung trang "Giới thiệu".
- Theme Chirpy có sẵn: tìm kiếm, dark/light mode, danh mục (categories), tag,
  TOC cho từng bài — không cần cấu hình thêm.

## Cấu trúc project

```
_config.yml              Cấu hình chung của site
_posts/                  Nơi chứa bài viết (mỗi file .md = 1 bài)
_tabs/                   Các trang tĩnh (About, Archives, Categories, Tags)
_includes/comments/facebook.html  Khung bình luận Facebook
_data/                   Dữ liệu dùng chung cho theme (contact, share links)
.github/workflows/       Workflow build & deploy tự động lên GitHub Pages
```
