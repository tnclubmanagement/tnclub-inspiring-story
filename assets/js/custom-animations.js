// Animation nhẹ cho trang: chạy 1 lần khi tải / khi cuộn tới, không loop.
(function () {
  "use strict";

  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  // Masonry thật bằng JS: CSS `column-count` bị lỗi dồn hết item vào 1 cột
  // khi item cao + ít item (break-inside:avoid). Thay bằng thuật toán
  // "luôn bỏ vào cột đang thấp nhất", đo chiều cao thật.
  function initMasonry() {
    var list = document.querySelector(".posts-list");
    if (!list) return null;
    var header = list.querySelector(".posts-table-header");
    var items = Array.prototype.slice.call(list.querySelectorAll(".post-preview"));
    if (items.length === 0) return null;

    function restore() {
      list.classList.remove("js-masonry");
      list.innerHTML = "";
      if (header) list.appendChild(header);
      items.forEach(function (item) {
        list.appendChild(item);
      });
    }

    function columnsFor(w) {
      if (w >= 1000) return 3;
      if (w >= 640) return 2;
      return 1;
    }

    function layout() {
      var n = columnsFor(window.innerWidth);

      if (n === 1) {
        restore();
        return;
      }

      // Restore first so each card is measured at the current column width.
      restore();
      list.classList.add("js-masonry");
      var cols = [];
      for (var i = 0; i < n; i++) {
        var col = document.createElement("div");
        col.className = "masonry-col";
        cols.push(col);
      }
      var heights = new Array(n).fill(0);
      items.forEach(function (item) {
        if (item.hidden) return;
        var idx = 0;
        for (var i = 1; i < n; i++) {
          if (heights[i] < heights[idx]) idx = i;
        }
        cols[idx].appendChild(item);
        heights[idx] += item.offsetHeight + 28;
      });
      list.innerHTML = "";
      cols.forEach(function (col) {
        list.appendChild(col);
      });
    }

    layout();
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 200);
    });

    return { items: items, layout: layout, restore: restore };
  }

  function initHomeControls(masonry) {
    var list = document.querySelector(".posts-list");
    var search = document.querySelector("#home-post-search");
    var tagFilter = document.querySelector("#home-tag-filter");
    var tagOptions = tagFilter ? tagFilter.querySelectorAll("input[type=\"checkbox\"]") : [];
    var tagTrigger = tagFilter ? tagFilter.querySelector(".home-tag-filter-trigger") : null;
    var tagOptionsPanel = tagFilter ? tagFilter.querySelector(".home-tag-options") : null;
    var tagSummary = tagFilter ? tagFilter.querySelector(".home-tag-filter-summary") : null;
    var tagClear = tagFilter ? tagFilter.querySelector(".home-tag-clear") : null;
    var resultCount = document.querySelector(".home-result-count");
    var emptyState = document.querySelector(".home-empty-state");
    var viewButtons = document.querySelectorAll(".home-view-btn");
    if (!list || !search || !tagFilter) return;

    function setView(mode) {
      var validModes = ["grid", "list", "table", "timeline"];
      if (validModes.indexOf(mode) === -1) mode = "grid";
      list.classList.remove("view-grid", "view-list", "view-table", "view-timeline");
      list.classList.add("view-" + mode);
      if (masonry) {
        if (mode === "grid") masonry.layout();
        else masonry.restore();
      }
      viewButtons.forEach(function (item) {
        var active = item.getAttribute("data-view") === mode;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function updateUrl() {
      var params = new URLSearchParams(window.location.search);
      var query = search.value.trim();
      var tags = getSelectedTags();
      var mode = list.className.match(/view-(grid|list|table|timeline)/);
      if (query) params.set("q", query);
      else params.delete("q");
      if (tags.length) params.set("tag", tags.join(","));
      else params.delete("tag");
      if (mode && mode[1] !== "grid") params.set("view", mode[1]);
      else params.delete("view");
      var queryString = params.toString();
      var nextUrl = window.location.pathname + (queryString ? "?" + queryString : "") + window.location.hash;
      window.history.replaceState(null, "", nextUrl);
    }

    function getSelectedTags() {
      var selected = [];
      tagOptions.forEach(function (option) {
        if (option.checked) selected.push(option.value);
      });
      return selected;
    }

    function updateTagSummary() {
      var selected = getSelectedTags();
      if (tagSummary) {
        tagSummary.textContent = selected.length ? selected.length + " đã chọn" : "Tất cả";
      }
    }

    function applyFilters(shouldUpdateUrl) {
      var query = search.value.trim().toLowerCase();
      var selectedTags = getSelectedTags();
      var visible = 0;
      var cards = masonry ? masonry.items : list.querySelectorAll(".post-preview");
      cards.forEach(function (card) {
        var title = (card.getAttribute("data-post-title") || "").toLowerCase();
        var tags = (card.getAttribute("data-post-tags") || "").split(",");
        var matches = (!query || title.indexOf(query) !== -1) &&
          (!selectedTags.length || selectedTags.some(function (tag) {
            return tags.indexOf(tag) !== -1;
          }));
        card.hidden = !matches;
        if (matches) visible += 1;
      });
      updateTagSummary();
      if (resultCount) resultCount.textContent = visible + " câu chuyện";
      if (emptyState) emptyState.hidden = visible !== 0;
      if (masonry && list.classList.contains("view-grid")) masonry.layout();
      if (shouldUpdateUrl) updateUrl();
    }

    function restoreFromUrl() {
      var params = new URLSearchParams(window.location.search);
      search.value = params.get("q") || "";
      var selectedTags = (params.get("tag") || "").split(",").filter(Boolean);
      tagOptions.forEach(function (option) {
        option.checked = selectedTags.indexOf(option.value) !== -1;
      });
      setView(params.get("view") || "grid");
      applyFilters(false);
    }

    search.addEventListener("input", function () { applyFilters(true); });
    tagOptions.forEach(function (option) {
      option.addEventListener("change", function () { applyFilters(true); });
    });
    if (tagClear) {
      tagClear.addEventListener("click", function () {
        tagOptions.forEach(function (option) { option.checked = false; });
        applyFilters(true);
      });
    }
    if (tagTrigger) {
      tagTrigger.addEventListener("click", function () {
        var expanded = tagOptionsPanel.hidden;
        tagOptionsPanel.hidden = !expanded;
        tagTrigger.setAttribute("aria-expanded", expanded ? "true" : "false");
      });
    }
    viewButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setView(button.getAttribute("data-view"));
        updateUrl();
      });
    });
    window.addEventListener("popstate", restoreFromUrl);
    restoreFromUrl();
  }

  function initLazyImages() {
    var images = document.querySelectorAll("img.lazy-image[data-src]");
    if (images.length === 0) return;

    function load(image) {
      var source = image.getAttribute("data-src");
      if (!source) return;
      image.src = source;
      image.removeAttribute("data-src");
      image.classList.add("is-loaded");
    }

    if (!("IntersectionObserver" in window)) {
      images.forEach(load);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          load(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "300px 0px" });
    images.forEach(function (image) { observer.observe(image); });
  }

  function initRelativeDates() {
    document.querySelectorAll(".relative-date[data-date]").forEach(function (element) {
      var publishedAt = new Date(element.getAttribute("data-date"));
      if (Number.isNaN(publishedAt.getTime())) return;

      var diffDays = Math.floor((Date.now() - publishedAt.getTime()) / 86400000);
      if (diffDays <= 0) {
        element.textContent = "Hôm nay";
      } else if (diffDays < 30) {
        element.textContent = diffDays + " ngày trước";
      } else if (diffDays < 365) {
        element.textContent = Math.floor(diffDays / 30) + " tháng trước";
      } else {
        element.textContent = Math.floor(diffDays / 365) + " năm trước";
      }
    });
  }

  function initStoryGalleries() {
    document.querySelectorAll(".story-gallery").forEach(function (gallery) {
      var slides = gallery.querySelectorAll(".story-slide");
      var dots = gallery.querySelector(".story-gallery-dots");
      var current = 0;
      if (slides.length < 2 || !dots) return;

      function show(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          var active = i === current;
          slide.classList.toggle("is-active", active);
          slide.setAttribute("aria-hidden", active ? "false" : "true");
        });
        dots.querySelectorAll("button").forEach(function (dot, i) {
          dot.classList.toggle("is-active", i === current);
          dot.setAttribute("aria-selected", i === current ? "true" : "false");
        });
      }

      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Hiển thị hình " + (i + 1));
        dot.setAttribute("role", "tab");
        dot.addEventListener("click", function () { show(i); });
        dots.appendChild(dot);
      });
      gallery.querySelector(".story-gallery-prev").addEventListener("click", function () { show(current - 1); });
      gallery.querySelector(".story-gallery-next").addEventListener("click", function () { show(current + 1); });
      show(0);
    });
  }

  onReady(function () {
    // 1) Hero: chọn ngẫu nhiên 1 trong các ảnh (window.HERO_IMAGES, tránh lặp
    // lại ảnh vừa xem lần trước), rồi zoom nhẹ 1 lần (Ken Burns), không lặp.
    var hero = document.querySelector(".header-section.has-img .big-img.intro-header");
    if (hero) {
      var images = window.HERO_IMAGES;
      if (Array.isArray(images) && images.length > 0) {
        var prev = sessionStorage.getItem("heroImagePrev");
        var choices = images.length > 1 ? images.filter(function (src) { return src !== prev; }) : images;
        var chosen = choices[Math.floor(Math.random() * choices.length)];
        hero.style.backgroundImage = 'url("' + chosen + '")';
        sessionStorage.setItem("heroImagePrev", chosen);
      }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          hero.classList.add("kenburns-settle");
        });
      });
    }

    // 2) Khối màu nền: "trôi" vào đúng vị trí 1 lần khi tải trang.
    var blobs = document.createElement("div");
    blobs.id = "bg-blobs";
    blobs.setAttribute("aria-hidden", "true");
    var specs = [
      { color: "rgba(255,122,138,0.5)", top: "8%", left: "8%", size: "26vw", dx: "-10vw", dy: "-8vh" },
      { color: "rgba(90,169,255,0.5)", top: "6%", left: "82%", size: "26vw", dx: "10vw", dy: "-8vh" },
      { color: "rgba(74,214,168,0.45)", top: "74%", left: "78%", size: "24vw", dx: "10vw", dy: "8vh" },
      { color: "rgba(255,199,112,0.45)", top: "80%", left: "10%", size: "24vw", dx: "-10vw", dy: "8vh" },
      { color: "rgba(190,150,255,0.35)", top: "42%", left: "48%", size: "30vw", dx: "0", dy: "6vh" }
    ];
    specs.forEach(function (s) {
      var blob = document.createElement("span");
      blob.className = "bg-blob";
      blob.style.setProperty("--blob-color", s.color);
      blob.style.setProperty("--blob-top", s.top);
      blob.style.setProperty("--blob-left", s.left);
      blob.style.setProperty("--blob-size", s.size);
      blob.style.setProperty("--blob-dx", s.dx);
      blob.style.setProperty("--blob-dy", s.dy);
      blobs.appendChild(blob);
    });
    document.body.prepend(blobs);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        blobs.classList.add("settled");
      });
    });

    // 3) Masonry thật cho danh sách bài viết (phải chạy trước khi gắn
    // reveal/stagger vì nó di chuyển các <li> sang cấu trúc cột mới).
    var masonry = initMasonry();
    initHomeControls(masonry);
    initLazyImages();
    initRelativeDates();
    initStoryGalleries();

    // 4) Fade-in-up khi cuộn tới, chỉ chạy 1 lần cho mỗi phần tử.
    // Lưu ý: phải dùng "li.post-preview" (không phải "li" trống) để không
    // bắt luôn các <li> nhỏ của danh sách tag bên trong mỗi card.
    var revealTargets = document.querySelectorAll(
      ".landing-intro, .latest-heading, .posts-list li.post-preview, .post-container, .pagination.main-pager"
    );
    revealTargets.forEach(function (el) {
      el.classList.add("reveal");
    });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealTargets.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Không hỗ trợ IntersectionObserver: hiện luôn, không animate.
      revealTargets.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }

    // Stagger nhẹ cho các card trong lưới masonry.
    document.querySelectorAll(".posts-list li.post-preview").forEach(function (li, i) {
      li.style.transitionDelay = Math.min(i * 90, 450) + "ms";
    });
  });
})();
