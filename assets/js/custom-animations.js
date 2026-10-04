// Animation nhẹ cho trang: chạy 1 lần khi tải / khi cuộn tới, không loop.
(function () {
  "use strict";

  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
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

    // 3) Fade-in-up khi cuộn tới, chỉ chạy 1 lần cho mỗi phần tử.
    var revealTargets = document.querySelectorAll(
      ".landing-intro, .latest-heading, .posts-list > li, .post-container, .pagination.main-pager"
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
    document.querySelectorAll(".posts-list > li").forEach(function (li, i) {
      li.style.transitionDelay = Math.min(i * 90, 450) + "ms";
    });
  });
})();
