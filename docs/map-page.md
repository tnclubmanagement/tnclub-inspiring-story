# Trang Bản đồ (/map/) — Hướng dẫn

Bản đồ Leaflet ghim các bài viết theo địa danh. Dưới đây là kiến trúc,
quy ước dữ liệu và checklist khi chỉnh sửa.

## Kiến trúc

| Thành phần | Vai trò |
|---|---|
| `map.md` / `map.en.md` | 2 trang (vi/en) chỉ chứa front matter + `{% include site-map.html %}` |
| `_includes/site-map.html` | Markup: filter bar, khung map, quickview, modal đọc bài. Load Leaflet/MarkerCluster CDN + các asset map |
| `_plugins/map_pins_index.rb` | Plugin sinh `/map-pins.bin` (JSON XOR-encode key `inspiring-map-pins-v1`) gom toạ độ + metadata từ front matter mỗi bài |
| `assets/js/map-pins.js` | Tải + giải mã `map-pins.bin` thành mảng pin |
| `assets/js/site-map.js` | Logic chính: khởi tạo Leaflet, cluster, filter, search, quickview, modal, nút Max/Fullscreen/Center |
| `assets/js/map-weather.js` | Lớp thời tiết trên quickview (cache localStorage `inspiring-map-weather-v3`) |
| `assets/css/site-map.css` | Toàn bộ style của trang map |
| `assets/css/map-weather.css` | Style widget thời tiết |
| `_data/strings.yml` → `map:` | Mọi chuỗi UI của map, song ngữ vi/en |

## Thêm 1 điểm ghim (pin)

Chỉ cần front matter của bài viết — không sửa code:

```yaml
geo: [21.0285, 105.8542]          # [vĩ độ, kinh độ] — bắt buộc để lên map
place_name: "Hà Nội"              # bắt buộc khi có geo
place_country: "Việt Nam"         # bắt buộc, dùng tên tiếng Việt
place_region: "Đồng bằng Bắc Bộ"  # tuỳ chọn, hiện trong quickview
```

Trường tuỳ chọn khác cho quickview: `place_area`, `place_population`,
`place_economy`, `place_festival`, `place_highlights` (tối đa 3 mục),
`place_best_time`, `place_food`, `place_transport`.

### Điểm chấm biên tập (tuỳ chọn)

```yaml
map_content_score: 8.5            # chất lượng bài viết, 0-10 (không ghi "/10")
map_content_note: "..."           # BẮT BUỘC khi có score
map_destination_score: 7          # độ hấp dẫn điểm đến
map_destination_note: "..."       # BẮT BUỘC khi có score
map_rating_updated: "2026-01-15"  # BẮT BUỘC khi có bất kỳ score nào, YYYY-MM-DD
```

`map_score: "8.5/10"` là định dạng cũ — chỉ hiển thị khi chưa có 2 điểm mới.
`map_ranking` hiện dòng xếp hạng trong quickview.

Schema đầy đủ + rule bắt buộc: `_tests/post.schema.json`. Kiểm tra:

```bash
bundle exec ruby _tests/post_frontmatter_test.rb   # trong môi trường Ruby của serve.sh
```

## Filter & tìm kiếm

- **Chuyên đề**: dropdown tự sinh từ `series` của các bài có `geo` — bài
  không thuộc series chỉ hiện ở "Tất cả". Thêm series mới = chỉ cần gán
  `series` + `series_url` cho bài.
- **Tìm kiếm**: gõ tên bài, `place_name`, quốc gia (tra `COUNTRY_LABEL`/
  `COUNTRY_CODE` trong `site-map.js`), tag.
- Chưa có filter quốc gia/châu lục (đã gỡ — cần lại khi làm lịch sử
  thế giới nhiều quốc gia; bảng `COUNTRY_*` vẫn giữ trong JS).

## localStorage keys

`inspiring-map-filters` (filter đã chọn), `inspiring-geo-cc`,
`inspiring-map-weather-v3` (cache thời tiết). Đổi cấu trúc dữ liệu lưu →
đổi tên/bump version key, đừng đọc format cũ.

## Bẫy hay gặp

- **Button/input không kế thừa font** — trang này không có rule `*{}`
  ép font như yedas; mọi control mới trong map phải nằm trong nhóm
  `font-family: inherit` ở đầu `site-map.css`.
- **Dropdown cuối filter bar** — menu phải canh `right: 0` (đã có rule
  `filter-drop:last-child`) nếu không tràn viewport.
- **Cache-bust CSS** — `custom-styles.css` load kèm `?v=` trong
  `_config.yml`. Sửa biến `:root` (vd `--hairline`, `--z-*`) mà không
  bump `?v=` → browser dùng CSS cũ → mất border/z-index (nút map biến
  mất vì z-index rỗng). Mọi z-index trong `site-map.css` luôn kèm
  fallback: `var(--z-map-controls, 800)`.
- **Sửa `_config.yml` hoặc thêm plugin** → tắt và chạy lại `./serve.sh`
  (Jekyll chỉ đọc config + plugin lúc khởi động).
- **Bài không có `geo`** → không lên map, bình thường; các bài lời khuyên/
  không gắn địa danh cố ý để trống.

## Kiểm tra sau khi sửa

1. `bundle exec jekyll build` → không lỗi.
2. Mở `/map/` + `Cmd+Shift+R` (hard-refresh, bỏ cache).
3. Kiểm tra: pins hiện, cluster mở popup, search lọc, dropdown Chuyên
   đề, 3 nút ⛶ ↗ ◎ góc trái dưới, quickview khi bấm pin.
4. Responsive: thu cửa sổ <576px — filter bar không vỡ, nút fullscreen
   chỉ hiện ≥577px.
