---
layout: page
title: Ủng hộ Inspiring Stories
subtitle: Cùng giữ những câu chuyện tử tế được tiếp tục
permalink: /support/
css: /assets/css/support.css
---

{% assign momo_amounts = site.data.support.amounts %}
{% assign momo_qr = site.data.support.momo_qr | default: '' %}
{% assign recipient = site.data.support.recipient | default: '' %}
{% assign qr_src = momo_qr %}
{% unless momo_qr contains '://' %}{% assign qr_src = momo_qr | relative_url %}{% endunless %}

<section class="support-shell" aria-label="Đồng hành cùng Inspiring Stories">
  <div class="support-intro">
    <span class="support-eyebrow">MỘT CHÚT ĐỒNG HÀNH</span>
    <h2>Tiếp sức cho những<br>câu chuyện tiếp theo.</h2>
    <p>Mỗi lượt đọc, mỗi lần chia sẻ đều là một lời động viên. Nếu muốn góp thêm một chút, bạn có thể ủng hộ tùy tâm để tiếp sức cho việc duy trì và chăm chút website.</p>
    <div class="support-promise"><span aria-hidden="true">✓</span><p>Không bắt buộc, không mức tối thiểu.<br>Các bài viết vẫn luôn miễn phí để bạn đọc.</p></div>
    <a class="support-text-link" href="{{ '/posts/' | relative_url }}">Tiếp tục khám phá những câu chuyện &rarr;</a>
  </div>
  <section class="support-card" aria-labelledby="momo-heading">
    <div class="support-card-top"><span class="support-momo">MoMo</span><span class="support-tag">Ủng hộ tự nguyện</span></div>
    <h2 id="momo-heading">Gửi một lời động viên</h2>
    <p class="support-caption">Quét mã bằng ứng dụng MoMo hoặc mở liên kết trên điện thoại.</p>
    <div class="support-qr">
      {% if momo_qr != '' and recipient != '' %}
      <img src="{{ qr_src | escape }}" alt="Mã QR MoMo của {{ recipient | escape }} để ủng hộ Inspiring Stories" width="240" height="240" loading="lazy">
      {% else %}
      <div class="support-qr-empty"><span class="support-qr-mark" aria-hidden="true">MoMo</span><strong>QR đang được cập nhật</strong><span>Chưa có mã nhận tiền được công bố.</span></div>
      {% endif %}
    </div>
    {% if recipient != '' %}<p class="support-recipient">Người nhận <strong>{{ recipient | escape }}</strong></p>{% endif %}
    {% if momo_amounts.size > 0 and recipient != '' %}
    <p class="support-caption">Chọn nhanh mức ủng hộ</p>
    <div class="support-amounts" role="group" aria-label="Mức ủng hộ qua MoMo">
      {% for amount in momo_amounts %}
      <a class="support-button" href="{{ amount.url | escape }}" target="_blank" rel="noopener noreferrer" aria-label="Ủng hộ {{ amount.label | escape }} qua MoMo">{{ amount.label | escape }}</a>
      {% endfor %}
    </div>
    {% else %}
    <p class="support-status">{% if momo_qr != '' and recipient != '' %}Quét mã QR phía trên bằng MoMo để ủng hộ.{% else %}Thông tin nhận ủng hộ đang được hoàn thiện.{% endif %}</p>
    {% endif %}
    <p class="support-safety">Kiểm tra tên người nhận và số tiền trước khi xác nhận. Không cung cấp mật khẩu hoặc mã OTP cho bất kỳ ai.</p>
  </section>
</section>
<section class="support-how" aria-labelledby="support-how-title">
  <h2 id="support-how-title">Một thao tác nhỏ, một lời động viên lớn</h2>
  <ol>
    <li><span>01</span><div><h3>Mở MoMo</h3><p>Dùng ứng dụng để quét mã QR, hoặc bấm liên kết nhận tiền khi có sẵn.</p></div></li>
    <li><span>02</span><div><h3>Chọn khoản tùy tâm</h3><p>Kiểm tra đúng tên người nhận và số tiền trước khi xác nhận trong ứng dụng.</p></div></li>
    <li><span>03</span><div><h3>Cảm ơn bạn đã đồng hành</h3><p>Bạn cũng có thể tiếp sức bằng cách chia sẻ một bài viết mình yêu thích.</p></div></li>
  </ol>
  <p class="support-footnote">Website không xử lý hoặc tự xác nhận giao dịch. Cần trao đổi về khoản ủng hộ? <a href="{{ '/contact/' | relative_url }}">Liên hệ với mình</a>.</p>
</section>
