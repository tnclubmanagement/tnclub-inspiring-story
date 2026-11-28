# Inspiring Stories — Ghi chú cho Agent

Trang blog tĩnh (Jekyll + theme Beautiful Jekyll), host trên GitHub Pages,
build qua GitHub Actions. Xem `README.md` để biết cách chạy/đăng bài.

## Tiêu chuẩn tối thiểu khi làm 1 website

Mỗi khi được yêu cầu tạo hoặc hoàn thiện một website, LUÔN đảm bảo có đủ các
mục dưới đây trước khi coi là "xong" (trừ khi người dùng nói rõ bỏ qua):

- [ ] **Favicon** — icon hiển thị trên tab trình duyệt (ít nhất 16x16, 32x32,
      và `apple-touch-icon` 180x180 cho iOS). Không để favicon mặc định/trống.
- [ ] **Logo/thương hiệu** — tên site + icon/logo nhất quán ở navbar.
- [ ] **Slogan/tagline** — câu mô tả ngắn thể hiện tinh thần trang (ở hero
      và/hoặc footer).
- [ ] **Nav về trang chủ** — luôn có cách quay về `/` rõ ràng (logo bấm vào
      được, và/hoặc icon/link "Trang chủ").
- [ ] **Responsive** — kiểm tra thực tế ở mobile width (không chỉ desktop),
      đặc biệt là menu mobile (hamburger) mở ra không bị vỡ layout/padding.
- [ ] **Meta cơ bản cho SEO/chia sẻ** — `<title>`, meta description, Open
      Graph (og:title/description/image) — theme Beautiful Jekyll đã tự làm
      phần này dựa trên `title`/`subtitle`/`cover-img` của từng trang.
- [ ] **Ảnh có kích thước hợp lý** — không nhúng ảnh gốc quá nặng; ưu tiên
      ảnh đã resize (vd `?w=1600` khi lấy từ Unsplash) để tải nhanh.
- [ ] **Trạng thái rỗng/demo hợp lý** — nếu site chưa có nội dung thật, luôn
      có ít nhất 1-2 bài demo + ảnh demo để người dùng thấy ngay hình dung
      thực tế, không để trống trơn.
- [ ] **Giải thích rõ cách thêm nội dung mới** — ghi trong README cách đăng
      bài mới (và các thao tác lặp lại khác) theo cách đơn giản nhất với
      trình độ kỹ thuật của người dùng.

## Quy ước riêng của project này

- Ruby: dùng Ruby 3.3 riêng qua `GEM_HOME=~/.gem-beautiful-jekyll`, KHÔNG
  dùng Ruby hệ thống (quá cũ) hay Ruby 4.0 của Homebrew (một số gem Jekyll
  cũ chưa tương thích). Chạy `./serve.sh` để tự xử lý việc này.
- Sửa `_config.yml` xong phải tắt (`Ctrl+C`) và chạy lại server — Jekyll chỉ
  đọc file này lúc khởi động, không tự reload.
- Bài mới: `newest.html` và khối `#home-latest` trên trang chủ dùng chung
  `_includes/latest-stories.html`, lấy tối đa 8 bài theo `date` giảm dần,
  không gom theo series. Bài mới chỉ cần front matter `layout: post` và
  `date` đúng là tự xuất hiện; bài có `draft: true` không được liệt kê.
- Không gán class `.featured-stories` cho khối Bài mới: JS dùng class đó
  để tìm riêng khối bộ lọc bài tiêu biểu; khối Bài mới dùng `.latest-stories`.
- CSS tuỳ biến: `assets/css/custom-styles.css` (giao diện "Liquid Glass" —
  kính trong suốt, highlight bóng, khối màu nền mờ phía sau để kính khúc xạ).
- JS tuỳ biến: `assets/js/custom-animations.js` (hero ảnh ngẫu nhiên + Ken
  Burns 1 lần, fade-in khi cuộn, khối màu nền "settle" khi tải trang — tất cả
  animation đều chạy 1 lần, không loop).
- Theme Beautiful Jekyll dùng 2 class ảnh: `.post-image-normal` (ảnh lớn đầu
  bài) và `.post-image-small` (ảnh nhỏ 100x100 theme tự hiện khi màn hình
  <500px) — ta đã ẩn `.post-image-small` và ép `.post-image-normal` luôn hiện
  để tránh vỡ layout mobile.
- Khi override file của theme (vd `_includes/nav.html`), copy nguyên bản gốc
  trong gem rồi chỉnh, không viết lại từ đầu — tránh mất tính năng có sẵn.
- Đa ngôn ngữ (i18n): dùng gem `jekyll-polyglot` (vi mặc định, en ở `/en/`),
  cùng quy ước với project `tnclub-yedas`. Trang/bài KHÔNG khai báo `lang:` =
  bản tiếng Việt, được Polyglot nhân bản sang `/en/` (fallback — bài viết
  kèm banner "chưa có bản dịch" từ `_includes/untranslated-note.html`,
  phát hiện qua `page.rendered_lang != site.active_lang`). Muốn dịch: tạo
  file cùng đường dẫn với front matter `lang: en`. Link về bản VI trong
  `_includes/lang-switcher.html` dùng `absolute_url` + `hreflang="vi"`
  đặt TRƯỚC `href` (lookbehind regex của plugin). Chuỗi UI chung ở
  `_data/strings.yml` (nav tra theo nhãn tiếng Việt gốc trong
  `navbar-links`); trong template gán
  `{% assign s = site.data.strings[site.active_lang] | default: site.data.strings.vi %}`
  rồi dùng `{{ s.ui.<key> }}`. `exclude_from_localization` chỉ loại
  `assets` + `404.html`; ảnh trong `posts/` PHẢI nhân bản vì bài dùng
  đường dẫn tương đối. `<html lang>` ở `_layouts/base.html` theo
  `site.active_lang`.
