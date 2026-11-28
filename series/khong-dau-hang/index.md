---
layout: page
title: "Không đầu hàng"
subtitle: ""
permalink: /series/khong-dau-hang/
---

<div class="series-page">
  {% assign series_posts = site.pages | where: "series", "Không đầu hàng" | sort: "series_order" %}
  <section class="series-hero" aria-labelledby="khong-dau-hang-series-title">
    <div class="series-hero-copy">
      <p class="series-landing-kicker">Câu chuyện truyền cảm hứng · {{ series_posts.size }} bài</p>
      <h1 id="khong-dau-hang-series-title"><span class="series-hero-title-line">Không</span><br><em>đầu hàng.</em></h1>
      <p class="series-landing-intro">
        {{ series_posts.size }} câu chuyện từ Trung Quốc và Việt Nam về những con người
        đi qua thiếu thốn, bệnh tật và nghịch cảnh — cùng sự đồng hành giúp họ đi tiếp.
      </p>
      <a class="series-hero-button" href="#khong-dau-hang-series-list">Xem các bài viết <span aria-hidden="true">→</span></a>
    </div>
    <div class="series-hero-aside" aria-label="Thông điệp của chuyên đề">
      <span class="series-hero-line" aria-hidden="true"></span>
      <p>Một hoàn cảnh khó khăn không thể quyết định cả cuộc đời.</p>
      <span class="series-hero-caption">Đọc chậm · Giữ lấy ước mơ</span>
    </div>
  </section>

  <section id="khong-dau-hang-series-list" class="series-reading-list" aria-labelledby="khong-dau-hang-series-list-title">
    <div class="series-section-heading">
      <div>
        <p class="series-landing-kicker">Mục lục</p>
        <h2 id="khong-dau-hang-series-list-title">{{ series_posts.size }} câu chuyện</h2>
      </div>
      <p>Những con người đã biến nghịch cảnh thành động lực để đi tiếp.</p>
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
    <p>Không phải ai cũng bắt đầu từ cùng một vạch xuất phát.</p>
    <span aria-hidden="true">—</span>
  </footer>
</div>
