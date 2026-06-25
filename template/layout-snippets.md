# Layout Snippets for Marp Course Slides

File này dùng như thư viện bố cục chuẩn để chuyển các slide PowerPoint cũ sang Marp Markdown mới.

Mỗi layout bên dưới có thể copy trực tiếp vào file bài học, ví dụ:

```txt
courses/<course_id>/md_slides/bai_02.md
courses/<course_id>/md_slides/bai_03.md
```

Quy ước chung:

* Không copy máy móc vị trí textbox từ slide cũ.
* Ưu tiên tái cấu trúc nội dung theo ngữ nghĩa.
* Slide cũ chỉ dùng để lấy nội dung, ảnh, thứ tự và ngữ cảnh.
* Nếu chữ trong PPT cũ bị nhảy loạn, phải đọc lại nội dung và đặt vào layout phù hợp.
* Ảnh cũ dùng được thì đưa vào `courses/<course_id>/assets/bai_xx/`.
* Ảnh mờ, vỡ, lỗi thời thì thay bằng ảnh mới hoặc vẽ lại bằng HTML/CSS.
* Tất cả slide nên có logo chung, trừ slide bìa và slide cảm ơn có bố cục riêng.

---

## 00. Khung YAML đầu file

Dùng ở đầu mỗi file bài học.

```md
---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  @import url('../../../template/theme.css');
footer: ''
---
```

---

## 01. Cover slide — Trang bìa bài học

Dùng cho slide đầu mỗi bài/chương.

```md
<!-- _class: cover -->
<!-- _paginate: false -->

<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="cover-bg"></div>

<div class="cover-title">
  <span class="lesson-label">Bài 2</span>
  <span class="main-title">TÊN BÀI HỌC</span>
</div>

<div class="cover-school">
  <span class="school-name">Trường Trung Cấp Công Nghệ Hà Nội</span>
  <span>trungcapcongnghehanoi.edu.vn</span>
</div>
```

Gợi ý dùng khi:

* Slide bìa chương.
* Slide mở đầu chuyên đề.
* Slide có ảnh nền lớn, tên bài học lớn.

---

## 02. Section divider — Slide chuyển mục

Dùng khi mở đầu một phần lớn trong bài.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">Phần 1</div>

<div class="title-block">
  <h2>TÊN PHẦN LỚN CỦA BÀI HỌC</h2>
</div>

<p class="lead">
  Một câu dẫn ngắn giúp người học hiểu phần này sẽ trình bày nội dung gì.
</p>
```

Gợi ý dùng khi:

* Mở mục 1, mục 2, mục 3.
* Chuyển từ lý thuyết sang thảo luận.
* Chuyển từ nội dung chính sang đánh giá / ôn tập.

---

## 03. Hero image right — Nội dung bên trái, ảnh bên phải

Dùng cho slide có một ý chính kèm ảnh minh họa.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="hero-grid">
  <div>
    <div class="kicker">Mục tiêu</div>

    <div class="title-block">
      <h2>MỤC TIÊU HỌC TẬP</h2>
    </div>

    <p class="lead">
      Sau khi học xong phần này, người học có thể trình bày, phân tích và vận dụng các nội dung cơ bản của bài học.
    </p>
  </div>

  <div class="image-card">
    <img src="../assets/bai_02/image-01.jpg" alt="Mô tả ảnh minh họa">
  </div>
</div>
```

Gợi ý dùng khi:

* Slide mục tiêu.
* Slide giới thiệu vấn đề.
* Slide có ảnh lớp học, ảnh nhân vật, ảnh tư liệu, ảnh minh họa.

---

## 04. Hero image left — Ảnh bên trái, nội dung bên phải

Dùng khi muốn tạo nhịp thị giác khác với layout ảnh bên phải.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="hero-grid">
  <div class="image-card">
    <img src="../assets/bai_02/image-02.jpg" alt="Mô tả ảnh minh họa">
  </div>

  <div>
    <div class="kicker">Bối cảnh</div>

    <div class="title-block">
      <h2>BỐI CẢNH CỦA VẤN ĐỀ</h2>
    </div>

    <p class="lead">
      Viết ngắn gọn bối cảnh hoặc thông điệp chính của slide.
    </p>
  </div>
