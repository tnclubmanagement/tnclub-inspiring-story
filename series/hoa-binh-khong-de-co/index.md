---
layout: page
title: "Hòa bình không dễ có"
subtitle: ""
permalink: /series/hoa-binh-khong-de-co/
---

<div class="series-page">
  {% assign series_posts = site.pages | where: "series", "Hòa bình không dễ có" | sort: "series_order" %}
  <section class="series-hero" aria-labelledby="series-title">
    <div class="series-hero-copy">
      <p class="series-landing-kicker">Chuyên đề lịch sử · {{ series_posts.size }} phần</p>
      <h1 id="series-title"><span class="series-hero-title-line">Hòa bình</span><br><em>không dễ có.</em></h1>
      <p class="series-landing-intro">
        Những câu chuyện về người lính, người dân, người mẹ và những người
        sống tiếp cùng ký ức. Không chỉ kể trận đánh, mà nhìn vào mất mát phía
        sau mỗi dấu mốc.
      </p>
      <a class="series-hero-button" href="#series-reading-list">Bắt đầu đọc <span aria-hidden="true">→</span></a>
    </div>
    <div class="series-hero-aside" aria-label="Thông điệp của chuyên đề">
      <span class="series-hero-line" aria-hidden="true"></span>
      <p>“Phía sau mỗi con số là một cái tên, một gia đình và một cuộc đời.”</p>
      <span class="series-hero-caption">Ghi nhớ để biết trân trọng hòa bình</span>
    </div>
    <img
      class="series-hero-image"
      src="{{ '/assets/img/series-peace.jpg' | relative_url }}"
      alt="Minh họa hành trình từ ký ức chiến tranh đến những ngày hòa bình"
      loading="lazy">
  </section>

  <section class="series-video" aria-labelledby="series-video-title">
    <p class="series-landing-kicker">Tư liệu liên quan</p>
    <h2 id="series-video-title">Hòa bình không dễ có</h2>
    <div class="gallery-video">
      <iframe
        src="https://www.youtube-nocookie.com/embed/4cSTibyaG8A"
        title="Video về chuyên đề Hòa bình không dễ có"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
    </div>
  </section>

  <section id="series-reading-list" class="series-reading-list" aria-labelledby="series-reading-title">
    <div class="series-section-heading">
      <div>
        <p class="series-landing-kicker">Mục lục</p>
        <h2 id="series-reading-title">Mười một chặng ký ức</h2>
      </div>
      <p>Đọc theo thứ tự để đi từ chiến trường đến những người ở lại.</p>
    </div>
    <ol class="series-post-list">
      {% for post in series_posts %}
      <li class="series-post-item">
        <a class="series-post-card" href="{{ post.url | relative_url }}">
          <span class="series-post-number">{{ post.series_order | prepend: "0" | slice: -2, 2 }}</span>
          <span class="series-post-content">
            <span class="series-post-label">Phần {{ post.series_order }}</span>
            <strong>{{ post.title | split: "] : " | last }}</strong>
            {% if post.subtitle %}<span class="series-post-subtitle">{{ post.subtitle }}</span>{% endif %}
          </span>
          <span class="series-post-arrow" aria-hidden="true">↗</span>
        </a>
      </li>
      {% endfor %}
    </ol>
  </section>

  <footer class="series-landing-footer">
    <span aria-hidden="true">—</span>
    <p>Viết về chiến tranh để hiểu hơn giá trị của những ngày bình yên.</p>
    <span aria-hidden="true">—</span>
  </footer>
</div>
