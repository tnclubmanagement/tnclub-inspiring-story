---
layout: page
title: ""
subtitle: ""
permalink: /series/thay-phap-hoa/
---

<div class="series-page">
  {% assign series_posts = site.pages | where: "series", "Thầy Pháp Hòa" | sort: "series_order" %}
  <section class="series-hero" aria-labelledby="phap-hoa-series-title">
    <div class="series-hero-copy">
      <p class="series-landing-kicker">Pháp thoại ứng dụng · {{ series_posts.size }} bài</p>
      <h1 id="phap-hoa-series-title"><span class="series-hero-title-line">Thầy Pháp Hòa</span><br><em>và những điều bình dị.</em></h1>
      <p class="series-landing-intro">
        Một tuyển chọn những bài viết ngắn về cách nhìn lại bản thân, nuôi
        dưỡng bình an và sống nhẹ nhàng hơn trong đời sống hằng ngày.
      </p>
      <a class="series-hero-button" href="#phap-hoa-series-list">Xem các bài viết <span aria-hidden="true">→</span></a>
    </div>
    <div class="series-hero-aside" aria-label="Thông điệp của chuyên đề">
      <span class="series-hero-line" aria-hidden="true"></span>
      <p>“Bình an bắt đầu từ cách mình nhìn lại chính mình.”</p>
      <span class="series-hero-caption">Đọc chậm · Sống tỉnh thức</span>
    </div>
  </section>

  <section id="phap-hoa-series-list" class="series-reading-list" aria-labelledby="phap-hoa-series-list-title">
    <div class="series-section-heading">
      <div>
        <p class="series-landing-kicker">Mục lục</p>
        <h2 id="phap-hoa-series-list-title">Năm bài học nhỏ</h2>
      </div>
      <p>Đọc theo thứ tự hoặc chọn bài phù hợp với điều bạn đang trải qua.</p>
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
    <p>Một điều hiểu ra đúng lúc có thể làm một ngày trở nên nhẹ hơn.</p>
    <span aria-hidden="true">—</span>
  </footer>
</div>