</div>
```

Gợi ý dùng khi:

* Slide có ảnh quan trọng.
* Slide muốn nhấn mạnh hình ảnh trước khi đọc nội dung.
* Slide lịch sử, chính trị, nhân vật.

---

## 05. Definition split — Khái niệm / định nghĩa

Dùng cho slide có khái niệm, định nghĩa hoặc đoạn lý thuyết quan trọng.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">1. Khái niệm</div>

<div class="title-block">
  <h2>TÊN KHÁI NIỆM</h2>
</div>

<div class="split">
  <div class="quote-box">
    <p>
      Viết định nghĩa cốt lõi tại đây. Nội dung cần ngắn, rõ, đúng thuật ngữ và không bị vỡ dòng.
    </p>
  </div>

  <div class="card">
    <h3>Ý nghĩa</h3>
    <p>
      Giải thích thêm ý nghĩa, vai trò hoặc phạm vi áp dụng của khái niệm.
    </p>
  </div>
</div>
```

Gợi ý dùng khi:

* Slide cũ có đoạn văn dài.
* Slide định nghĩa chính trị, pháp luật, tư tưởng.
* Slide cần tách “định nghĩa” và “ý nghĩa”.

---

## 06. Two cards — Hai nhóm ý song song

Dùng khi slide có hai ý đối chiếu hoặc hai nội dung ngang hàng.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">Nội dung chính</div>

<div class="title-block">
  <h2>HAI NỘI DUNG TRỌNG TÂM</h2>
</div>

<div class="cards">
  <div class="card accent-navy">
    <h3>Ý thứ nhất</h3>
    <p>
      Nội dung giải thích ý thứ nhất. Nên viết ngắn gọn, tránh quá nhiều dòng.
    </p>
  </div>

  <div class="card">
    <h3>Ý thứ hai</h3>
    <p>
      Nội dung giải thích ý thứ hai. Có thể dùng để so sánh, bổ sung hoặc mở rộng.
    </p>
  </div>
</div>
```

Gợi ý dùng khi:

* So sánh hai khái niệm.
* Hai nhiệm vụ.
* Hai nhóm nội dung.
* Một bên là nội dung chính, một bên là giải thích.

---

## 07. Three cards — Ba ý chính

Dùng cho slide có 3 đặc điểm, 3 nhiệm vụ, 3 vai trò.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">Chủ đề phụ</div>

<div class="title-block">
  <h2>BA Ý CHÍNH CẦN GHI NHỚ</h2>
</div>

<div class="cards three">
  <div class="card">
    <h3>Ý 1</h3>
    <p>
      Nội dung ngắn gọn của ý thứ nhất.
    </p>
  </div>

  <div class="card">
    <h3>Ý 2</h3>
    <p>
      Nội dung ngắn gọn của ý thứ hai.
    </p>
  </div>

  <div class="card">
    <h3>Ý 3</h3>
    <p>
      Nội dung ngắn gọn của ý thứ ba.
    </p>
  </div>
</div>
```

Gợi ý dùng khi:

* Slide cũ có danh sách 3 bullet.
* Nội dung cần chia đều.
* Không có ảnh minh họa quan trọng.

---

## 08. Pill list — Danh sách có số thứ tự

Dùng cho slide có 3–5 ý theo trình tự.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">Mục tiêu</div>

<div class="title-block">
  <h2>CÁC NỘI DUNG CẦN ĐẠT</h2>
</div>

<div class="pill-list">
  <div class="pill-item">
    <span class="dot">1</span>
    <p><strong>Về kiến thức:</strong> Trình bày được các nội dung cơ bản của bài học.</p>
  </div>

  <div class="pill-item">
    <span class="dot">2</span>
    <p><strong>Về kỹ năng:</strong> Vận dụng kiến thức vào học tập, lao động và đời sống.</p>
  </div>

  <div class="pill-item">
    <span class="dot">3</span>
    <p><strong>Về thái độ:</strong> Hình thành ý thức trách nhiệm, đạo đức và lối sống phù hợp.</p>
  </div>
