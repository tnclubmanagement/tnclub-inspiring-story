---
layout: page
title: "Nên – Không nên"
subtitle: ""
permalink: /series/nen-khong-nen/
---

<div class="series-page">
  {% assign series_posts = site.pages | where: "series", "Nên – Không nên" | sort: "series_order" %}
  <section class="series-hero" aria-labelledby="advice-series-title">
    <div class="series-hero-copy">
      <p class="series-landing-kicker">Đời sống · {{ series_posts.size }} bài</p>
      <h1 id="advice-series-title"><span class="series-hero-title-line">Nên làm,</span><br><em>không nên quên.</em></h1>
      <p class="series-landing-intro">
        Mười hai bài viết ngắn về gia đình, học tập, công việc, giao tiếp và cách
        sống tỉnh táo hơn trong những lựa chọn rất đời thường.
      </p>
      <a class="series-hero-button" href="#advice-series-list">Xem các bài viết <span aria-hidden="true">→</span></a>
    </div>
    <div class="series-hero-aside" aria-label="Thông điệp của chuyên đề">
      <span class="series-hero-line" aria-hidden="true"></span>
      <p>Một lựa chọn nhỏ hôm nay có thể làm ngày mai nhẹ hơn.</p>
      <span class="series-hero-caption">Đọc chậm · Chọn điều phù hợp</span>
    </div>
  </section>
  <section id="advice-series-list" class="series-reading-list" aria-labelledby="advice-series-list-title">
    <div class="series-section-heading">
        <div><p class="series-landing-kicker">Mục lục</p><h2 id="advice-series-list-title">Mười hai tình huống quen thuộc</h2></div>
      <p>Đọc theo thứ tự hoặc chọn bài gần với điều bạn đang trải qua.</p>
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
  <footer class="series-landing-footer"><span aria-hidden="true">—</span><p>Không có một công thức chung, chỉ có lựa chọn phù hợp với từng người.</p><span aria-hidden="true">—</span></footer>
</div>
