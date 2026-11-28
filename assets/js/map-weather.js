// Thời tiết trên quick view bản đồ: nhãn (icon + nhiệt độ, mô tả, gió) và
// hiệu ứng minh hoạ trên ảnh. Tách khỏi site-map.js; CSS ở map-weather.css.
// Dùng: var w = MapWeather.create({ badge, fx, tx }); w.show(place); w.clear();
(function (root) {
  // Thời tiết hiện tại qua Open-Meteo (miễn phí, không cần API key).
  // Cache localStorage TTL 6 giờ theo tọa độ làm tròn để giảm số lần gọi;
  // chỉ áp dụng kết quả mới nhất.
  var WX_LS = 'inspiring-map-weather-v3';
  var WX_TTL = 6 * 60 * 60 * 1000;
  var WX_LABEL = {
    clear: ['wx_clear', 'Trời quang'], partly: ['wx_partly', 'Ít mây'], cloudy: ['wx_cloudy', 'Nhiều mây'],
    fog: ['wx_fog', 'Sương mù'], drizzle: ['wx_drizzle', 'Mưa phùn'], rain: ['wx_rain', 'Mưa'],
    snow: ['wx_snow', 'Tuyết'], storm: ['wx_storm', 'Giông bão']
  };
  // Icon Lucide — id <symbol> trong _includes/lucide-map.html
  var WX_ICON = {
    clear: 'l-sun', partly: 'l-cloud-sun', cloudy: 'l-cloud', fog: 'l-cloud-fog',
    drizzle: 'l-cloud-drizzle', rain: 'l-cloud-rain', snow: 'l-snowflake', storm: 'l-cloud-lightning'
  };
  var WX_NIGHT_ICON = { clear: 'l-moon', partly: 'l-cloud-moon' };
  // Hình minh hoạ chạy qua ảnh theo loại thời tiết: mặt trời/trăng, mây
  // (trôi ngang hoặc mây đen lơ lửng khi mưa), tia sét khi giông.
  var WX_PARTS = {
    clear: ['sun'], partly: ['sun', 'cloud'], cloudy: ['cloud', 'cloud', 'cloud'], fog: [],
    drizzle: ['rain-cloud', 'rain-cloud'], rain: ['rain-cloud', 'rain-cloud', 'rain-cloud'],
    storm: ['rain-cloud', 'rain-cloud', 'bolt'], snow: ['rain-cloud', 'rain-cloud']
  };
  // Mặt trời và mây vẽ bằng CSS (.wx-sun / .wx-cloud), còn lại dùng icon Lucide
  var WX_PART_ICON = { moon: 'l-moon', bolt: 'l-zap', wind: 'l-leaf' };
  var WX_WINDY = 20; // km/h — từ mức này thêm lá bay ngang (gió)

  function kindFromCode(code) {
    if (code === 0) return 'clear';
    if (code <= 2) return 'partly';
    if (code === 3) return 'cloudy';
    if (code === 45 || code === 48) return 'fog';
    if (code >= 51 && code <= 57) return 'drizzle';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if (code >= 95) return 'storm';
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    return '';
  }

  // Kế hoạch hiệu ứng (thuần, không đụng DOM): `kind` cho data-wx của lớp
  // pseudo-element, `parts` là danh sách hình minh hoạ cần tạo.
  // Ban đêm thay mặt trời bằng mặt trăng và bỏ vệt nắng (clear/partly).
  function fxPlan(wx) {
    var night = wx.day === false;
    var kind = night && (wx.kind === 'clear' || wx.kind === 'partly') ? 'night' : wx.kind || '';
    var parts = (WX_PARTS[wx.kind] || []).map(function (p) { return night && p === 'sun' ? 'moon' : p; });
    if (wx.wind >= WX_WINDY) parts = parts.concat(['wind', 'wind', 'wind']);
    return { kind: kind, parts: parts };
  }

  function badgeIcon(wx) {
    return (wx.day === false && WX_NIGHT_ICON[wx.kind]) || WX_ICON[wx.kind] || '';
  }

  function store() {
    try { return JSON.parse(localStorage.getItem(WX_LS)) || {}; }
    catch (e) { return {}; }
  }
  function cacheGet(key) {
    var entry = store()[key];
    return entry && (Date.now() - entry.t < WX_TTL) ? entry.v : null;
  }
  function cacheSet(key, value) {
    try {
      var s = store();
      s[key] = { t: Date.now(), v: value };
      localStorage.setItem(WX_LS, JSON.stringify(s));
    } catch (e) {}
  }

  var inflight = {};
  function fetchWeather(d, key) {
    if (!inflight[key]) {
      inflight[key] = fetch('https://api.open-meteo.com/v1/forecast?latitude=' + d.lat +
            '&longitude=' + d.lng + '&current=temperature_2m,weather_code,wind_speed_10m,is_day')
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var c = j.current;
          if (!c) return null;
          var wx = {
            text: [Math.round(c.temperature_2m) + '°C', Math.round(c.wind_speed_10m) + ' km/h'],
            kind: kindFromCode(c.weather_code),
            wind: Math.round(c.wind_speed_10m),
            day: c.is_day !== 0
          };
          cacheSet(key, wx);
          return wx;
        })
        .catch(function () { return null; })
        .then(function (wx) { delete inflight[key]; return wx; });
    }
    return inflight[key];
  }

  function create(opts) {
    var badge = opts.badge, fx = opts.fx;
    var tx = opts.tx || function (k, d) { return d; };
    var seq = 0;
    var placeName = '';

    // Hiệu ứng chạy 1 lần mỗi lần mở, không loop.
    function play(wx) {
      if (!fx) return;
      fx.classList.remove('is-on');
      fx.replaceChildren();
      var plan = fxPlan(wx);
      if (!plan.kind && !plan.parts.length) return;
      var seen = {};
      plan.parts.forEach(function (p) {
        var n = seen[p] = (seen[p] || 0) + 1;
        var el = document.createElement('i');
        el.className = 'wx-part wx-' + p + ' wx-n' + n;
        if (WX_PART_ICON[p]) {
          el.innerHTML = '<svg class="licon" aria-hidden="true"><use href="#' + WX_PART_ICON[p] + '"/></svg>';
        }
        fx.appendChild(el);
      });
      fx.dataset.wx = plan.kind;
      void fx.offsetWidth;
      fx.classList.add('is-on');
    }

    function render(wx) {
      var label = WX_LABEL[wx.kind];
      var icon = badgeIcon(wx);
      var parts = wx.text.slice();
      if (label) parts.splice(1, 0, tx(label[0], label[1]));
      if (placeName) parts.unshift(placeName);
      badge.replaceChildren();
      if (icon) {
        var ic = document.createElement('span');
        ic.innerHTML = '<svg class="licon" aria-hidden="true"><use href="#' + icon + '"/></svg>';
        ic.setAttribute('aria-hidden', 'true');
        badge.append(ic, ' ');
      }
      badge.append(parts.join(' · '));
      badge.hidden = false;
      play(wx);
    }

    // Ẩn nhãn, dừng hiệu ứng và bỏ kết quả của lần tải đang chờ.
    function clear() {
      seq++;
      placeName = '';
      badge.hidden = true;
      badge.textContent = '';
      if (fx) fx.classList.remove('is-on');
    }

    function show(d) {
      clear();
      var mySeq = seq;
      placeName = d.name || '';
      badge.href = 'https://www.windy.com/' + d.lat.toFixed(3) + '/' + d.lng.toFixed(3);
      var key = d.lat.toFixed(2) + ',' + d.lng.toFixed(2);
      var apply = function (wx) {
        if (mySeq === seq && wx && wx.text) render(wx);
      };
      var cached = cacheGet(key);
      if (cached) apply(cached);
      else fetchWeather(d, key).then(apply);
    }

    return { show: show, clear: clear };
  }

  var api = { create: create, kindFromCode: kindFromCode, fxPlan: fxPlan, badgeIcon: badgeIcon, WINDY: WX_WINDY };
  root.MapWeather = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