</div>
```

Gợi ý dùng khi:

* Slide mục tiêu học tập.
* Slide yêu cầu cần đạt.
* Slide liệt kê theo nhóm: kiến thức, kỹ năng, thái độ.

---

## 09. Metric row — Slide số liệu

Dùng cho slide có các con số như thời lượng, số tiết, tỷ lệ, mốc thời gian.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">Thời lượng</div>

<div class="title-block">
  <h2>THỜI GIAN THỰC HIỆN MÔN HỌC</h2>
</div>

<div class="metric-row four">
  <div class="metric">
    <span class="num">30</span>
    <p>Tổng số tiết</p>
  </div>

  <div class="metric">
    <span class="num">15</span>
    <p>Lý thuyết</p>
  </div>

  <div class="metric">
    <span class="num">13</span>
    <p>Thảo luận</p>
  </div>

  <div class="metric">
    <span class="num">02</span>
    <p>Kiểm tra</p>
  </div>
</div>
```

Gợi ý dùng khi:

* Slide thời lượng.
* Slide thống kê.
* Slide mốc số liệu cần nhớ.

---

## 10. Module grid — 5 nội dung chính

Dùng khi bài học có 5 chương mục hoặc 5 nội dung chính.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">Nội dung chính</div>

<div class="title-block">
  <h2>NỘI DUNG CHÍNH CỦA BÀI HỌC</h2>
</div>

<div class="module-grid">
  <div class="module">
    <span class="index">1</span>
    <p>Nội dung thứ nhất</p>
  </div>

  <div class="module">
    <span class="index">2</span>
    <p>Nội dung thứ hai</p>
  </div>

  <div class="module">
    <span class="index">3</span>
    <p>Nội dung thứ ba</p>
  </div>

  <div class="module">
    <span class="index">4</span>
    <p>Nội dung thứ tư</p>
  </div>

  <div class="module">
    <span class="index">5</span>
    <p>Nội dung thứ năm</p>
  </div>
</div>
```

Gợi ý dùng khi:

* Slide mục lục.
* Slide tổng quan nội dung.
* Slide có 4–5 phần lớn.

---

## 11. Flow — Quy trình / tiến trình / phương pháp

Dùng cho slide có các bước hoặc trình tự logic.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">Phương pháp</div>

<div class="title-block">
  <h2>QUY TRÌNH THỰC HIỆN</h2>
</div>

<div class="flow">
  <div class="flow-card">
    <div class="step">01</div>
    <p>
      Nội dung bước thứ nhất.
    </p>
  </div>

  <div class="flow-card">
    <div class="step">02</div>
    <p>
      Nội dung bước thứ hai.
    </p>
  </div>

  <div class="flow-card">
    <div class="step">03</div>
    <p>
      Nội dung bước thứ ba.
    </p>
  </div>

  <div class="flow-card">
    <div class="step">04</div>
    <p>
      Nội dung bước thứ tư.
    </p>
  </div>
</div>
```

Gợi ý dùng khi:

* Phương pháp học tập.
* Quy trình đánh giá.
* Các bước thực hiện.
* Tiến trình lịch sử.

---

## 12. Evaluation grid — Đánh giá / kiểm tra

Dùng cho slide có các hình thức đánh giá.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">Đánh giá</div>

<div class="title-block">
  <h2>PHƯƠNG PHÁP ĐÁNH GIÁ</h2>
</div>

<div class="eval-grid">
  <div class="eval-card">
    <h3>Chuyên cần</h3>
    <p>
      Điều kiện tham gia học tập, số tiết tối thiểu hoặc yêu cầu tham dự.
    </p>
  </div>

  <div class="eval-card">
    <h3>Thường xuyên</h3>
    <p>
      Kiểm tra bài cũ, tự học, thảo luận hoặc hoạt động trong quá trình học.
    </p>
  </div>

  <div class="eval-card">
    <h3>Định kỳ</h3>
    <p>
      Kiểm tra giữa phần, bài kiểm tra 45 phút hoặc bài tập định kỳ.
    </p>
  </div>

  <div class="eval-card">
    <h3>Cuối kỳ</h3>
    <p>
      Bài thi tổng kết hoặc hình thức đánh giá kết thúc học phần.
    </p>
  </div>
