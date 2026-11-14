---
layout: page
title: ""
subtitle: ""
permalink: /series/lich-su-viet-nam/
---

<div class="series-page">
  {% assign series_posts = site.pages | where: "series", "Lịch sử Việt Nam" | sort: "series_order" %}
  <section class="series-hero" aria-labelledby="history-series-title">
    <div class="series-hero-copy">
      <p class="series-landing-kicker">Lịch sử Việt Nam · {{ series_posts.size }} bài</p>
      <h1 id="history-series-title">Những ngày<br><em>đáng nhớ.</em></h1>
      <p class="series-landing-intro">
        Sáu bài viết ngắn về những dấu mốc quan trọng trong lịch sử Việt Nam,
        được sắp xếp theo trình tự thời gian để dễ đọc và dễ ghi nhớ.
      </p>
      <a class="series-hero-button" href="#history-series-list">Xem các bài viết <span aria-hidden="true">→</span></a>
    </div>
    <div class="series-hero-aside" aria-label="Thông điệp của chuyên đề">
      <span class="series-hero-line" aria-hidden="true"></span>
      <p>Mỗi ngày lịch sử là một cánh cửa nhìn về quá khứ.</p>
      <span class="series-hero-caption">Đọc chậm · Nhớ đúng · Hiểu sâu</span>
    </div>
  </section>

  <section id="history-series-list" class="series-reading-list" aria-labelledby="history-series-list-title">
    <div class="series-section-heading">
      <div>
        <p class="series-landing-kicker">Mục lục</p>
        <h2 id="history-series-list-title">Sáu dấu mốc</h2>
      </div>
      <p>Đọc từ ngày thành lập Quân đội nhân dân Việt Nam đến ngày đất nước thống nhất.</p>
    </div>
    <ol class="series-post-list">
      {% for post in series_posts %}
      <li class="series-post-item">
        <a class="series-post-card" href="{{ post.url | relative_url }}">
          <span class="series-post-number">{{ post.series_order | prepend: "0" | slice: -2, 2 }}</span>
          <span class="series-post-content">
            <span class="series-post-label">Phần {{ post.series_order }}</span>
            <strong>{{ post.title }}</strong>
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
    <p>Lịch sử được nhớ bằng những con người và những ngày tháng cụ thể.</p>
    <span aria-hidden="true">—</span>
  </footer>
</div>
