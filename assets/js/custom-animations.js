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
    var tagClose = tagFilter ? tagFilter.querySelector(".home-tag-close") : null;
    var tagSearch = tagFilter ? tagFilter.querySelector(".home-tag-search") : null;
    var seriesFilter = document.querySelector("#home-series-select");
    var groupSeries = document.querySelector("#home-group-series");
    var collapsedSeries = {};
    var clearSearch = document.querySelector("#home-search-clear");
    var resultCount = document.querySelector(".home-result-count");
    var emptyState = document.querySelector(".home-empty-state");
    var viewButtons = document.querySelectorAll(".home-view-btn");
    if (!list || !search || !tagFilter) return;

    function getSeriesGroups() {
      var groups = [];
      var byKey = {};
      masonry.items.forEach(function (card, index) {
        var key = card.getAttribute("data-post-series") || "Bài viết độc lập";
        if (!byKey[key]) {
          byKey[key] = {
            key: key,
            slug: card.getAttribute("data-post-series-key") || "",
            url: card.getAttribute("data-post-series-url") || "",
            items: [],
            firstIndex: index
          };
          groups.push(byKey[key]);
        }
        byKey[key].items.push(card);
      });
      groups.forEach(function (group) {
        if (group.slug) {
          group.items.sort(function (first, second) {
            return parseInt(first.getAttribute("data-post-series-order") || "9999", 10) -
              parseInt(second.getAttribute("data-post-series-order") || "9999", 10);
          });
        }
      });
      return groups;
    }

    function renderSeriesGroups() {
      if (!masonry) return;
      masonry.restore();
      masonry.items.forEach(function (item) {
        item.classList.remove("is-series-collapsed");
      });
      if (!groupSeries || !groupSeries.checked) return;

      var groups = getSeriesGroups();
      groups.forEach(function (group) {
        var visibleItems = group.items.filter(function (item) { return !item.hidden; });
        if (!visibleItems.length) return;

        var heading = document.createElement("li");
        heading.className = "post-series-heading";
        var headingContent = document.createElement("div");
        headingContent.className = "post-series-heading-content";
        var toggle = document.createElement("button");
        toggle.className = "post-series-collapse";
        toggle.type = "button";
        toggle.setAttribute("data-series-key", group.slug);
        toggle.setAttribute("aria-expanded", collapsedSeries[group.slug] ? "false" : "true");
        toggle.setAttribute("aria-label", (collapsedSeries[group.slug] ? "Mở " : "Thu gọn ") + group.key);
        var label = document.createElement("span");
        label.className = "post-series-heading-label";
        label.textContent = group.key;
        var icon = document.createElement("span");
        icon.className = "post-series-collapse-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = collapsedSeries[group.slug] ? "+" : "−";
        toggle.appendChild(label);
        toggle.appendChild(icon);
        headingContent.appendChild(toggle);
        if (group.url) {
          var openSeries = document.createElement("a");
          openSeries.className = "post-series-open";
          openSeries.href = group.url;
          openSeries.textContent = "Mở series ↗";
          openSeries.setAttribute("aria-label", "Mở series " + group.key);
          headingContent.appendChild(openSeries);
        }
        heading.appendChild(headingContent);
        list.appendChild(heading);
        group.items.forEach(function (item) {
          item.classList.toggle("is-series-collapsed", Boolean(collapsedSeries[group.slug]));
          list.appendChild(item);
        });
      });
    }

    function setView(mode) {
      var validModes = ["grid", "list", "table", "timeline"];
      if (validModes.indexOf(mode) === -1) mode = "grid";
      list.classList.remove("view-grid", "view-list", "view-table", "view-timeline");
      list.classList.add("view-" + mode);
      if (masonry) {
        if (mode === "grid" && (!groupSeries || !groupSeries.checked)) masonry.layout();
        else masonry.restore();
      }
      renderSeriesGroups();
      if (masonry && mode === "grid" && (!groupSeries || !groupSeries.checked)) masonry.layout();
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
      var series = seriesFilter ? seriesFilter.value : "";
      var mode = list.className.match(/view-(grid|list|table|timeline)/);
      if (query) params.set("q", query);
      else params.delete("q");
      if (tags.length) params.set("tag", tags.join(","));
      else params.delete("tag");
      if (series) params.set("series", series);
      else params.delete("series");
      if (groupSeries && !groupSeries.checked) params.set("group", "0");
      else params.delete("group");
      var collapsed = Object.keys(collapsedSeries);
      if (collapsed.length) params.set("collapsed", collapsed.join(","));
      else params.delete("collapsed");
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

    function getCollapsedSeriesFromUrl(params) {
      collapsedSeries = {};
      (params.get("collapsed") || "").split(",").filter(Boolean).forEach(function (key) {
        collapsedSeries[key] = true;
      });
    }

    function updateTagSummary() {
      var selected = getSelectedTags();
      if (tagSummary) {
        tagSummary.textContent = selected.length ? selected.length + " đã chọn" : "Tất cả";
      }
    }

    function updateSearchUi() {
      if (clearSearch) clearSearch.hidden = !search.value.trim();
    }

    function applyFilters(shouldUpdateUrl) {
      var query = search.value.trim().toLowerCase();
      var selectedTags = getSelectedTags();
      var selectedSeries = seriesFilter ? seriesFilter.value : "";
      var visible = 0;
      var cards = masonry ? masonry.items : list.querySelectorAll(".post-preview");
      cards.forEach(function (card) {
        var searchableText = (card.getAttribute("data-post-search") || card.getAttribute("data-post-title") || "").toLowerCase();
        var tags = (card.getAttribute("data-post-tags") || "").split(",");
        var series = card.getAttribute("data-post-series-key") || "";
        var matches = (!query || searchableText.indexOf(query) !== -1) &&
          (!selectedTags.length || selectedTags.some(function (tag) {
            return tags.indexOf(tag) !== -1;
          })) &&
          (!selectedSeries || series === selectedSeries);
        card.hidden = !matches;
        if (matches) visible += 1;
      });
      updateTagSummary();
      updateSearchUi();
      if (resultCount) resultCount.textContent = visible + " câu chuyện";
      if (emptyState) emptyState.hidden = visible !== 0;
      renderSeriesGroups();
      if (masonry && list.classList.contains("view-grid") && (!groupSeries || !groupSeries.checked)) masonry.layout();
      if (shouldUpdateUrl) updateUrl();
    }

    function restoreFromUrl() {
      var params = new URLSearchParams(window.location.search);
      search.value = params.get("q") || "";
      var selectedTags = (params.get("tag") || "").split(",").filter(Boolean);
      if (seriesFilter) seriesFilter.value = params.get("series") || "";
      if (groupSeries) groupSeries.checked = params.get("group") !== "0";
      getCollapsedSeriesFromUrl(params);
      tagOptions.forEach(function (option) {
        option.checked = selectedTags.indexOf(option.value) !== -1;
      });
      setView(params.get("view") || "grid");
      applyFilters(false);
    }

    search.addEventListener("input", function () { applyFilters(true); });
    if (clearSearch) {
      clearSearch.addEventListener("click", function () {
        search.value = "";
        search.focus();
        applyFilters(true);
      });
    }
    tagOptions.forEach(function (option) {
      option.addEventListener("change", function () { applyFilters(true); });
    });
    if (seriesFilter) {
      seriesFilter.addEventListener("change", function () { applyFilters(true); });
    }
    if (groupSeries) {
      groupSeries.addEventListener("change", function () { applyFilters(true); });
    }
    if (tagClear) {
      tagClear.addEventListener("click", function () {
        tagOptions.forEach(function (option) { option.checked = false; });
        applyFilters(true);
      });
    }
    if (tagSearch) {
      tagSearch.addEventListener("input", function () {
        var query = tagSearch.value.trim().toLowerCase();
        tagFilter.querySelectorAll(".home-tag-option").forEach(function (option) {
          option.hidden = option.textContent.trim().toLowerCase().indexOf(query) === -1;
        });
      });
    }
    if (tagTrigger) {
      tagTrigger.addEventListener("click", function () {
        if (!tagOptionsPanel.open) {
          tagOptionsPanel.showModal();
          tagTrigger.setAttribute("aria-expanded", "true");
          if (tagSearch) tagSearch.focus();
        }
      });
    }
    if (tagClose) tagClose.addEventListener("click", function () { tagOptionsPanel.close(); });
    tagOptionsPanel.addEventListener("close", function () {
      tagTrigger.setAttribute("aria-expanded", "false");
      if (tagSearch) {
        tagSearch.value = "";
        tagFilter.querySelectorAll(".home-tag-option").forEach(function (option) {
          option.hidden = false;
        });
      }
    });
    viewButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setView(button.getAttribute("data-view"));
        updateUrl();
      });
    });
    list.addEventListener("click", function (event) {
      var toggle = event.target.closest(".post-series-collapse");
      if (!toggle) return;
      var key = toggle.getAttribute("data-series-key");
      if (!key) return;
      if (collapsedSeries[key]) delete collapsedSeries[key];
      else collapsedSeries[key] = true;
      renderSeriesGroups();
      if (list.classList.contains("view-grid") && (!groupSeries || !groupSeries.checked)) masonry.layout();
      updateUrl();
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
    var lightbox = document.getElementById("story-lightbox");
    if (!lightbox) {
      lightbox = document.createElement("dialog");
      lightbox.id = "story-lightbox";
      lightbox.className = "story-lightbox";
      lightbox.innerHTML = '<button class="story-lightbox-close" type="button" aria-label="Đóng ảnh">×</button><button class="story-lightbox-prev" type="button" aria-label="Ảnh trước">←</button><figure><img class="story-lightbox-image" alt=""><figcaption></figcaption></figure><button class="story-lightbox-next" type="button" aria-label="Ảnh tiếp theo">→</button>';
      document.body.appendChild(lightbox);
    }
    var lightboxImage = lightbox.querySelector(".story-lightbox-image");
    var lightboxCaption = lightbox.querySelector("figcaption");
    var activeGallery;
    var activeIndex = 0;

    function closeLightbox() {
      if (lightbox.open) lightbox.close();
    }

    function showLightbox(index) {
      if (!activeGallery) return;
      var slides = activeGallery.querySelectorAll(".story-slide");
      activeIndex = (index + slides.length) % slides.length;
      var image = slides[activeIndex].querySelector("img");
      var caption = slides[activeIndex].querySelector("figcaption");
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt || "";
      lightboxCaption.innerHTML = caption ? caption.innerHTML : "";
      if (!lightbox.open) lightbox.showModal();
    }

    lightbox.querySelector(".story-lightbox-close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".story-lightbox-prev").addEventListener("click", function () { showLightbox(activeIndex - 1); });
    lightbox.querySelector(".story-lightbox-next").addEventListener("click", function () { showLightbox(activeIndex + 1); });
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (event) {
      if (!lightbox.open) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showLightbox(activeIndex - 1);
      if (event.key === "ArrowRight") showLightbox(activeIndex + 1);
    });

    document.querySelectorAll(".story-gallery").forEach(function (gallery) {
      var slides = gallery.querySelectorAll(".story-slide");
      var dots = gallery.querySelector(".story-gallery-dots");
      var current = 0;
      if (!slides.length || !dots) return;

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
      slides.forEach(function (slide, i) {
        var image = slide.querySelector("img");
        if (!image) return;
        image.classList.add("story-gallery-zoomable");
        image.setAttribute("tabindex", "0");
        image.setAttribute("role", "button");
        image.setAttribute("aria-label", "Mở ảnh lớn: " + (image.alt || "ảnh tư liệu"));
        image.addEventListener("click", function () {
          activeGallery = gallery;
          showLightbox(i);
        });
        image.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            activeGallery = gallery;
            showLightbox(i);
          }
        });
      });
      show(0);
    });
  }

  function initReadingTools() {
    var root = document.documentElement;
    var savedTheme = window.localStorage.getItem("inspiring-theme");
    var themeButton = document.createElement("button");
    themeButton.className = "theme-toggle";
    themeButton.type = "button";
    themeButton.setAttribute("aria-label", "Đổi giao diện sáng tối");
    themeButton.textContent = savedTheme === "dark" ? "☀" : "☾";
    if (savedTheme) root.dataset.theme = savedTheme;
    themeButton.addEventListener("click", function () {
      var next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      window.localStorage.setItem("inspiring-theme", next);
      themeButton.textContent = next === "dark" ? "☀" : "☾";
    });
    document.body.appendChild(themeButton);

    var button = document.querySelector(".post-audio-toggle");
    var article = document.querySelector(".post-body");
    if (!button || !article || !("speechSynthesis" in window)) return;
    var utterance;
    var voices = [];
    function loadVoices() {
      voices = window.speechSynthesis.getVoices();
    }
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    button.addEventListener("click", function () {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        button.setAttribute("aria-pressed", "false");
        button.innerHTML = '<span aria-hidden="true">▶</span> Đọc bài';
        return;
      }
      var vietnameseVoice = voices.find(function (voice) {
        return voice.lang && voice.lang.toLowerCase().indexOf("vi") === 0;
      });
      if (!vietnameseVoice) {
        button.textContent = "Chưa có giọng Việt";
        button.title = "Hãy cài hoặc bật một giọng đọc tiếng Việt trong hệ điều hành";
        return;
      }
      var readable = article.cloneNode(true);
      readable.querySelectorAll("a, .story-gallery, .post-reading-tools").forEach(function (element) {
        element.remove();
      });
      utterance = new SpeechSynthesisUtterance(readable.innerText.replace(/\s+/g, " ").trim());
      utterance.lang = "vi-VN";
      utterance.voice = vietnameseVoice;
      utterance.onend = function () {
        button.setAttribute("aria-pressed", "false");
        button.innerHTML = '<span aria-hidden="true">▶</span> Đọc bài';
      };
      button.setAttribute("aria-pressed", "true");
      button.innerHTML = '<span aria-hidden="true">■</span> Dừng đọc';
      window.speechSynthesis.speak(utterance);
    });
  }

  function initSeriesTitles() {
    document.querySelectorAll(".post-heading h1, .page-heading h1").forEach(function (heading) {
      var title = heading.textContent.trim();
      var separator = title.indexOf("] : ");
      if (separator === -1 || heading.querySelector(".series-title-name")) return;

      var prefix = title.slice(0, separator + 1);
      var name = title.slice(separator + 4);
      heading.textContent = "";

      var prefixElement = document.createElement("span");
      prefixElement.className = "series-title-prefix";
      prefixElement.textContent = prefix;

      var nameElement = document.createElement("span");
      nameElement.className = "series-title-name";
      nameElement.textContent = name;

      heading.appendChild(prefixElement);
      heading.appendChild(nameElement);
    });
  }

  function initHistoryCalendar() {
    var section = document.querySelector(".history-calendar-section");
    var data = document.querySelector("#history-events-data");
    var days = document.querySelector("#history-calendar-days");
    var monthLabel = document.querySelector("#history-calendar-month");
    var selectedLabel = document.querySelector("#history-selected-label");
    var eventList = document.querySelector("#history-event-list");
    var todayButton = document.querySelector("#history-today-button");
    var previousButton = document.querySelector("#history-prev-month");
    var nextButton = document.querySelector("#history-next-month");
    if (!section || !data || !days || !monthLabel || !selectedLabel || !eventList) return;

    var events;
    try {
      events = JSON.parse(data.textContent || "[]");
    } catch (error) {
      events = [];
    }
    var now = new Date();
    var selected = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var visibleMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
    var monthFormatter = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" });
    var dateFormatter = new Intl.DateTimeFormat("vi-VN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });

    function dateKey(month, day) {
      return String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    }

    function eventsFor(date) {
      var key = dateKey(date.getMonth(), date.getDate());
      return events.filter(function (event) { return event.date === key; });
    }

    function renderEvents() {
      var selectedEvents = eventsFor(selected);
      var isToday = selected.toDateString() === now.toDateString();
      selectedLabel.textContent = isToday ? "Hôm nay trong lịch sử" : dateFormatter.format(selected);
      eventList.innerHTML = "";

      if (!selectedEvents.length) {
        var empty = document.createElement("p");
        empty.className = "history-events-empty";
        empty.textContent = isToday
          ? "Chưa có sự kiện được thêm cho ngày hôm nay."
          : "Chưa có sự kiện được ghi nhận cho ngày này.";
        eventList.appendChild(empty);
        return;
      }

      selectedEvents.forEach(function (event) {
        var card = document.createElement("article");
        card.className = "history-event-card";

        var year = document.createElement("span");
        year.className = "history-event-year";
        year.textContent = event.year;
        card.appendChild(year);

        var title = document.createElement("h4");
        if (event.url) {
          var titleLink = document.createElement("a");
          titleLink.href = event.url;
          titleLink.textContent = event.title;
          title.appendChild(titleLink);
        } else {
          title.textContent = event.title;
        }
        card.appendChild(title);

        var description = document.createElement("p");
        description.textContent = event.description;
        card.appendChild(description);

        var source = document.createElement("small");
        source.textContent = "Nguồn: " + event.source;
        card.appendChild(source);
        eventList.appendChild(card);
      });
    }

    function renderCalendar() {
      var year = visibleMonth.getFullYear();
      var month = visibleMonth.getMonth();
      var firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
      var daysInMonth = new Date(year, month + 1, 0).getDate();
      var selectedKey = selected.getFullYear() + "-" + selected.getMonth() + "-" + selected.getDate();
      monthLabel.textContent = monthFormatter.format(visibleMonth);
      days.innerHTML = "";

      for (var blank = 0; blank < firstDay; blank += 1) {
        var spacer = document.createElement("span");
        spacer.className = "history-calendar-spacer";
        spacer.setAttribute("aria-hidden", "true");
        days.appendChild(spacer);
      }

      for (var day = 1; day <= daysInMonth; day += 1) {
        var date = new Date(year, month, day);
        var button = document.createElement("button");
        var key = year + "-" + month + "-" + day;
        var hasEvents = eventsFor(date).length > 0;
        button.type = "button";
        button.className = "history-calendar-day";
        button.textContent = day;
        button.setAttribute("role", "gridcell");
        button.setAttribute("aria-label", dateFormatter.format(date));
        button.setAttribute("aria-pressed", key === selectedKey ? "true" : "false");
        button.classList.toggle("is-selected", key === selectedKey);
        button.classList.toggle("has-events", hasEvents);
        button.addEventListener("click", function (event) {
          selected = new Date(year, month, Number(event.currentTarget.textContent));
          renderCalendar();
          renderEvents();
        });
        days.appendChild(button);
      }
    }

    if (previousButton) {
      previousButton.addEventListener("click", function () {
        visibleMonth.setMonth(visibleMonth.getMonth() - 1);
        renderCalendar();
      });
    }
    if (nextButton) {
      nextButton.addEventListener("click", function () {
        visibleMonth.setMonth(visibleMonth.getMonth() + 1);
        renderCalendar();
      });
    }
    if (todayButton) {
      todayButton.addEventListener("click", function () {
        selected = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        visibleMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
        renderCalendar();
        renderEvents();
      });
    }

    renderCalendar();
    renderEvents();
  }

  function initFeaturedStories() {
    var section = document.querySelector(".featured-stories");
    if (!section) return;
    var filters = section.querySelectorAll(".featured-filter");
    var cards = Array.prototype.slice.call(section.querySelectorAll(".featured-story-card"));

    function select(tag) {
      var selectedTags = tag.split(",");
      var shown = 0;
      cards.forEach(function (card) {
        var cardTags = card.getAttribute("data-featured-tags").split(",");
        var matches = selectedTags.some(function (selectedTag) {
          return cardTags.indexOf(selectedTag) !== -1;
        });
        card.hidden = !matches || shown >= 4;
        if (matches && shown < 4) shown += 1;
      });
      filters.forEach(function (filter) {
        var active = filter.getAttribute("data-featured-tag") === tag;
        filter.classList.toggle("is-active", active);
        filter.setAttribute("aria-selected", active ? "true" : "false");
      });
    }

    filters.forEach(function (filter) {
      filter.addEventListener("click", function () {
        select(filter.getAttribute("data-featured-tag"));
      });
    });
    select("phap-hoa");
  }

  function initHomeSectionDots() {
    var sections = document.querySelectorAll("[data-home-section]");
    var dots = document.querySelectorAll("[data-home-dot]");
    if (!sections.length || !dots.length) return;

    var ticking = false;
    function update() {
      var marker = window.innerHeight * 0.35;
      var current = sections[0].getAttribute("data-home-section");
      sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= marker) {
          current = section.getAttribute("data-home-section");
        }
      });
      dots.forEach(function (dot) {
        var active = dot.getAttribute("data-home-dot") === current;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-current", active ? "true" : "false");
      });
      ticking = false;
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
  }

  onReady(function () {
    // 1) Hero: chọn ảnh ngẫu nhiên rồi chuyển ảnh chậm, tránh gây xao nhãng.
    var hero = document.querySelector(".header-section.has-img .big-img.intro-header");
    if (hero) {
      var headerImages = document.querySelector("#header-big-imgs");
      var images = window.HERO_IMAGES;
      if (!Array.isArray(images) && headerImages) {
        images = [];
        var imageCount = parseInt(headerImages.getAttribute("data-num-img") || "0", 10);
        for (var imageIndex = 1; imageIndex <= imageCount; imageIndex++) {
          var imageSource = headerImages.getAttribute("data-img-src-" + imageIndex);
          if (imageSource) images.push(imageSource);
        }
      }
      images = Array.isArray(images) ? images.map(function (source) {
        try {
          var parsed = new URL(source, window.location.href);
          if (parsed.hostname === "tnclubmanagement.github.io") {
            return parsed.pathname + parsed.search;
          }
        } catch (error) {
          return source;
        }
        return source;
      }) : images;
      if (Array.isArray(images) && images.length > 0) {
        var prev = sessionStorage.getItem("heroImagePrev");
        var choices = images.length > 1 ? images.filter(function (src) { return src !== prev; }) : images;
        var chosen = choices[Math.floor(Math.random() * choices.length)];
        hero.style.backgroundImage = 'url("' + chosen + '")';
        sessionStorage.setItem("heroImagePrev", chosen);

        if (images.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          var currentIndex = images.indexOf(chosen);
          window.setInterval(function () {
            currentIndex = (currentIndex + 1) % images.length;
            var next = document.createElement("span");
            next.className = "hero-slide-layer";
            next.style.backgroundImage = 'url("' + images[currentIndex] + '")';
            hero.appendChild(next);
            requestAnimationFrame(function () {
              next.classList.add("is-visible");
            });
            window.setTimeout(function () {
              hero.style.backgroundImage = 'url("' + images[currentIndex] + '")';
              next.remove();
            }, 950);
          }, 7000);
        }
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
    initReadingTools();
    initSeriesTitles();
    initHistoryCalendar();
    initFeaturedStories();
    initHomeSectionDots();

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