</div>
```

Gợi ý dùng khi:

* Slide đánh giá môn học.
* Slide kiểm tra.
* Slide tiêu chí học phần.

---

## 13. Quote emphasis — Trích dẫn / thông điệp nhấn mạnh

Dùng cho slide cần làm nổi bật một câu quan trọng.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">Ghi nhớ</div>

<div class="title-block">
  <h2>THÔNG ĐIỆP TRỌNG TÂM</h2>
</div>

<div class="quote-box">
  <p>
    Nội dung cần nhấn mạnh được đặt tại đây. Câu nên ngắn, rõ và có giá trị ghi nhớ.
  </p>
</div>
```

Gợi ý dùng khi:

* Slide tổng kết ý.
* Slide có câu nói quan trọng.
* Slide cần giảm lượng chữ nhưng tăng trọng tâm.

---

## 14. Portrait row — Nhân vật / tác giả / lãnh tụ

Dùng cho slide có nhiều chân dung nhân vật.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="hero-grid">
  <div>
    <div class="kicker">Nhân vật</div>

    <div class="title-block">
      <h2>CÁC NHÂN VẬT TIÊU BIỂU</h2>
    </div>

    <p class="lead">
      Giới thiệu ngắn gọn vai trò của các nhân vật đối với nội dung bài học.
    </p>
  </div>

  <div class="portrait-row">
    <div class="portrait">
      <img src="../assets/bai_02/person-01.jpg" alt="Nhân vật 1">
    </div>

    <div class="portrait">
      <img src="../assets/bai_02/person-02.jpg" alt="Nhân vật 2">
    </div>

    <div class="portrait">
      <img src="../assets/bai_02/person-03.jpg" alt="Nhân vật 3">
    </div>
  </div>
</div>
```

Gợi ý dùng khi:

* Slide về nhân vật lịch sử.
* Slide về tác giả lý luận.
* Slide giới thiệu các đại diện tư tưởng.

---

## 15. References — Tài liệu tham khảo

Dùng cho slide tài liệu tham khảo.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">Tài liệu</div>

<div class="title-block">
  <h2>TÀI LIỆU THAM KHẢO</h2>
</div>

<ul class="reference-list">
  <li>
    <strong>Giáo trình bắt buộc:</strong> Tên đơn vị biên soạn, tên giáo trình, nhà xuất bản hoặc thông tin lưu hành nội bộ.
  </li>

  <li>
    <strong>Tài liệu tham khảo:</strong> Tên tác giả hoặc cơ quan ban hành, năm, tên tài liệu, thông tin xuất bản.
  </li>
</ul>
```

Gợi ý dùng khi:

* Danh mục tài liệu.
* Văn bản pháp luật.
* Giáo trình bắt buộc.
* Tài liệu đọc thêm.

---

## 16. Questions — Câu hỏi lượng giá

Dùng cho slide câu hỏi cuối bài.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">Ôn tập</div>

<div class="title-block">
  <h2>CÂU HỎI LƯỢNG GIÁ</h2>
</div>

<div class="question-grid">
  <div class="question">
    <div class="qnum">01</div>
    <p>
      Câu hỏi thứ nhất?
    </p>
  </div>

  <div class="question">
    <div class="qnum">02</div>
    <p>
      Câu hỏi thứ hai?
    </p>
  </div>
</div>
```

Gợi ý dùng khi:

* Câu hỏi ôn tập.
* Câu hỏi lượng giá.
* Câu hỏi kiểm tra nhanh.

---

## 17. Discussion — Câu hỏi thảo luận có ảnh

Dùng cho slide thảo luận nhóm.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="hero-grid">
  <div>
    <div class="kicker">Thảo luận</div>

    <div class="title-block">
      <h2>CÂU HỎI THẢO LUẬN</h2>
    </div>

    <div class="pill-list">
      <div class="pill-item">
        <span class="dot">1</span>
        <p>
          Câu hỏi thảo luận thứ nhất?
        </p>
      </div>

      <div class="pill-item">
        <span class="dot">2</span>
        <p>
          Câu hỏi thảo luận thứ hai?
        </p>
      </div>
    </div>
  </div>

  <div class="image-card">
    <img src="../assets/global/classroom-discussion.jpg" alt="Thảo luận trong lớp học">
  </div>
</div>
```

