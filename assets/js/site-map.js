(function () {
  // Icon "x" của Lucide (inline SVG, không cần tải thư viện icon ngoài)
  var CLOSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  function buildClusterPopup(list, countryLabels) {
    function escape(value) {
      return String(value || '').replace(/[&<>"']/g, function (ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
      });
    }
    var groups = [];
    list.forEach(function (en, idx) {
      var d = en.d;
      // Pin địa danh cùng một nơi đều có name giống nhau (vd 4 bài "Hà Nội")
      // — dùng tiêu đề bài làm nhãn chính, địa danh đưa xuống dòng phụ.
      var label = d.kind === 'place' && d.title ? d.title : d.name;
      var sub = d.kind === 'place'
        ? [d.name, countryLabels[d.country] || d.country, d.region].filter(Boolean).join(' · ')
        : [d.event || d.series, countryLabels[d.country] || d.country].filter(Boolean).join(' · ');
      var match = d.topic === 'food' && label.match(/^\[\s*\d+\s*·\s*([^\]]+)\]\s*:\s*(.+)$/);
      var title = match ? match[1].trim() : '';
      if (match) label = match[2].trim();
      var group = title && groups.filter(function (g) { return g.title === title && g.sub === sub; })[0];
      if (!group) {
        group = { title: title, sub: sub, items: [] };
        groups.push(group);
      }
      group.items.push('<button type="button" class="map-cluster-item" data-idx="' + idx + '">' +
        (d.avatar ? '<img src="' + escape(d.avatar) + '" alt="" loading="lazy">' : '<span class="map-cluster-noimg"></span>') +
        '<span class="map-cluster-text"><strong>' + escape(label) + '</strong>' +
        (!title && sub ? '<small>' + escape(sub) + '</small>' : '') + '</span></button>');
    });
    return '<div class="map-cluster-list">' + groups.map(function (group) {
      return (group.title ? '<div class="map-cluster-heading"><h3>' + escape(group.title) + '</h3>' +
        (group.sub ? '<small>' + escape(group.sub) + '</small>' : '') + '</div>' : '') + group.items.join('');
    }).join('') + '</div>';
  }

  function initMap() {
    var el = document.getElementById('athlete-map');
    var qv = document.getElementById('athlete-quickview');
    var count = document.getElementById('athlete-map-count');
    var totalCount = document.getElementById('map-total-count');
    if (!el || !window.L || !window.__athletePins) return;

    // Chuỗi UI theo ngôn ngữ — đổ từ _data/strings.yml qua window.__mapStrings
    // trong site-map.html. Fallback giữ nguyên tiếng Việt gốc.
    var S = window.__mapStrings || {};
    function tx(k, d) { return S[k] || d; }

    var map = L.map(el, {
      minZoom: 2, maxZoom: 10, zoomSnap: 0.5,
      worldCopyJump: true,
      attributionControl: true
    }).setView([20, 105], 2);
    map.setMaxBounds([[-75, -200], [80, 200]]);

    // Tiles kiểu Google Maps — Esri World Street Map, miễn phí không cần key
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri, HERE, Garmin &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      // Giữ tile đã tải ngoài viewport để pan/zoom mượt hơn; browser tự
      // cache tile theo HTTP cache của Esri nên lần sau vào sẽ nhanh hơn
      keepBuffer: 4, updateWhenZooming: false, updateWhenIdle: true
    }).addTo(map);

    function close() { qv.hidden = true; }
    var detail = document.getElementById('athlete-detail');
    var modal = document.getElementById('athlete-modal');
    // Đưa modal ra <body> để position:fixed thoát khỏi mọi stacking context /
    // containing block của ancestor trong section (lỗi modal nằm dưới navbar).
    if (modal && modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }
    var mediaContent = document.getElementById('athlete-media-content');
    var detailCache = {};

    function closeDetail() { detail.hidden = true; }
    function closeModal() {
      if (modal.hidden) return;
      modal.hidden = true;
      mediaContent.innerHTML = ''; // dừng video đang phát
      document.body.style.overflow = section && (section.classList.contains('is-max') || section.classList.contains('is-fullscreen')) ? 'hidden' : '';
    }

    modal.querySelector('.athlete-modal-backdrop').addEventListener('click', closeModal);
    modal.querySelector('.athlete-modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) {
        e.preventDefault();
        closeModal();
      }
    });

    // Fetch + parse bài viết, cache lại Document
    function fetchDoc(url) {
      if (detailCache[url]) return Promise.resolve(detailCache[url]);
      return fetch(url).then(function (r) { return r.text(); }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        detailCache[url] = doc;
        return doc;
      });
    }

    // Panel hồ sơ inline dưới bản đồ
    function loadPost(url) {
      close();
      detail.hidden = false;
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
      detail.innerHTML = '<p class="athlete-detail-loading">' + tx('loading_profile', 'Đang tải hồ sơ…') + '</p>';
      fetchDoc(url).then(function (doc) {
        var body = doc.querySelector('.post-body');
        detail.innerHTML = '<button class="athlete-detail-close" type="button" aria-label="' + tx('close_profile', 'Đóng hồ sơ') + '">' + CLOSE_ICON + '</button>' +
          (body ? '<div class="blog-post post-body">' + body.innerHTML + '</div>'
                : '<p>' + tx('no_content', 'Không đọc được nội dung bài viết.') + '</p>');
      }).catch(function () {
        detail.innerHTML = '<button class="athlete-detail-close" type="button" aria-label="' + tx('close_profile', 'Đóng hồ sơ') + '">' + CLOSE_ICON + '</button>' +
          '<p class="athlete-detail-loading"><a href="' + url + '">' + tx('load_failed', 'Không tải được bài viết — mở trang riêng.') + '</a></p>';
      });
    }

    // Modal riêng cho Galleries / Videos — trích đúng phần đó từ bài
    function openMedia(url, kind, name) {
      close();
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      mediaContent.innerHTML = '<p class="athlete-detail-loading">' + tx('loading', 'Đang tải…') + '</p>';
      fetchDoc(url).then(function (doc) {
        var body = doc.querySelector('.post-body'), inner = '';
        if (body) {
          if (kind === 'gallery') {
            var figs = body.querySelectorAll('figure');
            if (figs.length) {
              inner = '<h3 class="athlete-media-title">Galleries — ' + name + '</h3>' +
                '<div class="blog-post post-body"><div class="athlete-media-gallery">' +
                Array.prototype.map.call(figs, function (f) { return f.outerHTML; }).join('') +
                '</div></div>';
            }
          } else {
            var vids = body.querySelectorAll('.video-embed');
            if (vids.length) {
              inner = '<h3 class="athlete-media-title">Videos — ' + name + '</h3>' +
                '<div class="blog-post post-body"><div class="athlete-media-videos">' +
                Array.prototype.map.call(vids, function (v) { return v.outerHTML; }).join('') +
                '</div></div>';
            }
          }
        }
        mediaContent.innerHTML = inner ||
          '<p class="athlete-detail-loading">' + name + ' ' + tx('no_media', 'chưa có') + ' ' +
          (kind === 'gallery' ? tx('media_gallery', 'ảnh minh họa') : tx('media_video', 'video')) + '.</p>';
      }).catch(function () {
        mediaContent.innerHTML = '<p class="athlete-detail-loading">' + tx('load_failed_media', 'Không tải được nội dung.') + '</p>';
      });
    }

    detail.addEventListener('click', function (e) {
      if (e.target.closest('.athlete-detail-close')) closeDetail();
    });
    qv.querySelector('.athlete-qv-link').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      loadPost(this.href);
    });
    qv.querySelectorAll('.athlete-qv-goto').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openMedia(qv.querySelector('.athlete-qv-link').href, a.dataset.goto,
          qv.querySelector('.athlete-qv-name').textContent);
      });
    });
    map.on('click', close);
    map.on('zoomstart', close);
    qv.querySelector('.athlete-qv-close').addEventListener('click', close);

    var CONTINENT_LABEL = { asia: tx('continent_asia', 'Châu Á'), europe: tx('continent_europe', 'Châu Âu'), americas: tx('continent_americas', 'Châu Mỹ'), africa: tx('continent_africa', 'Châu Phi'), oceania: tx('continent_oceania', 'Châu Đại Dương'), mideast: tx('continent_mideast', 'Trung Đông') };
    var COUNTRY_CONTINENT = {
      Vietnam: 'asia', China: 'asia', Japan: 'asia', Taiwan: 'asia',
      Thailand: 'asia', Korea: 'asia', Indonesia: 'asia', Malaysia: 'asia',
      Philippines: 'asia', Laos: 'asia', Cambodia: 'asia', India: 'asia',
      Pakistan: 'asia', Nepal: 'asia', Bangladesh: 'asia', Bhutan: 'asia',
      'Sri Lanka': 'asia', Maldives: 'asia', Afghanistan: 'asia',
      'United Arab Emirates': 'mideast', 'Saudi Arabia': 'mideast', Israel: 'mideast',
      Jordan: 'mideast', Turkey: 'mideast', Qatar: 'mideast', Oman: 'mideast', Iran: 'mideast',
      Bahrain: 'mideast', Kuwait: 'mideast', Lebanon: 'mideast', Iraq: 'mideast', Cyprus: 'mideast',
      Georgia: 'mideast', Armenia: 'mideast', Azerbaijan: 'mideast', Syria: 'mideast', Yemen: 'mideast',
      France: 'europe', Italy: 'europe', Spain: 'europe', 'United Kingdom': 'europe',
      Germany: 'europe', Netherlands: 'europe', Switzerland: 'europe', Greece: 'europe',
      Poland: 'europe', Czechia: 'europe', Hungary: 'europe', Croatia: 'europe',
      Romania: 'europe', Bulgaria: 'europe', Ukraine: 'europe', Serbia: 'europe',
      Russia: 'europe',
      Denmark: 'europe', Norway: 'europe', Sweden: 'europe', Finland: 'europe',
      Iceland: 'europe',
      'United States': 'americas', Canada: 'americas', Brazil: 'americas',
      Argentina: 'americas', Peru: 'americas', Chile: 'americas', Colombia: 'americas',
      Australia: 'oceania', 'New Zealand': 'oceania',
      Morocco: 'africa', Egypt: 'africa', Tunisia: 'africa', Algeria: 'africa',
      Ethiopia: 'africa', Kenya: 'africa', Tanzania: 'africa', Uganda: 'africa',
      Rwanda: 'africa', Senegal: 'africa', Ghana: 'africa', Nigeria: 'africa',
      Namibia: 'africa', Zimbabwe: 'africa', 'South Africa': 'africa', Mauritius: 'africa',
      Libya: 'africa', Sudan: 'africa',
      Madagascar: 'africa', Botswana: 'africa', Zambia: 'africa', Malawi: 'africa',
      Mozambique: 'africa', Angola: 'africa', Lesotho: 'africa', Eswatini: 'africa',
      Seychelles: 'africa', 'Cape Verde': 'africa',
      Mauritania: 'africa', Mali: 'africa', 'Ivory Coast': 'africa', 'Burkina Faso': 'africa',
      Guinea: 'africa', Togo: 'africa', Benin: 'africa', Niger: 'africa',
      'Sierra Leone': 'africa', Liberia: 'africa'
    };
    var COUNTRY_LABEL = { Vietnam: tx('country_vietnam', 'Việt Nam'), 'United Arab Emirates': 'UAE' };
    function normalizeCountry(country) {
      var value = (country || '').trim();
      return /^(việt nam|viet nam|vietnam)$/i.test(value) ? 'Vietnam' : value;
    }
    var COUNTRY_CODE = {
      Vietnam: 'vn', China: 'cn', Japan: 'jp', Taiwan: 'tw',
      Thailand: 'th', Korea: 'kr', Indonesia: 'id', Malaysia: 'my',
      Philippines: 'ph', Laos: 'la', Cambodia: 'kh', India: 'in',
      Pakistan: 'pk', Nepal: 'np', Bangladesh: 'bd', Bhutan: 'bt',
      'Sri Lanka': 'lk', Maldives: 'mv', Afghanistan: 'af',
      'United Arab Emirates': 'ae', 'Saudi Arabia': 'sa', Israel: 'il',
      Jordan: 'jo', Turkey: 'tr', Qatar: 'qa', Oman: 'om', Iran: 'ir',
      Bahrain: 'bh', Kuwait: 'kw', Lebanon: 'lb', Iraq: 'iq', Cyprus: 'cy',
      Georgia: 'ge', Armenia: 'am', Azerbaijan: 'az', Syria: 'sy', Yemen: 'ye',
      France: 'fr', Italy: 'it', Spain: 'es', 'United Kingdom': 'gb',
      Germany: 'de', Netherlands: 'nl', Switzerland: 'ch', Greece: 'gr',
      Poland: 'pl', Czechia: 'cz', Hungary: 'hu', Croatia: 'hr',
      Romania: 'ro', Bulgaria: 'bg', Ukraine: 'ua', Serbia: 'rs',
      Russia: 'ru',
      Denmark: 'dk', Norway: 'no', Sweden: 'se', Finland: 'fi',
      Iceland: 'is',
      'United States': 'us', Canada: 'ca', Brazil: 'br',
      Argentina: 'ar', Peru: 'pe', Chile: 'cl', Colombia: 'co',
      Australia: 'au', 'New Zealand': 'nz',
      Morocco: 'ma', Egypt: 'eg', Tunisia: 'tn', Algeria: 'dz',
      Ethiopia: 'et', Kenya: 'ke', Tanzania: 'tz', Uganda: 'ug',
      Rwanda: 'rw', Senegal: 'sn', Ghana: 'gh', Nigeria: 'ng',
      Namibia: 'na', Zimbabwe: 'zw', 'South Africa': 'za', Mauritius: 'mu',
      Libya: 'ly', Sudan: 'sd',
      Madagascar: 'mg', Botswana: 'bw', Zambia: 'zm', Malawi: 'mw',
      Mozambique: 'mz', Angola: 'ao', Lesotho: 'ls', Eswatini: 'sz',
      Seychelles: 'sc', 'Cape Verde': 'cv',
      Mauritania: 'mr', Mali: 'ml', 'Ivory Coast': 'ci', 'Burkina Faso': 'bf',
      Guinea: 'gn', Togo: 'tg', Benin: 'bj', Niger: 'ne',
      'Sierra Leone': 'sl', Liberia: 'lr'
    };

    L.DomEvent.disableClickPropagation(qv);
    L.DomEvent.disableScrollPropagation(qv);

    var scoreHelp = document.querySelector('.map-score-help');
    document.addEventListener('pointerdown', function (e) {
      if (scoreHelp && !scoreHelp.contains(e.target)) scoreHelp.open = false;
      var active = document.activeElement;
      if (active && active.classList.contains('athlete-qv-score') && !active.contains(e.target)) active.blur();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      var tips = qv.querySelectorAll('.athlete-qv-score:is(:hover, :focus) .athlete-qv-score-tooltip:not([hidden])');
      if (tips.length) {
        tips.forEach(function (tip) {
          tip.hidden = true;
          tip.parentElement.blur();
        });
        e.preventDefault();
      }
      if (scoreHelp && scoreHelp.open) {
        scoreHelp.open = false;
        e.preventDefault();
      }
      if (!e.defaultPrevented) close();
    });

    function renderFacts(selector, rows) {
      var list = qv.querySelector(selector);
      list.replaceChildren();
      rows.forEach(function (row) {
        var value = Array.isArray(row[1]) ? row[1].filter(Boolean).slice(0, 3).join(' · ') : row[1];
        if (value === '' || value == null) return;
        var group = document.createElement('div');
        var label = document.createElement('dt');
        var text = document.createElement('dd');
        label.textContent = row[0];
        if (row[2]) {
          var flag = document.createElement('span');
          flag.className = 'fi fi-' + row[2];
          flag.setAttribute('aria-hidden', 'true');
          text.appendChild(flag);
        }
        text.appendChild(document.createTextNode(value));
        group.append(label, text);
        list.appendChild(group);
      });
      list.hidden = !list.childElementCount;
      return list.childElementCount;
    }

    // Thời tiết quick view — module riêng assets/js/map-weather.js
    var weather = window.MapWeather && window.MapWeather.create({
      badge: qv.querySelector('.athlete-qv-weather'),
      fx: qv.querySelector('.athlete-qv-wx-fx'),
      tx: tx
    });

    function readScore(value) {
      if (typeof value !== 'number' && typeof value !== 'string') return null;
      if (String(value).trim() === '') return null;
      var score = Number(value);
      return Number.isFinite(score) && score >= 0 && score <= 10 ? score : null;
    }

    function renderScores(d) {
      var section = qv.querySelector('.athlete-qv-scores');
      var list = section.querySelector('.athlete-qv-score-list');
      list.replaceChildren();
      var scores = [[tx('score_content', 'Chất lượng bài viết'), d.contentScore, d.contentNote]];
      if (d.kind === 'place') scores.push([tx('score_destination', 'Độ hấp dẫn điểm đến'), d.destinationScore, d.destinationNote]);
      scores.forEach(function (item, index) {
        var score = readScore(item[1]);
        if (score === null && d.kind !== 'place') return;
        var row = document.createElement('div');
        row.className = 'athlete-qv-score';
        row.dataset.level = score === null ? 'empty' : score < 5 ? 'low' : score < 8 ? 'medium' : 'high';
        var heading = document.createElement('div');
        var label = document.createElement('span');
        var value = document.createElement('strong');
        label.className = index === 0 ? 'fas fa-file-alt' : 'fas fa-map-marker-alt';
        label.setAttribute('aria-hidden', 'true');
        value.textContent = score === null ? '—' : score + '/10';
        row.tabIndex = 0;
        row.setAttribute('role', 'group');
        row.setAttribute('aria-label', item[0]);
        row.addEventListener('click', function () { row.focus(); });
        heading.append(label, value);
        var track = document.createElement('div');
        track.className = 'athlete-qv-score-track';
        var fill = document.createElement('span');
        fill.style.width = (score === null ? 0 : score * 10) + '%';
        track.appendChild(fill);
        if (score !== null) {
          track.setAttribute('role', 'meter');
          track.setAttribute('aria-label', item[0]);
          track.setAttribute('aria-valuemin', '0');
          track.setAttribute('aria-valuemax', '10');
          track.setAttribute('aria-valuenow', String(score));
        }
        row.append(heading, track);
        var tooltip = document.createElement('span');
        tooltip.className = 'athlete-qv-score-tooltip';
        tooltip.id = 'map-score-tip-' + index;
        tooltip.setAttribute('role', 'tooltip');
        tooltip.textContent = item[0] + ': ' + (score === null ? tx('not_rated', 'Chưa đánh giá') : score + '/10') +
          (score !== null && item[2] ? '. ' + item[2] : '') +
          (score !== null && d.ratingUpdated ? ' · ' + tx('updated', 'Cập nhật') + ': ' + d.ratingUpdated : '');
        row.setAttribute('aria-describedby', tooltip.id);
        function showTooltip() {
          tooltip.hidden = false;
          tooltip.style.bottom = 'auto';
          var card = qv.getBoundingClientRect();
          var anchor = row.getBoundingClientRect();
          tooltip.style.maxHeight = (card.height - 12) + 'px';
          var height = tooltip.offsetHeight;
          var top = anchor.top - height - 6;
          if (top < card.top + 6 && anchor.bottom + height + 6 <= card.bottom - 6) top = anchor.bottom + 6;
          tooltip.style.top = (Math.max(card.top + 6, Math.min(top, card.bottom - height - 6)) - anchor.top) + 'px';
        }
        row.addEventListener('mouseenter', showTooltip);
        row.addEventListener('focus', showTooltip);
        row.appendChild(tooltip);
        list.appendChild(row);
      });
      section.hidden = !list.childElementCount;
    }

    function openQuickview(d) {
        qv.querySelector('.athlete-qv-avatar').src = d.image || d.avatar;
        qv.querySelector('.athlete-qv-avatar').alt = d.name;
        qv.querySelector('.athlete-qv-name').textContent = d.topic === 'food' && d.title ? d.title : d.name;
        var isPlace = d.kind === 'place';
        var nick = qv.querySelector('.athlete-qv-nick');
        nick.textContent = !isPlace && d.nick ? '“' + d.nick + '”' : '';
        nick.hidden = !nick.textContent;
        var summary = qv.querySelector('.athlete-qv-summary');
        summary.textContent = (isPlace ? d.subtitle : d.summary) || '';
        summary.hidden = !summary.textContent;
        renderScores(d);
        var hasScores = readScore(d.contentScore) !== null || (isPlace && readScore(d.destinationScore) !== null);
        var hasLegacyScore = d.score !== '' && d.score != null;
        renderFacts('.athlete-qv-rating', [
          [tx('f_ranking', 'Xếp hạng'), d.ranking], [tx('f_score', 'Điểm hiện tại'), hasScores ? '' : d.score],
          [tx('updated', 'Cập nhật'), d.ranking || (!hasScores && hasLegacyScore) ? d.ratingUpdated : '']
        ]);
        renderFacts('.athlete-qv-grid', isPlace
          ? [[tx('f_country', 'Quốc gia'), COUNTRY_LABEL[d.country] || d.country, COUNTRY_CODE[d.country]], [tx('f_region', 'Vùng'), d.region], [tx('f_area', 'Diện tích'), d.area], [tx('f_population', 'Dân số'), d.population]]
          : [[tx('f_nationality', 'Quốc tịch'), COUNTRY_LABEL[d.country] || d.country, COUNTRY_CODE[d.country]], [tx('f_event', 'Nội dung'), d.event], [tx('f_best_rank', 'Hạng cao nhất'), d.rank]]);
        renderFacts('.athlete-qv-facts', isPlace
          ? [[tx('f_highlights', 'Nên ghé'), d.highlights], [tx('f_best_time', 'Thời điểm nên đi'), d.bestTime]]
          : [[tx('f_skills', 'Kỹ năng nổi bật'), d.skills], [tx('f_achievement', 'Thành tích'), d.achievement]]);
        var more = qv.querySelector('.athlete-qv-more');
        more.open = false;
        more.hidden = !renderFacts('.athlete-qv-extra', isPlace
          ? [[tx('f_transport', 'Di chuyển'), d.transport], [tx('f_food', 'Món nên thử'), d.food],
             [tx('f_economy', 'Kinh tế'), d.economy], [tx('f_festival', 'Lễ hội'), d.festival]]
          : [[tx('f_hometown', 'Nguyên quán'), d.hometown], [tx('f_born', 'Ngày sinh'), d.born], [tx('f_height', 'Chiều cao'), d.height],
             [tx('f_hand', 'Tay thuận'), d.hand], [tx('f_debut', 'Ra mắt'), d.debut]]);
        var directions = qv.querySelector('.athlete-qv-directions');
        directions.hidden = !isPlace;
        if (isPlace) directions.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(d.lat + ',' + d.lng);
        var google = qv.querySelector('.athlete-qv-google');
        var googleQuery = [d.name, d.country, isPlace ? '' : d.event].filter(Boolean).join(' ');
        google.href = 'https://www.google.com/search?q=' + encodeURIComponent(googleQuery);
        google.setAttribute('aria-label', tx('google_aria', 'Tìm %1 trên Google (mở tab mới)').replace('%1', d.name));
        qv.scrollTop = 0;
        qv.querySelector('.athlete-qv-link').href = d.url;
        qv.querySelector('.athlete-qv-link').textContent = d.kind === 'place'
          ? tx('view_post', 'Xem bài viết') : tx('view_profile', 'Xem hồ sơ');
        if (weather) {
          if (isPlace) weather.show(d); else weather.clear();
        }
        qv.hidden = false;
    }

    var entries = window.__athletePins.map(function (d, i) {
      d.country = normalizeCountry(d.country);
      var icon = L.divIcon({
        className: 'athlete-pin-wrap' + (d.kind === 'place' ? ' place-pin-wrap' : ''),
        html: '<span class="athlete-pin' + (d.kind === 'place' ? ' place-pin' : '') + '" style="animation-delay:' + Math.min(i * 20, 1200) + 'ms">' +
              (d.avatar ? '<img src="' + d.avatar + '" alt="" draggable="false" decoding="async" loading="lazy">' : '') +
              '<span class="athlete-pin-shadow"></span></span>',
        iconSize: [44, 54], iconAnchor: [22, 52]
      });
      var m = L.marker([d.lat, d.lng], { icon: icon, riseOnHover: true });
      var tipHtml = d.kind === 'place'
        ? '<strong>' + (d.topic === 'food' && d.title ? d.title : d.name) + '</strong>' +
          (d.region ? '<br><small>' + d.region + '</small>' : '')
        : '<strong>' + d.name + '</strong>' +
          (d.nick ? '<br><em>“' + d.nick + '”</em>' : '') +
          '<br><small>' + (d.born ? d.born.split('/').pop() : '') +
          (d.hometown ? ' · ' + d.hometown : '') + '</small>';
      m.bindTooltip(tipHtml,
        { direction: 'top', offset: [0, -24], className: 'athlete-pin-tip' }
      );
      m.on('click', function () { stopTour(); openQuickview(d); });
      return {
        marker: m, d: d, kind: d.kind, topic: d.topic, url: d.url, region: d.region || '', series: d.series, country: d.country || '',
        searchText: normalizeText([d.name, d.title, d.nick, d.series, d.country, COUNTRY_LABEL[d.country], d.hometown,
          d.event, d.subtitle, d.region, d.economy, d.festival,
          CONTINENT_LABEL[COUNTRY_CONTINENT[d.country]] || ''].join(' '))
      };
    });

    // Gom các bài trùng tọa độ thành 1 ghim có số lượng — bấm vào hiện
    // danh sách để chọn bài, thay vì xếp chồng nhiều pin khó bấm.
    var clusters = [];
    var clusterGroups = Object.create(null);
    entries.forEach(function (en) {
      var ll = en.marker.getLatLng();
      var key = ll.lat.toFixed(5) + ',' + ll.lng.toFixed(5);
      (clusterGroups[key] = clusterGroups[key] || []).push(en);
    });
    Object.keys(clusterGroups).forEach(function (key) {
      var members = clusterGroups[key];
      if (members.length < 2) return;
      var isPlace = members[0].kind === 'place';
      var avatar = members.map(function (en) { return en.d.avatar; }).filter(Boolean)[0] || '';
      var cm = L.marker(members[0].marker.getLatLng(), {
        icon: L.divIcon({
          className: 'athlete-pin-wrap' + (isPlace ? ' place-pin-wrap' : '') + ' map-cluster-wrap',
          html: '<span class="athlete-pin' + (isPlace ? ' place-pin' : '') + ' map-cluster">' +
                (avatar ? '<img src="' + avatar + '" alt="" draggable="false" decoding="async" loading="lazy">' : '') +
                '<b class="map-cluster-count"></b>' +
                '<span class="athlete-pin-shadow"></span></span>',
          iconSize: [44, 54], iconAnchor: [22, 52]
        }),
        riseOnHover: true
      });
      cm.bindTooltip('', { direction: 'top', offset: [0, -24], className: 'athlete-pin-tip' });
      cm.bindPopup('', { className: 'map-cluster-popup', maxWidth: 280, offset: [0, -14] });
      var cl = { marker: cm, members: members, visList: [] };
      cm.on('click', function () {
        if (cl.visList.length === 1) { map.closePopup(); stopTour(); openQuickview(cl.visList[0].d); return; }
        if (!cl.visList.length) return;
        var html = buildClusterPopup(cl.visList, COUNTRY_LABEL);
        cm.getPopup().setContent(html);
      });
      cm.on('popupopen', function () {
        var node = cm.getPopup().getElement();
        if (!node || node._wired) return;
        node._wired = true;
        node.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-idx]');
          if (!btn) return;
          map.closePopup();
          var en = cl.visList[+btn.dataset.idx];
          if (en) { stopTour(); openQuickview(en.d); }
        });
      });
      members.forEach(function (en) { en.cluster = cl; });
      clusters.push(cl);
    });

    // Khung nhìn mặc định bao trọn tất cả pin — tự tính theo dữ liệu
    // thay vì hardcode center/zoom (đổi chiều cao map không bị lệch).
    var homeBounds = L.latLngBounds(entries.map(function (en) {
      return en.marker.getLatLng();
    }));

    var filterBar = document.getElementById('athlete-map-filters');
    var seriesDrop = document.getElementById('filter-drop-series');
    var seriesLabel = seriesDrop ? seriesDrop.querySelector('.filter-drop-label') : null;
    var activeFilter = 'all', activeSeries = 'all';

    // Filter mặc định + ghi nhớ lựa chọn của người dùng
    var DEFAULT_FILTER = (window.__athleteMapConfig || {}).defaultFilter || 'all';
    var LS_KEY = 'inspiring-map-filters';
    function saveFilters() {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          f: activeFilter, series: activeSeries
        }));
      } catch (e) {}
    }
    // Hàng chip dưới filter bar: giữ chỗ cho các lựa chọn phụ sau này.
    // Chuyên đề đã hiện ngay trên nhãn dropdown nên không cần chip nữa.
    var chipsRow = document.getElementById('map-filter-chips');
    function renderChips() {
      if (chipsRow) chipsRow.hidden = !chipsRow.childElementCount;
    }

    // Nhãn dropdown Chuyên đề: hiện tên series đang chọn thay vì chữ
    // "Chuyên đề" trống — nhìn là biết đang lọc cái gì, không cần chip.
    function syncSeriesLabel() {
      if (!seriesLabel) return;
      var sel = activeSeries !== 'all' && seriesDrop
        ? seriesDrop.querySelector('[data-series="' + activeSeries + '"]') : null;
      seriesLabel.textContent = sel ? sel.textContent.trim() : tx('series', 'Chuyên đề');
    }

    function normalizeText(value) {
      return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    }

    var searchInput = document.getElementById('athlete-map-search');
    searchInput.addEventListener('input', function () { applyFilters(true); });

    function applyFilters(silent) {
      var shown = 0;
      var terms = normalizeText(searchInput.value).trim().split(/\s+/).filter(Boolean);
      entries.forEach(function (en) {
        var on;
        if (activeFilter === 'all') on = true;
        else if (activeFilter === 'Chuyên đề')
          on = activeSeries === 'all' ? !!en.series : en.series === activeSeries;
        else on = false;
        on = on && terms.every(function (term) { return en.searchText.indexOf(term) !== -1; });
        en._vis = on;
        if (en.cluster) {
          if (on) shown++;
          return;
        }
        if (on) {
          en.marker.addTo(map);
          var pinEl = en.marker.getElement() &&
            en.marker.getElement().querySelector('.athlete-pin');
          if (pinEl) pinEl.style.animationDelay = Math.min(shown * 20, 1200) + 'ms';
          shown++;
        }
        else map.removeLayer(en.marker);
      });
      clusters.forEach(function (cl) {
        cl.visList = cl.members.filter(function (en) { return en._vis; });
        map.removeLayer(cl.marker);
        cl.members.forEach(function (en) { map.removeLayer(en.marker); });
        if (!cl.visList.length) return;
        if (cl.visList.length === 1) {
          cl.visList[0].marker.addTo(map);
          return;
        }
        cl.marker.addTo(map);
        var cmEl = cl.marker.getElement();
        if (cmEl) {
          cmEl.querySelector('.map-cluster-count').textContent = cl.visList.length;
          var pinEl = cmEl.querySelector('.athlete-pin');
          if (pinEl) pinEl.style.animationDelay = Math.min(shown * 20, 1200) + 'ms';
        }
        cl.marker.setTooltipContent('<strong>' + tx('cluster_tip', '%1 điểm tại đây — bấm để chọn bài').replace('%1', cl.visList.length) + '</strong>');
      });
      if (count) count.textContent = shown;
      if (totalCount) totalCount.textContent = shown;
      renderChips();
      syncSeriesLabel();
      close();
      // Nút ▶ chuyên đề chỉ hiện khi đang lọc một chuyên đề cụ thể
      if (playBtn) playBtn.hidden = !(activeFilter === 'Chuyên đề' && activeSeries !== 'all' && shown > 1);
      if (tour.on) stopTour();

      // Tự zoom theo filter: quốc gia cụ thể → khung nước đó;
      // "Tất cả" → về khung nhìn mặc định; còn lại fit theo các pin đang hiện
      if (silent) return;
      focusView();
    }

    // Bay về đúng khung nhìn của lựa chọn hiện tại — nút ◎ trên bản đồ
    // và filter đều đi qua hàm này (zoom luôn được áp theo vùng đích).
    function focusView() {
      if (activeFilter === 'all') {
        map.flyToBounds(homeBounds, { padding: [50, 50], duration: 1.0, maxZoom: 6 });
      } else {
        var bounds = [];
        entries.forEach(function (en) {
          if (en._vis !== false) bounds.push(en.marker.getLatLng());
        });
        if (bounds.length) {
          map.flyToBounds(L.latLngBounds(bounds), { padding: [50, 50], duration: 1.2, maxZoom: 7 });
        }
      }
    }

    function resetDrop(wrap, label, baseLabel, key, items) {
      wrap.querySelectorAll('.drop-item').forEach(function (b) {
        b.classList.toggle('drop-item-active', b.dataset[key] === 'all');
      });
      wrap.querySelectorAll('.drop-group-title').forEach(function (b) {
        b.classList.remove('drop-group-title-active');
      });
      label.textContent = baseLabel;
    }

    function setMainFilter(name, btn, silent) {
      activeFilter = name;
      filterBar.querySelectorAll(':scope > .home-tab, :scope .filter-drop > .home-tab').forEach(function (b) {
        b.classList.toggle('home-tab-active', b === btn);
      });
      if (name !== 'Chuyên đề' && activeSeries !== 'all' && seriesDrop) {
        activeSeries = 'all';
        resetDrop(seriesDrop, seriesLabel, tx('series', 'Chuyên đề'), 'series');
      }
      applyFilters(silent);
      saveFilters();
    }

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      // Chọn chuyên đề trong dropdown → tự bật filter Chuyên đề
      if (btn.dataset.series && seriesDrop) {
        activeSeries = btn.dataset.series;
        seriesDrop.querySelectorAll('.drop-item').forEach(function (b) {
          b.classList.toggle('drop-item-active', b === btn);
        });
        syncSeriesLabel();
        setMainFilter('Chuyên đề', seriesDrop.querySelector('[data-filter="Chuyên đề"]'));
        seriesDrop.classList.remove('open');
        return;
      }

      if (!btn.dataset.filter) return;
      var f = btn.dataset.filter;
      if (seriesDrop) {
        if (f === 'Chuyên đề') seriesDrop.classList.toggle('open');
        else seriesDrop.classList.remove('open');
      }
      if (f === activeFilter) {
        // Bấm lại nút đang active: Chuyên đề chỉ toggle menu (đã xử lý ở
        // trên), các nút khác đóng menu — không reset về "tất cả"
        // (menu không còn mục Tất cả; muốn bỏ lọc dùng nút × trên chip).
        if (seriesDrop && f !== 'Chuyên đề') seriesDrop.classList.remove('open');
      } else {
        setMainFilter(f, btn);
      }
    });

    // Phóng to trong tab trình duyệt — phủ viewport, giữ hàng filter phía trên
    var section = el.closest('.athlete-map-section');
    var fsBtn = document.getElementById('map-fs-btn');
    var expandBtn = document.getElementById('map-expand-btn');
    L.DomEvent.disableClickPropagation(el.querySelector('#map-fs-btn'));
    L.DomEvent.disableClickPropagation(expandBtn);
    L.DomEvent.disableClickPropagation(document.getElementById('map-center-btn'));
    var fullscreenFallback = false;
    function syncFullscreen() {
      var on = document.fullscreenElement === section || fullscreenFallback;
      section.classList.toggle('is-fullscreen', on);
      fsBtn.setAttribute('aria-pressed', String(on));
      fsBtn.title = on ? tx('exit_fullscreen', 'Thoát toàn màn hình') : tx('fullscreen', 'Fullscreen — Toàn màn hình');
      fsBtn.setAttribute('aria-label', fsBtn.title);
      document.body.style.overflow = on || section.classList.contains('is-max') ? 'hidden' : '';
      map.invalidateSize();
    }
    document.addEventListener('fullscreenchange', syncFullscreen);
    fsBtn.addEventListener('click', function () {
      if (document.fullscreenElement === section) {
        document.exitFullscreen().catch(function () {});
      } else if (fullscreenFallback) {
        fullscreenFallback = false;
        syncFullscreen();
      } else if (section.requestFullscreen && document.fullscreenEnabled) {
        section.requestFullscreen().catch(function () {
          fullscreenFallback = true;
          syncFullscreen();
        });
      } else {
        fullscreenFallback = true;
        syncFullscreen();
      }
    });
    if (window.ResizeObserver) new ResizeObserver(function () { map.invalidateSize(); }).observe(el);
    var navEl = document.querySelector('.navbar-custom');
    function updateNavOffset() {
      if (!section.classList.contains('is-max') && !section.classList.contains('is-fullscreen')) return;
      var navBottom = navEl ? navEl.getBoundingClientRect().bottom : 0;
      section.style.setProperty('--nav-h', Math.max(Math.round(navBottom), 0) + 'px');
    }
    if (navEl && window.ResizeObserver) new ResizeObserver(updateNavOffset).observe(navEl);
    if (navEl) navEl.addEventListener('transitionend', updateNavOffset);
    window.addEventListener('scroll', updateNavOffset, { passive: true });
    function setMax(on) {
      section.classList.toggle('is-max', on);
      updateNavOffset();
      document.body.style.overflow = on || section.classList.contains('is-fullscreen') ? 'hidden' : '';
      expandBtn.textContent = on ? '↙' : '↗';
      expandBtn.title = on ? tx('collapse', 'Thu gọn bản đồ') : tx('expand', 'Expand — Mở rộng bản đồ');
      expandBtn.setAttribute('aria-label', expandBtn.title);
      expandBtn.setAttribute('aria-pressed', String(on));
      setTimeout(function () { map.invalidateSize(); }, 60);
    }
    expandBtn.addEventListener('click', function () {
      setMax(!section.classList.contains('is-max'));
    });
    document.getElementById('map-center-btn').addEventListener('click', function () {
      close();
      focusView();
    });

    // ===== Auto-play chuyên đề: bay qua từng điểm theo mốc thời gian
    // tăng dần, mở quick view và đọc thuyết minh (TTS + caption).
    var playBtn = document.getElementById('map-play-btn');
    var tourBar = document.getElementById('map-tour-bar');
    L.DomEvent.disableClickPropagation(playBtn);
    L.DomEvent.disableClickPropagation(tourBar);
    var tourYearEl = tourBar.querySelector('.map-tour-year');
    var tourTitleEl = tourBar.querySelector('.map-tour-title');
    var tourSubEl = tourBar.querySelector('.map-tour-sub');
    var tourProgEl = tourBar.querySelector('.map-tour-progress');
    var pauseBtn = tourBar.querySelector('[data-act="pause"]');
    var muteBtn = tourBar.querySelector('[data-act="mute"]');
    var synth = window.speechSynthesis || null;
    var tour = { on: false, paused: false, muted: false, stopNow: false, skip: false, endSpeech: null };
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isEn = (window.__athleteMapConfig || {}).lang !== (window.__athleteMapConfig || {}).defaultLang;

    // Chờ ms — dừng ngay khi stop, đóng băng khi pause.
    function tourSleep(ms) {
      return new Promise(function (resolve) {
        var left = ms, last = Date.now();
        var t = setInterval(function () {
          if (tour.stopNow || tour.skip) { clearInterval(t); resolve(); return; }
          var now = Date.now();
          if (!tour.paused) left -= now - last;
          last = now;
          if (left <= 0) { clearInterval(t); resolve(); }
        }, 120);
      });
    }

    // Đọc thuyết minh bằng Web Speech API; khi mute (hoặc trình duyệt
    // không có TTS) chờ theo độ dài câu. Resolve khi giọng đọc xong —
    // poll synth.speaking/pending thay vì timeout ước tính, vì nếu nhảy
    // sang bài tiếp trong khi giọng vẫn đang đọc thì màn hình sẽ đi
    // trước lời đọc một bài.
    function speak(text) {
      return new Promise(function (resolve) {
        if (!synth || tour.muted) {
          tourSleep(Math.min(Math.max(text.length * 85, 2600), 14000)).then(resolve);
          return;
        }
        var u = new SpeechSynthesisUtterance(text);
        u.lang = isEn ? 'en-US' : 'vi-VN';
        var prefix = u.lang.slice(0, 2);
        var voice = synth.getVoices().filter(function (v) {
          return v.lang && v.lang.slice(0, 2) === prefix;
        })[0];
        if (voice) u.voice = voice;
        var done = false;
        function fin() { if (!done) { done = true; clearInterval(t); tour.endSpeech = null; resolve(); } }
        tour.endSpeech = fin;
        u.onend = fin;
        u.onerror = fin;
        var started = false;
        u.onstart = function () { started = true; };
        var est = Math.min(Math.max(text.length * 90, 2500), 20000);
        var elapsed = 0, quiet = 0, lastResume = 0;
        var t = setInterval(function () {
          // Đóng băng đồng hồ khi pause: tránh hardTimeout nổ giữa chừng
          // và tránh resume() đè lên pause của user.
          if (tour.paused) return;
          elapsed += 500;
          if (tour.stopNow) { clearInterval(t); fin(); return; }
          if (synth.speaking || synth.pending) {
            quiet = 0;
          } else {
            // Voice chưa từng bắt đầu sau 4s → coi như lỗi, bỏ qua sớm
            // thay vì chờ hết est.
            if (!started && elapsed > 4000) { clearInterval(t); fin(); return; }
            // Đã quá thời lượng ước tính VÀ im lặng liên tục >=2s (4 tick)
            // mới coi là đọc xong — chống Chrome flap 'speaking' giữa câu
            // làm nhảy bài sớm trong khi giọng vẫn đang đọc.
            if (elapsed > est) {
              quiet++;
              if (quiet >= 4) { clearInterval(t); fin(); return; }
            }
          }
          if (elapsed > Math.max(60000, est * 5)) { clearInterval(t); fin(); return; }
          // Workaround lỗi Chrome cắt giọng sau ~15s với voice remote.
          if (elapsed - lastResume >= 10000 && synth.speaking) {
            lastResume = elapsed;
            try { synth.resume(); } catch (e) {}
          }
        }, 500);
        try { synth.speak(u); } catch (e) { fin(); }
      });
    }

    function cleanTourTitle(t) {
      return String(t || '').replace(/^\s*\[[^\]]*\]\s*:?\s*/, '');
    }

    // Mốc thời gian đọc trước nội dung: ưu tiên tour_marker dạng chữ
    // ("Qua nhiều thời kỳ"), sau đó "Ngày 7 tháng 5 năm 1954" / "Năm 1986".
    function tourMarker(d) {
      if (d.tourMarker) return d.tourMarker;
      if (!d.eventYear) return '';
      var dm = String(d.historyDate || '').split('-');
      if (dm.length === 2) {
        return tx('tour_date', 'Ngày %1 tháng %2 năm %3')
          .replace('%1', String(+dm[1])).replace('%2', String(+dm[0])).replace('%3', d.eventYear);
      }
      return tx('tour_year', 'Năm %1').replace('%1', d.eventYear);
    }

    // Lời thuyết minh: mốc thời gian + tour_note (văn riêng do tác giả
    // viết); không có tour_note thì ghép title + subtitle.
    function narrationOf(d) {
      var marker = tourMarker(d);
      var body;
      if (d.tourNote) body = d.tourNote;
      else {
        var name = d.kind === 'place' && d.title ? cleanTourTitle(d.title) : d.name;
        var bits = [name];
        var sub = d.subtitle || d.summary;
        if (sub) bits.push(sub);
        body = bits.join('. ');
      }
      // Note đã tự mở bằng đúng năm sự kiện thì không đọc lại mốc nữa.
      if (marker && d.eventYear && body.slice(0, 90).indexOf(String(d.eventYear)) === -1) {
        return marker + '. ' + body;
      }
      if (marker && !d.eventYear) return marker + '. ' + body;
      return body;
    }

    // Sắp xếp theo mốc thời gian tăng dần: năm sự kiện (hoặc mốc gần
    // nhất) → series_order (tác giả đánh số theo trình tự) →
    // history-date (MM-DD) → tên.
    function tourSortKey(en) {
      var d = en.d;
      return [
        d.sortYear || 99999,
        Number(d.seriesOrder) || 9999,
        String(d.historyDate || '99-99'),
        d.title || d.name || ''
      ];
    }
    function tourCompare(a, b) {
      var ka = tourSortKey(a), kb = tourSortKey(b);
      for (var i = 0; i < ka.length; i++) {
        if (ka[i] < kb[i]) return -1;
        if (ka[i] > kb[i]) return 1;
      }
      return 0;
    }

    function renderTourStop(d, idx, total) {
      var markerText = tourMarker(d);
      tourYearEl.textContent = markerText || cleanTourTitle(d.title) || d.name;
      tourTitleEl.textContent = markerText ? (cleanTourTitle(d.title) || d.name) : '';
      tourSubEl.textContent = d.subtitle || d.summary || '';
      tourProgEl.textContent = idx + '/' + total;
    }

    function startTour() {
      if (tour.on) return;
      var seq = entries.filter(function (en) { return en._vis !== false; }).sort(tourCompare);
      if (!seq.length) return;
      tour.on = true;
      tour.stopNow = false;
      tour.skip = false;
      tour.paused = false;
      tourBar.hidden = false;
      playBtn.innerHTML = '<span class="fas fa-stop" aria-hidden="true"></span>';
      playBtn.title = tx('stop_tour', 'Dừng phát');
      playBtn.setAttribute('aria-label', playBtn.title);
      playBtn.setAttribute('aria-pressed', 'true');
      runTour(seq);
    }

    function stopTour() {
      if (!tour.on) return;
      tour.stopNow = true;
      tour.on = false;
      if (tour.endSpeech) tour.endSpeech();
      if (synth) synth.cancel();
      tourBar.hidden = true;
      playBtn.innerHTML = '<span class="fas fa-play" aria-hidden="true"></span>';
      playBtn.title = tx('play_tour', 'Phát chuyên đề');
      playBtn.setAttribute('aria-label', playBtn.title);
      playBtn.setAttribute('aria-pressed', 'false');
    }

    function runTour(seq) {
      // Lời giới thiệu: thu nhỏ bản đồ về khung trọn chuyên đề rồi đọc
      // intro ("Chuyên đề X — N điểm theo mốc thời gian") trước điểm đầu.
      var seqBounds = L.latLngBounds(seq.map(function (en) { return en.marker.getLatLng(); }));
      var seriesBtn = seriesDrop && seriesDrop.querySelector('[data-series="' + activeSeries + '"]');
      var seriesName = seriesBtn ? seriesBtn.textContent.trim() : activeSeries;
      tourYearEl.textContent = seriesName;
      tourTitleEl.textContent = tx('showing', 'Đang hiện %1 điểm').replace('%1', seq.length);
      tourSubEl.textContent = '';
      tourProgEl.textContent = '';
      if (reducedMotion) map.fitBounds(seqBounds, { padding: [50, 50], animate: false });
      else map.flyToBounds(seqBounds, { padding: [50, 50], duration: 1.4, maxZoom: 6 });
      var intro = tx('tour_intro', 'Chuyên đề %1. Hành trình qua %2 điểm đến theo mốc thời gian tăng dần.')
        .replace('%1', seriesName).replace('%2', seq.length);
      speak(intro).then(function () {
        if (tour.stopNow) return;
        next();
      });

      var i = 0;
      function next() {
        if (tour.stopNow || i >= seq.length) { stopTour(); return; }
        tour.skip = false;
        var en = seq[i];
        renderTourStop(en.d, i + 1, seq.length);
        var ll = en.marker.getLatLng();
        var zoom = Math.max(map.getZoom(), 6);
        if (reducedMotion) map.setView(ll, zoom, { animate: false });
        else map.flyTo(ll, zoom, { duration: 1.5 });
        tourSleep(reducedMotion ? 400 : 1700).then(function () {
          if (tour.stopNow) return;
          if (tour.skip) { i++; next(); return; }
          openQuickview(en.d);
          return speak(narrationOf(en.d)).then(function () { return tourSleep(1000); });
        }).then(function () {
          if (tour.stopNow) return;
          i++;
          next();
        });
      }
      next();
    }

    playBtn.addEventListener('click', function () {
      if (tour.on) stopTour(); else startTour();
    });
    tourBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.map-tour-btn');
      if (!btn) return;
      var act = btn.dataset.act;
      if (act === 'stop') stopTour();
      else if (act === 'next') {
        // Nhảy sang điểm kế: cắt lời đọc hiện tại, cờ skip làm mọi
        // chờ đợi (bay + đọc) kết thúc ngay → next() đi tiếp.
        tour.skip = true;
        if (tour.paused && synth) { try { synth.resume(); } catch (e) {} }
        if (synth) synth.cancel();
        if (tour.endSpeech) tour.endSpeech();
      }
      else if (act === 'pause') {
        tour.paused = !tour.paused;
        if (synth) tour.paused ? synth.pause() : synth.resume();
        btn.innerHTML = '<span class="fas fa-' + (tour.paused ? 'play' : 'pause') + '" aria-hidden="true"></span>';
        btn.title = tx(tour.paused ? 'resume_tour' : 'pause_tour', tour.paused ? 'Tiếp tục' : 'Tạm dừng');
        btn.setAttribute('aria-label', btn.title);
      } else if (act === 'mute') {
        tour.muted = !tour.muted;
        if (tour.muted && synth) {
          synth.cancel();
          if (tour.endSpeech) tour.endSpeech();
        }
        btn.innerHTML = '<span class="fas fa-volume-' + (tour.muted ? 'mute' : 'up') + '" aria-hidden="true"></span>';
        btn.title = tx(tour.muted ? 'unmute_tour' : 'mute_tour', tour.muted ? 'Bật tiếng' : 'Tắt tiếng');
        btn.setAttribute('aria-label', btn.title);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !e.defaultPrevented && tour.on) {
        e.preventDefault();
        stopTour();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (fullscreenFallback) {
        fullscreenFallback = false;
        syncFullscreen();
      } else if (!document.fullscreenElement && section.classList.contains('is-max')) setMax(false);
    });

    // Đóng dropdown khi click ra ngoài
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.filter-drop')) {
        if (seriesDrop) seriesDrop.classList.remove('open');
      }
    });

    // Khôi phục filter lần trước (localStorage), fallback về default
    try {
      var saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null') || {};
      var f = ['all', 'Chuyên đề'].indexOf(saved.f) >= 0 ? saved.f : DEFAULT_FILTER;
      if (f === 'Chuyên đề' && !seriesDrop) f = 'all';
      if (saved.series && seriesDrop && seriesDrop.querySelector('[data-series="' + saved.series + '"]')) {
        activeSeries = saved.series;
        var seb = seriesDrop.querySelector('[data-series="' + saved.series + '"]');
        var allSeb = seriesDrop.querySelector('[data-series="all"]');
        if (allSeb) allSeb.classList.remove('drop-item-active');
        seb.classList.add('drop-item-active');
      }
      var initBtn = f === 'all' ? filterBar.querySelector('[data-filter="all"]')
        : seriesDrop && seriesDrop.querySelector(':scope > .home-tab');
      setMainFilter(f, initBtn); // căn khung nhìn theo filter đã lưu, giống bấm nút ◎
    } catch (e) {}
  }

  // Data pin nằm trong /map-pins.json (plugin map_pins_index.rb xuất):
  // fetch xong mới initMap — marker xuất hiện sau 1 nhịp thay vì nhúng
  // sẵn trong HTML như trước.
  function boot() {
    var cfg = window.__athleteMapConfig || {};
    if (!window.L || !cfg.pinsUrl || !window.MapPins) return;
    // Promise public để module khác (travel-spinner) chờ pins sẵn sàng
    window.__mapPinsReady = window.MapPins.load(cfg.pinsUrl, cfg);
    var loading = document.getElementById('map-loading');
    window.__mapPinsReady
      .then(function (pins) {
        if (loading) loading.remove();
        window.__athletePins = pins;
        initMap();
      })
      .catch(function () {
        if (loading) loading.remove();
        var S = window.__mapStrings || {};
        var el = document.getElementById('athlete-map');
        if (el) el.insertAdjacentHTML('beforeend',
          '<p class="map-load-error">' + (S.load_failed_pins || 'Không tải được dữ liệu bản đồ — thử tải lại trang.') + '</p>');
      });
  }

  if (window.L) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
