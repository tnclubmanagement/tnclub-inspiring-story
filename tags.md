---
layout: page
title: Lưu trữ theo chủ đề
subtitle: Tất cả bài viết, nhóm theo tag
permalink: /tags/
---

{% assign sorted_tags = site.tags | sort %}
{% if sorted_tags.size == 0 %}
Chưa có tag nào.
{% endif %}

{% for tag_entry in sorted_tags %}
{% assign tag_name = tag_entry[0] %}
{% assign tag_posts = tag_entry[1] %}

## {{ tag_name }} <a id="{{ tag_name }}"></a>

<ul>
  {% for post in tag_posts %}
  <li><a href="{{ post.url | relative_url }}">{{ post.title }}</a> — {{ post.date | date: site.date_format }}</li>
  {% endfor %}
</ul>
{% endfor %}
