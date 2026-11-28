// Ghim bản đồ: biến mảng bài viết thô (do Liquid xuất trong
// _includes/site-map.html) thành object pin mà site-map.js đọc qua
// window.__athletePins. Tách khỏi Liquid để logic phân loại/chuẩn hóa/
// fallback đọc dễ và test được bằng node --test.
// Dùng: MapPins.build(posts, { base: '/tnclub-yedas/', foodCategories: [...] })
(function (root) {
  // Tag miền (không phân biệt hoa thường) → tên hiển thị chuẩn.
  var REGION_TAGS = {
    'miền bắc': 'Miền Bắc',
    'miền trung': 'Miền Trung',
    'miền nam': 'Miền Nam'
  };

  function str(v) { return v == null ? '' : v; }

  // Mọi URL pin (bài viết, ảnh) đi qua hàm này: nối baseurl + prefix
  // ngôn ngữ (EN = 'en/') + path; giữ nguyên URL tuyệt đối.
  // VI: base + 'posts/x/' · EN: base + 'en/posts/x/'
  function rel(base, path) {
    path = String(path || '');
    if (!path || /^https?:\/\//.test(path)) return path;
    return base + path.replace(/^\//, '');
  }

  // Bài ẩm thực thiếu place_region: lấy miền từ tag (tag sau ghi đè tag trước).
  function canonicalRegion(tags) {
    var region = '';
    (tags || []).forEach(function (tag) {
      var hit = REGION_TAGS[String(tag).toLowerCase().trim()];
      if (hit) region = hit;
    });
    return region;
  }

  function ratingFields(p, out) {
    out.ranking = str(p.ranking);
    out.score = str(p.score);
    out.contentScore = str(p.contentScore);
    out.destinationScore = str(p.destinationScore);
    out.contentNote = str(p.contentNote);
    out.destinationNote = str(p.destinationNote);
    out.ratingUpdated = str(p.ratingUpdated);
    return out;
  }

  function athletePin(p, a, base) {
    return ratingFields(p, {
      kind: 'athlete',
      lat: a.geo[0], lng: a.geo[1],
      series: str(p.series),
      name: str(a.name),
      nick: str(a.nickname),
      country: str(a.country),
      born: str(a.born),
      hometown: str(a.hometown),
      event: str(a.event),
      rank: str(a.highest_rank),
      summary: str(p.subtitle),
      skills: str(a.skills),
      achievement: str(a.achievement),
      height: str(a.height),
      hand: str(a.hand),
      debut: str(a.debut),
      url: rel(base, p.url),
      image: rel(base, p.banner || a.avatar),
      avatar: rel(base, a.avatar)
    });
  }

  function placePin(p, isFood, base) {
    var region = String(p.placeRegion || '').trim();
    if (!region && isFood) region = canonicalRegion(p.tags);
    // Không có place_region: lấy phần sau dấu phẩy của place_name làm
    // tỉnh thành/khu vực (vd "Cầu Hiền Lương, Quảng Trị" → "Quảng Trị").
    if (!region) {
      var nameParts = String(p.placeName || '').split(',');
      if (nameParts.length > 1) region = nameParts[nameParts.length - 1].trim();
    }
    return ratingFields(p, {
      kind: 'place',
      topic: isFood ? 'food' : 'travel',
      title: str(p.title) || str(p.placeName),
      lat: p.geo[0], lng: p.geo[1],
      series: str(p.series) || str(p.category),
      name: str(p.placeName) || str(p.title),
      nick: '',
      subtitle: str(p.subtitle),
      region: region,
      country: str(p.placeCountry) || 'Vietnam',
      population: str(p.population),
      area: str(p.area),
      economy: str(p.economy),
      festival: str(p.festival),
      highlights: p.highlights == null ? '' : p.highlights,
      bestTime: str(p.bestTime),
      food: str(p.food),
      transport: str(p.transport),
      tags: p.tags || [],
      url: rel(base, p.url),
      image: rel(base, p.cover || p.banner),
      avatar: rel(base, p.pinAvatar || p.cover || p.banner)
    });
  }

  // Năm sự kiện cho tour theo mốc thời gian: chỉ lấy năm 4 chữ số có
  // trong title (vd "1986 — Bước ngoặt Đổi mới") hoặc permalink
  // (vd /post/lich-su-7-thang-5-1954/) — KHÔNG lấy năm đăng bài vì đó
  // là năm viết, không phải năm của sự kiện.
  function eventYearOf(p) {
    // Bỏ đoạn /YYYY/MM/DD/ của permalink mặc định trước khi tìm năm —
    // đó là ngày đăng bài, không phải năm sự kiện.
    var url = String(p.url || '').replace(/\/\d{4}\/\d{2}\/\d{2}\//g, '/');
    var m = String(p.title || '').match(/\b(1[0-9]{3}|20[0-9]{2})\b/) ||
            url.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
    return m ? +m[0] : 0;
  }

  function build(posts, opts) {
    opts = opts || {};
    // Prefix ngôn ngữ: trang EN dùng base + 'en/' để link về bản /en/...
    var langPrefix = opts.lang && opts.lang !== opts.defaultLang ? opts.lang + '/' : '';
    var base = (opts.base || '/') + langPrefix;
    var foodCategories = {};
    (opts.foodCategories || []).forEach(function (c) {
      foodCategories[String(c).toLowerCase().trim()] = true;
    });
    var pins = [];
    (posts || []).forEach(function (p) {
      var a = p.athlete;
      var before = pins.length;
      if (a && a.geo) pins.push(athletePin(p, a, base));
      else if (p.geo) {
        var isFood = !!foodCategories[String(p.category || '').toLowerCase().trim()];
        pins.push(placePin(p, isFood, base));
      }
      if (pins.length === before) return;
      var pin = pins[pins.length - 1];
      // event_year trong front matter ghi đè năm đoán từ title/permalink.
      var fy = Number(p.eventYear);
      pin.eventYear = fy > 0 ? fy : eventYearOf(p);
      pin.tourNote = str(p.tourNote);
      pin.tourMarker = str(p.tourMarker);
      pin.tourAudio = rel(base, str(p.tourAudio));
      // Không có năm sự kiện → dùng năm đăng bài làm mốc sắp xếp cuối
      // (bài chưa ghi năm sẽ xếp sau các sự kiện có năm rõ ràng).
      var dYear = String(p.date || '').match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
      pin.sortYear = pin.eventYear || (dYear ? +dYear[0] : 99999);
      pin.historyDate = str(p.historyDate);
      pin.seriesOrder = p.seriesOrder;
    });
    return pins;
  }

  // Giải mã map-pins.bin: base64 → XOR ngược key (khớp MapPinsIndex.encode
  // trong _plugins/map_pins_index.rb). Chỉ là obfuscation — key nằm đây.
  var XOR_KEY = 'inspiring-map-pins-v1';
  function decode(text) {
    var bin = atob(text.trim());
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length);
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  // Tải /map-pins.bin (do _plugins/map_pins_index.rb xuất) rồi build pin.
  function load(url, opts) {
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.text(); })
      .then(function (text) { return build(decode(text), opts); });
  }

  var api = { build: build, load: load, decode: decode, canonicalRegion: canonicalRegion, rel: rel, eventYearOf: eventYearOf };
  root.MapPins = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
