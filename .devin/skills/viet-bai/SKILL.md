---
name: viet-bai
description: Hướng dẫn viết bài mới cho trang Inspiring Stories (Jekyll + Beautiful Jekyll). Dùng khi được yêu cầu viết/soạn/đăng bài viết mới, thêm bài vào series, hoặc rà soát bài cho đủ thành phần chuẩn (front matter, hình, video, nguồn).
---

# Viết bài cho Inspiring Stories

Mỗi bài viết là một thư mục `index.md` + ảnh riêng trong `posts/YYYY/MM/<slug>/`
(hoặc `posts/YYYY/MM/DD-<slug>/` — làm theo pattern ngày đang dùng gần nhất).
Nội dung viết bằng tiếng Việt, giọng kể chân thành, bình tĩnh, không sến,
không phóng đại — đọc lại các bài gần nhất để bắt giọng.

Có template mẫu đầy đủ ở `post-template.md` ngay cạnh file này — copy rồi sửa.

## 1. Front matter bắt buộc

```yaml
---
layout: post
date: "YYYY-MM-DD 00:00:00 +0700"
title: "[NN · Tên series] : Tiêu đề bài"   # nếu thuộc series; bài lẻ thì tiêu đề thường
subtitle: "Một câu mô tả ngắn, gợi cảm xúc"
cover-img: "/posts/YYYY/MM/<slug>/cover.jpg"
thumbnail-img: "/posts/YYYY/MM/<slug>/cover.jpg"
tags: [tag1, tag2, tag3]
series: "Tên series"          # CHỈ khi bài thuộc series
series_order: N               # số thứ tự trong series — phải duy nhất
series_url: "/series/<slug>/" # BẮT BUỘC khi có series — nếu thiếu, nút
                              # "Mở series" trên trang /posts/ sẽ không hiện
---
```

- `cover-img` / `thumbnail-img`: đường dẫn từ root, trỏ tới ảnh đặt TRONG
  thư mục của bài (ưu tiên ảnh local để khỏi bị chặn hotlink).
- Bài lịch sử gắn với ngày cụ thể: thêm `history-date: "DD-MM"` để lên
  lịch "Ngày này trong lịch sử".
- Có thể đặt `permalink:` riêng nếu muốn URL đẹp (mặc định
  `/post/:year-:month-:day-:title/`).

## 2. Nội dung — cấu trúc chuẩn

1. **Mở bài**: 2–4 đoạn prose (không heading) vào thẳng hoàn cảnh/nhân vật.
2. **Gallery ảnh** (nếu có 2+ ảnh): dùng block `story-gallery` (xem template).
   - Ảnh đầu tiên: `class="story-slide is-active"`, các ảnh sau chỉ `story-slide`.
   - Mọi ảnh PHẢI có `alt` mô tả và `<figcaption>` ghi nguồn kèm link
     (`rel="noopener"`, `target="_blank"` cho link ngoài).
   - `loading="lazy"` cho mọi ảnh.
3. **Các phần thân**: chia bằng `##`, mỗi phần 2–4 đoạn. Đan xen sự kiện và
   chi tiết con người; ưu tiên chi tiết CỤ THỂ (con số, câu nói, hành động)
   hơn nhận xét chung chung.
4. **Video** (nếu có): dùng block `gallery-video`, embed
   `youtube-nocookie.com`, có `<figcaption>` + link xem gốc.
5. **Kết bài**: 1–2 đoạn rút ra bài học — bình tĩnh, không lên gân.
6. **### Nguồn tham khảo**: bullet list link báo/nguồn gốc đã dùng. Mỗi
   nguồn một dòng, tên báo + tiêu đề.

## 3. Quy tắc nguồn — quan trọng nhất

- Mọi số liệu, câu trích, sự kiện phải có nguồn đáng tin (báo lớn, phỏng
  vấn gốc, kênh chính thức). KHÔNG bịa chi tiết để làm bài cảm động hơn.
- Chi tiết chỉ có trên báo mạng thứ cấp/lan truyền: viết dạng
  "theo lời kể lại trên các báo...", "được truyền thông kể lại là..."
- Khi nghi ngờ độ tin cậy, chọn cách viết an toàn hoặc nói rõ với người dùng.

## 4. Ảnh — quy tắc

- Lưu ảnh trong thư mục bài (`cover.jpg`, `<ten>-2.jpg`...), đặt tên có nghĩa.
- Kích thước hợp lý: cover ~1200px, ảnh trong bài ~800–1200px; không nhúng
  ảnh gốc nhiều MB. Có thể resize bằng `sips -Z 1200 file.jpg` trên macOS.
- Nguồn ảnh hợp pháp: ảnh báo đã đăng (ghi credit), Wikimedia Commons,
  Unsplash (`?w=1200&q=70`).
- TUYỆT ĐỐI không để đường dẫn ảnh bắt đầu bằng `/` mà thiếu `relative_url`
  — trên GitHub Pages site nằm dưới `/tnclub-inspiring-story/`.
  Trong markdown dùng `{{ '/path' | relative_url }}`; trong front matter
  `cover-img` thì theme tự xử lý, giữ nguyên dạng `/posts/...`.

## 5. Bài trong series — checklist riêng

- `series`, `series_order`, `series_url` đủ 3 trường, `series_order` không
  trùng bài khác (kiểm tra: `grep -rh "^series_order" posts | sort -n`).
- `title` theo format `[NN · Tên series] : ...`, NN khớp `series_order`
  (2 chữ số).
- Nếu số bài series thay đổi, cập nhật câu đếm cứng trong trang
  `series/<slug>/index.md` (vd "Bảy câu chuyện", "Sáu dấu mốc").

## 6. Trước khi coi là xong — checklist

- [ ] Build sạch: `bundle exec jekyll build` (qua môi trường trong
      `serve.sh`) — không lỗi Liquid.
- [ ] Mọi link nội bộ/ảnh qua `relative_url` hoặc là URL ngoài đầy đủ.
- [ ] Ảnh có `alt`, có credit nguồn; video có link xem gốc.
- [ ] Mục "Nguồn tham khảo" đủ các nguồn đã đọc để viết bài.
- [ ] Mở thử `http://localhost:4000/posts/` kiểm tra bài xuất hiện,
      nút "Mở series" hiện đúng nếu có series.
- [ ] Kiểm tra mobile width cho gallery/video.