Gợi ý dùng khi:

* Thảo luận lớp.
* Câu hỏi mở.
* Hoạt động nhóm.

---

## 18. Image only with caption — Ảnh lớn kèm chú thích

Dùng khi ảnh là nội dung chính của slide.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">Tư liệu hình ảnh</div>

<div class="title-block">
  <h2>TÊN TƯ LIỆU HOẶC SỰ KIỆN</h2>
</div>

<div class="image-card">
  <img src="../assets/bai_02/image-large.jpg" alt="Mô tả ảnh tư liệu">
</div>

<p style="margin-top: 16px; font-size: 18px; color: var(--muted);">
  Chú thích ngắn cho ảnh, nếu cần.
</p>
```

Gợi ý dùng khi:

* Ảnh lịch sử.
* Ảnh bản đồ.
* Ảnh sự kiện.
* Ảnh minh họa cần nhìn rõ.

---

## 19. Recreated diagram — Vẽ lại sơ đồ cũ

Dùng khi slide cũ có sơ đồ bị mờ, vỡ hoặc không đồng bộ.

```md
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="kicker">Sơ đồ</div>

<div class="title-block">
  <h2>SƠ ĐỒ KHÁI QUÁT NỘI DUNG</h2>
</div>

<div class="flow">
  <div class="flow-card">
    <div class="step">01</div>
    <p>Khái niệm nền tảng</p>
  </div>

  <div class="flow-card">
    <div class="step">02</div>
    <p>Nội dung phát triển</p>
  </div>

  <div class="flow-card">
    <div class="step">03</div>
    <p>Vận dụng thực tiễn</p>
  </div>

  <div class="flow-card">
    <div class="step">04</div>
    <p>Kết luận / ghi nhớ</p>
  </div>
</div>
```

Gợi ý dùng khi:

* Sơ đồ trong PPT cũ quá mờ.
* SmartArt cũ bị lỗi font.
* Muốn đồng bộ toàn bộ bài giảng theo phong cách mới.

---

## 20. Thanks slide — Slide kết thúc

Dùng cho slide cuối bài.

```md
<!-- _class: thanks -->

<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">

<div class="thanks-card">
  <h2>Xin trân trọng cám ơn</h2>

  <div class="contact">
    <div>Trường Trung Cấp Công Nghệ Hà Nội</div>
    <div>Địa chỉ: Tầng 4, Trung tâm Văn hóa Nghệ thuật, đường Mai Dịch, quận Cầu Giấy, Hà Nội</div>
    <div>Hotline: 0933.279.868 - 090.323.0405 - 035.988.3882</div>
    <div>Email: trungcapcongnghehanoi.edu.vn@gmail.com</div>
    <div>Website: trungcapcongnghehanoi.edu.vn</div>
  </div>
