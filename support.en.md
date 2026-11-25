---
layout: page
title: Support Inspiring Stories
subtitle: Help keep gentle stories going
permalink: /support/
lang: en
css: /assets/css/support.css
---

{% assign momo_amounts = site.data.support.amounts %}
{% assign momo_qr = site.data.support.momo_qr | default: '' %}
{% assign recipient = site.data.support.recipient | default: '' %}
{% assign qr_src = momo_qr %}
{% unless momo_qr contains '://' %}{% assign qr_src = momo_qr | relative_url %}{% endunless %}

<section class="support-shell" aria-label="Support Inspiring Stories">
  <div class="support-intro">
    <span class="support-eyebrow">A LITTLE COMPANY</span>
    <h2>Fuel for the<br>stories ahead.</h2>
    <p>Every read, every share is encouragement. If you'd like to give a little more, you can support voluntarily to help maintain and care for the website.</p>
    <div class="support-promise"><span aria-hidden="true">✓</span><p>No obligation, no minimum.<br>All posts stay free to read.</p></div>
    <a class="support-text-link" href="{{ '/posts/' | relative_url }}">Keep exploring the stories &rarr;</a>
  </div>
  <section class="support-card" aria-labelledby="momo-heading">
    <div class="support-card-top"><span class="support-momo">MoMo</span><span class="support-tag">Voluntary support</span></div>
    <h2 id="momo-heading">Send a little encouragement</h2>
    <p class="support-caption">Scan the code with the MoMo app or open the link on your phone.</p>
    <div class="support-qr">
      {% if momo_qr != '' and recipient != '' %}
      <img src="{{ qr_src | escape }}" alt="MoMo QR code of {{ recipient | escape }} to support Inspiring Stories" width="240" height="240" loading="lazy">
      {% else %}
      <div class="support-qr-empty"><span class="support-qr-mark" aria-hidden="true">MoMo</span><strong>QR being updated</strong><span>No payment code published yet.</span></div>
      {% endif %}
    </div>
    {% if recipient != '' %}<p class="support-recipient">Recipient <strong>{{ recipient | escape }}</strong></p>{% endif %}
    {% if momo_amounts.size > 0 and recipient != '' %}
    <p class="support-caption">Pick a quick amount</p>
    <div class="support-amounts" role="group" aria-label="MoMo support amounts">
      {% for amount in momo_amounts %}
      <a class="support-button" href="{{ amount.url | escape }}" target="_blank" rel="noopener noreferrer" aria-label="Support {{ amount.label | escape }} via MoMo">{{ amount.label | escape }}</a>
      {% endfor %}
    </div>
    {% else %}
    <p class="support-status">{% if momo_qr != '' and recipient != '' %}Scan the QR above with MoMo to support.{% else %}Support details are being finalized.{% endif %}</p>
    {% endif %}
    <p class="support-safety">Check the recipient name and amount before confirming. Never share your password or OTP with anyone.</p>
  </section>
</section>
<section class="support-how" aria-labelledby="support-how-title">
  <h2 id="support-how-title">A small gesture, a big encouragement</h2>
  <ol>
    <li><span>01</span><div><h3>Open MoMo</h3><p>Use the app to scan the QR code, or tap the payment link when available.</p></div></li>
    <li><span>02</span><div><h3>Pick any amount</h3><p>Double-check the recipient name and amount before confirming in the app.</p></div></li>
    <li><span>03</span><div><h3>Thank you for being here</h3><p>You can also help simply by sharing a post you love.</p></div></li>
  </ol>
  <p class="support-footnote">The website does not process or confirm transactions. Questions about support? <a href="{{ '/contact/' | relative_url }}">Contact me</a>.</p>
</section>
