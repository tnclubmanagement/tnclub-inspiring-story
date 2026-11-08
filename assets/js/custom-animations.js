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
    return;
    var list = document.querySelector(".posts-list");
    if (!list) return;
    var items = Array.prototype.slice.call(list.children);
    if (items.length === 0) return;

    function columnsFor(w) {
      if (w >= 1000) return 3;
      if (w >= 640) return 2;
      return 1;
    }

    function layout() {
      var n = columnsFor(window.innerWidth);

      if (n === 1) {
        // 1 cột: giữ thứ tự gốc, không cần bọc thêm div/flex.
        list.classList.remove("js-masonry");
        items.forEach(function (item) {
          list.appendChild(item);
        });
        return;
      }

      list.classList.add("js-masonry");
      var cols = [];
      for (var i = 0; i < n; i++) {
        var col = document.createElement("div");
        col.className = "masonry-col";
        cols.push(col);
      }
      var heights = new Array(n).fill(0);
      items.forEach(function (item) {
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
  }

  function initHomeControls() {
    var list = document.querySelector(".posts-list");
    var search = document.querySelector("#home-post-search");
    var tagFilter = document.querySelector("#home-tag-filter");
    var resultCount = document.querySelector(".home-result-count");
    var emptyState = document.querySelector(".home-empty-state");
    var viewButtons = document.querySelectorAll(".home-view-btn");
    if (!list || !search || !tagFilter) return;

    function applyFilters() {
      var query = search.value.trim().toLowerCase();
      var tag = tagFilter.value;
      var visible = 0;
      list.querySelectorAll(":scope > .post-preview").forEach(function (card) {
        var title = (card.getAttribute("data-post-title") || "").toLowerCase();
        var tags = (card.getAttribute("data-post-tags") || "").split(",");
        var matches = (!query || title.indexOf(query) !== -1) && (!tag || tags.indexOf(tag) !== -1);
        card.hidden = !matches;
        if (matches) visible += 1;
      });
      if (resultCount) resultCount.textContent = visible + " câu chuyện";
      if (emptyState) emptyState.hidden = visible !== 0;
    }

    search.addEventListener("input", applyFilters);
    tagFilter.addEventListener("change", applyFilters);
    viewButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var mode = button.getAttribute("data-view");
        list.classList.remove("view-grid", "view-list", "view-table", "view-timeline");
        list.classList.add("view-" + mode);
        viewButtons.forEach(function (item) {
          var active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", active ? "true" : "false");
        });
      });
    });
    list.classList.add("view-grid");
    applyFilters();
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
    initMasonry();
    initHomeControls();
    initLazyImages();

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
