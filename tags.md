---
layout: page
title: Lưu trữ theo chủ đề
subtitle: Tất cả bài viết, nhóm theo tag
permalink: /tags/
---

{% assign tagged_posts = site.pages | where: "layout", "post" %}
{% assign all_tags = "" | split: "" %}
{% for post in tagged_posts %}
  {% for tag in post.tags %}
    {% assign all_tags = all_tags | push: tag %}
  {% endfor %}
{% endfor %}
{% assign sorted_tags = all_tags | uniq | sort %}
<div class="tag-archive">
  {% if sorted_tags.size == 0 %}
  <p class="tag-archive-empty">Chưa có chủ đề nào.</p>
  {% else %}
  <nav class="tag-cloud" aria-label="Danh sách chủ đề">
    {% for tag_name in sorted_tags %}
    {% assign tag_posts = tagged_posts | where_exp: "post", "post.tags contains tag_name" %}
    <a class="tag-cloud-link" href="#{{ tag_name | slugify }}">
      <span>{{ tag_name }}</span>
      <small>{{ tag_posts.size }}</small>
    </a>
    {% endfor %}
  </nav>

  <div class="tag-groups">
    {% for tag_name in sorted_tags %}
    {% assign tag_posts = tagged_posts | where_exp: "post", "post.tags contains tag_name" %}
    <section id="{{ tag_name | slugify }}" class="tag-group">
      <div class="tag-group-heading">
        <h2>{{ tag_name }}</h2>
        <span>{{ tag_posts.size }} bài</span>
      </div>
      <ul class="tag-post-list">
        {% for post in tag_posts %}
        <li>
          <a href="{{ post.url | relative_url }}">
            <span>{{ post.title }}</span>
            <time datetime="{{ post.date | date: '%Y-%m-%dT%H:%M:%S%z' }}">{{ post.date | date: site.date_format }}</time>
            <span class="relative-date" data-date="{{ post.date | date: '%Y-%m-%dT%H:%M:%S%z' }}"></span>
          </a>
        </li>
        {% endfor %}
      </ul>
    </section>
    {% endfor %}
  </div>
  {% endif %}
</div>