- Search: `_plugins/search_index.rb` tạo `/search-index.json` và
  `/en/search-index.json` mỗi ngôn ngữ một lần mỗi build; cache metadata ở
  `.jekyll-cache/inspiring-search/<lang>.json`.
  `_includes/search.html` giữ ID của theme; `assets/js/search.js` chỉ tải
  index khi mở tìm kiếm, tìm tiêu đề/tags có hỗ trợ tiếng Việt không dấu.
  Không nhúng lại vòng lặp `site.html_pages` vào include search. Thêm plugin
  mới cần restart server local. Test qua môi trường Ruby trong `serve.sh`:
  `bundle exec ruby scripts/search_index_test.rb` và
  `node --test scripts/search_test.js`. CI lưu cache search giữa các build.
- Bản đồ (trang `/map/`, port từ `tnclub-yedas`): `_includes/site-map.html`
  + `assets/{js,css}/{site-map,map-weather,map-pins}.*` + plugin
  `_plugins/map_pins_index.rb` xuất `/map-pins.bin` (XOR+base64, key
  `inspiring-map-pins-v1` phải khớp giữa plugin và `map-pins.js`).
  Pin lấy từ front matter `geo: [lat, lng]` của bài `layout: post`.
  Đã BỎ hẳn filter Thể thao/Ẩm thực (athlete/food là đặc thù của yedas)
  — filter bar chỉ còn: ô tìm kiếm, dropdown "Du lịch" (quốc gia/châu
  lục) và dropdown "Chuyên đề" lọc theo `series` của bài. Chuỗi UI trong
  `_data/strings.yml` mục `map`; localStorage keys đổi thành
  `inspiring-map-*`/`inspiring-geo-cc`. CSS phụ thuộc `.home-tab`/
  `.tag-section-title` và biến `--bg-light/--surface/--hairline/--z-map-*`
  nằm trong `site-map.css` + `custom-styles.css` `:root`. Không port
  `travel-spinner` (đặc thù của yedas).
- Auto-play chuyên đề (nút ▶ trên bản đồ, chỉ hiện khi đang lọc một
  series): tour bay qua từng pin theo mốc thời gian tăng dần, mở quick
  view và đọc thuyết minh bằng Web Speech API (TTS vi/en, có nút
  pause/mute/stop, thanh caption `.map-tour-bar`). Tour mở đầu bằng lời
  giới thiệu chuyên đề (`tour_intro`), mỗi điểm đọc mốc thời gian trước
  nội dung. Lời đọc lấy từ front matter `tour_note` (văn riêng, ưu tiên
  viết để nghe); không có thì ghép title + subtitle. Bài có `tour_audio`
  (đường dẫn mp3) thì phát bản ghi âm thật thay giọng TTS — dùng cho mốc
  có tư liệu âm thanh (vd Tuyên ngôn Độc lập); file lỗi/mute rơi về
  TTS/`tour_note` như cũ. Trong `tour_note`, danh nhân lịch sử/quân sự
  kèm kính ngữ đúng thời điểm sự kiện (vd "đồng chí Võ Nguyên Giáp" cho
  1944 — chưa phong Đại tướng). Mốc đọc: `tour_marker`
  (chuỗi tuỳ chọn cho bài không có 1 năm) → "Ngày D tháng M năm YYYY"
  (`event_year` + `history-date`) → "Năm YYYY"; nếu `tour_note` đã tự mở
  bằng đúng năm thì không đọc lặp mốc. Với bài câu chuyện nhân vật,
  `event_year`/`tour_marker` dùng **năm câu chuyện được chia sẻ rộ rãi**
  (vd "Câu chuyện được chia sẻ rộ rãi năm 2022"), không phải năm sự kiện.
  Năm sự kiện: `event_year` ghi đè,
  không có thì đoán từ title/permalink (`eventYearOf` trong map-pins.js,
  đã loại đoạn /YYYY/MM/DD/ của URL đăng bài); bài thiếu năm xếp sau theo
  `series_order`. Logic tour nằm trong `site-map.js` (khối
  "Auto-play chuyên đề"), chuỗi UI ở `strings.yml` mục `map` (khóa
  `play_tour`…`tour_date`, `tour_intro`).
- Front matter bài viết được chuẩn hóa bởi `_tests/post.schema.json`
  (port từ `tnclub-yedas`, bỏ rule tag miền vì site này không có bài ẩm
  thực) — kiểm tra bằng `bundle exec ruby _tests/post_frontmatter_test.rb`
  với môi trường Ruby trong `serve.sh`. Bài có `geo` BẮT BUỘC `place_name`
  + `place_country`; `history-date` dạng MM-DD cho series Lịch sử.