</div>
```

Gợi ý dùng khi:

* Slide cuối bài.
* Slide kết thúc chương.
* Slide kết thúc học phần.

---

# Bảng chọn layout nhanh

| Loại slide cũ            | Layout nên dùng                               |
| ------------------------ | --------------------------------------------- |
| Bìa chương               | 01. Cover slide                               |
| Mở đầu mục lớn           | 02. Section divider                           |
| Có 1 ảnh minh họa lớn    | 03. Hero image right hoặc 04. Hero image left |
| Định nghĩa / khái niệm   | 05. Definition split                          |
| Có 2 nhóm ý              | 06. Two cards                                 |
| Có 3 nhóm ý              | 07. Three cards                               |
| Danh sách 3–5 ý          | 08. Pill list                                 |
| Có số liệu               | 09. Metric row                                |
| Mục lục 5 phần           | 10. Module grid                               |
| Quy trình / phương pháp  | 11. Flow                                      |
| Đánh giá / kiểm tra      | 12. Evaluation grid                           |
| Câu nhấn mạnh            | 13. Quote emphasis                            |
| Nhiều chân dung nhân vật | 14. Portrait row                              |
| Tài liệu tham khảo       | 15. References                                |
| Câu hỏi ôn tập           | 16. Questions                                 |
| Câu hỏi thảo luận        | 17. Discussion                                |
| Ảnh tư liệu lớn          | 18. Image only with caption                   |
| Sơ đồ cũ bị mờ           | 19. Recreated diagram                         |
| Kết thúc bài             | 20. Thanks slide                              |

---

# Quy tắc xử lý lỗi chữ từ PowerPoint cũ

Khi chuyển slide cũ sang Marp:

1. Không giữ nguyên từng textbox nếu vị trí bị sai.
2. Không dùng tọa độ tuyệt đối cho từng dòng chữ.
3. Phải đọc lại nội dung theo thứ tự logic.
4. Gộp các dòng vỡ thành câu hoàn chỉnh.
5. Tách đoạn dài thành:

   * `quote-box` nếu là định nghĩa;
   * `card` nếu là ý giải thích;
   * `pill-list` nếu là danh sách;
   * `flow-card` nếu là quy trình;
   * `reference-list` nếu là tài liệu.
6. Không để quá 80–100 chữ trong một slide thông thường.
7. Nếu nội dung quá dài, tách thành 2 slide.

---

# Quy tắc xử lý ảnh từ PowerPoint cũ

## Trường hợp 1: Ảnh rõ, đúng nội dung

Giữ lại ảnh và đưa vào:

```txt
assets/bai_xx/
```

Sau đó gọi ảnh trong slide:

```md
<div class="image-card">
  <img src="../assets/bai_xx/image-01.jpg" alt="Mô tả ảnh">
</div>
```

## Trường hợp 2: Ảnh mờ nhưng vẫn có giá trị

Có thể dùng nhỏ hơn, không phóng toàn màn hình.

```md
<div class="image-card">
  <img src="../assets/bai_xx/old-image-soft.jpg" alt="Ảnh tư liệu từ slide cũ">
</div>
```

## Trường hợp 3: Ảnh quá mờ hoặc lỗi thời

Không dùng lại. Thay bằng:

* ảnh tư liệu rõ hơn;
* ảnh minh họa cùng ngữ cảnh;
* sơ đồ HTML/CSS vẽ lại;
* biểu tượng đơn giản hơn.

## Trường hợp 4: Ảnh chỉ trang trí

Có thể bỏ để slide sạch hơn.

---

# Ghi chú khi tạo bài mới

Mỗi bài mới nên có cấu trúc:

```md
---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  @import url('../../../template/theme.css');
footer: ''
---

<!-- Slide 1: Cover -->

---

<!-- Slide 2: Mục tiêu -->

---

<!-- Slide 3: Nội dung chính -->

---

<!-- Slide cuối: Thanks -->
```

Đặt ảnh theo cấu trúc:

```txt
assets/
├── global/
│   ├── logo.png
│   ├── cover-bg.jpg
│   └── classroom-discussion.jpg
│
├── bai_01/
├── bai_02/
├── bai_03/
└── bai_04/
```

Tên ảnh nên đặt rõ nghĩa:

```txt
bai_02-cover.jpg
bai_02-person-01.jpg
bai_02-diagram-01.png
bai_02-classroom.jpg
bai_02-history-event.jpg
```

Không nên đặt tên ảnh kiểu:

```txt
image1.png
picture2.jpg
slide3-img4.png
```

---

# Mẫu ghi chú mapping khi chuyển slide

Có thể thêm ghi chú này vào quá trình làm việc, không nhất thiết đưa vào slide cuối.

```txt
Slide cũ 01 → Cover slide
- Giữ nội dung: Tên bài học, tên trường
- Ảnh: thay ảnh nền mới do ảnh cũ mờ
- Layout mới: 01. Cover slide

Slide cũ 02 → Metric row
- Giữ nội dung: số tiết, lý thuyết, thảo luận, kiểm tra
- Ảnh: không dùng
- Layout mới: 09. Metric row

Slide cũ 03 → Hero image right
- Giữ nội dung: mục tiêu học tập
- Ảnh: dùng ảnh lớp học mới
- Layout mới: 03. Hero image right

Slide cũ 04 → Definition split
- Giữ nội dung: định nghĩa chính
- Sửa lỗi: gộp textbox bị vỡ dòng
- Layout mới: 05. Definition split
```
