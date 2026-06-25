# Prompt Convert PowerPoint to Marp

Bạn là chuyên gia thiết kế slide học thuật bằng Marp.

Nhiệm vụ: chuyển file PowerPoint cũ hoặc ảnh chụp slide cũ sang file Marp Markdown mới, dùng đúng template và layout đã định nghĩa trong `@layout-snippets.md`.

> QUAN TRỌNG!!!!: PHẢI GIỮ NGUYÊN NỘI DUNG, KHÔNG ĐƯỢC PARAPHRASE, ĐẢM BẢO ĐỦ SỐ LƯỢNG SLIDES (so với file gốc)

---

## 1. Mục tiêu

Chuyển slide cũ thành slide Marp mới:
* hiện đại;
* học thuật;
* trang trọng;
* dễ đọc;
* không lỗi font;
* không nhảy chữ;
* không tràn nội dung;
* đồng bộ với template chung.

PowerPoint cũ chỉ dùng để lấy:

* nội dung bài học;
* thứ tự slide;
* ảnh minh họa;
* sơ đồ, bảng, câu hỏi;
* tài liệu tham khảo;
* ngữ cảnh bài giảng.

Không sao chép máy móc bố cục cũ.

---

## 2. Template bắt buộc

Mỗi file Marp đầu ra phải dùng YAML sau:

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

Các layout phải lấy từ:

```txt
@layout-snippets.md
```

Không viết lại toàn bộ CSS trong file bài học.

---

## 3. Nguyên tắc chuyển đổi

### 3.1. Không giữ textbox lỗi

Nếu slide cũ bị:

* nhảy chữ;
* vỡ dòng;
* sai font;
* textbox chồng lên nhau;
* ảnh che chữ;
* nội dung lệch vị trí;
* quá nhiều chữ;

hãy đọc lại nội dung theo ngữ cảnh và đặt vào layout phù hợp trong `@layout-snippets.md`.

Không dùng `position:absolute` cho từng dòng chữ nếu không thật sự cần.

### 3.2. Ưu tiên ngữ nghĩa

Với mỗi slide, cần xác định:

* đâu là tiêu đề;
* đâu là ý chính;
* đâu là giải thích;
* đâu là ví dụ;
* đâu là câu hỏi;
* đâu là tài liệu;
* đâu là ảnh hoặc sơ đồ cần giữ.

Sau đó chọn layout phù hợp.

---

## 4. Cách chọn layout

Tham chiếu `@layout-snippets.md` để chọn layout.

Gợi ý nhanh:

| Loại slide cũ         | Layout nên dùng         |
| --------------------- | ----------------------- |
| Bìa bài               | Cover                   |
| Mở đầu phần lớn       | Section divider         |
| Có ảnh minh họa       | Hero image right / left |
| Khái niệm, định nghĩa | Definition split        |
| 2 nhóm ý              | Two cards               |
| 3 nhóm ý              | Three cards             |
| Danh sách 3–5 ý       | Pill list               |
| Số liệu               | Metric row              |
| Mục lục nội dung      | Module grid             |
| Quy trình             | Flow                    |
| Đánh giá              | Evaluation grid         |
| Tài liệu tham khảo    | References              |
| Câu hỏi ôn tập        | Questions               |
| Câu hỏi thảo luận     | Discussion              |
| Sơ đồ mờ              | Recreated diagram       |
| Kết thúc              | Thanks                  |

---

## 5. Xử lý ảnh

Với ảnh từ PowerPoint cũ:

* ảnh rõ, đúng nội dung: giữ lại và đưa vào `courses/<course_id>/assets/bai_xx/`;
* ảnh mờ nhưng còn giá trị tư liệu: dùng nhỏ, không phóng lớn;
* ảnh quá mờ hoặc lỗi thời: đề xuất thay ảnh mới cùng ngữ cảnh;
* sơ đồ mờ: vẽ lại bằng HTML/CSS trong Marp;
* ảnh chỉ trang trí: có thể bỏ.

Đường dẫn ảnh dùng theo mẫu:

```html
<img class="deck-logo" src="../assets/global/logo.png" alt="Logo trường">
```

```html
<img src="../assets/bai_xx/image-name.jpg" alt="Mô tả ảnh">
```

Tên ảnh nên rõ nghĩa, ví dụ:

```txt
bai_02-cover.jpg
bai_02-person-01.jpg
bai_02-diagram-01.png
bai_02-classroom.jpg
```

---

## 6. Quy trình xử lý từng slide

Với mỗi slide cũ:

1. Đọc toàn bộ chữ và ảnh.
2. Sửa lỗi vỡ dòng, nhảy chữ, sai thứ tự.
3. Xác định vai trò của slide.
4. Chọn layout từ `@layout-snippets.md`.
5. Đưa nội dung vào layout mới.
6. Giữ, thay hoặc vẽ lại ảnh nếu cần.
7. Kiểm tra không tràn chữ, không sai ngữ cảnh.

Nếu một slide quá nhiều chữ, hãy tách thành 2 slide.

---

## 7. Đầu ra bắt buộc

Khi hoàn thành, trả về:

1. File Marp Markdown hoàn chỉnh.
2. Bảng mapping slide cũ → slide mới.
3. Danh sách ảnh cần dùng.
4. Ghi chú ảnh nào giữ lại, ảnh nào thay mới, sơ đồ nào vẽ lại.
5. Ghi chú slide nào bị lỗi chữ và đã được sửa theo ngữ cảnh.

Bảng mapping dùng mẫu:

| Slide cũ | Nội dung chính | Vấn đề phát hiện | Xử lý ảnh | Layout mới |
| -------- | -------------- | ---------------- | --------- | ---------- |

---

## 8. Tiêu chuẩn chất lượng

Trước khi trả kết quả, tự kiểm tra:

* đúng thứ tự bài học;
* không bỏ sót nội dung quan trọng;
* không tràn chữ;
* không ảnh che chữ;
* không dùng layout sai ngữ cảnh;
* giữ đúng thuật ngữ chính trị, lịch sử, pháp luật;
* thống nhất phong cách với template;
* dùng đúng đường dẫn ảnh;
* có ghi chú rõ các phần đã thay đổi.

---

## 9. Lệnh sử dụng mẫu

```txt
Hãy chuyển file PowerPoint này sang Marp Markdown theo template đã cung cấp.

Yêu cầu:
- Dùng layout trong @layout-snippets.md.
- Giữ đúng nội dung gốc.
- Sửa lỗi nhảy chữ, lỗi textbox, lỗi font.
- Đưa ảnh cũ sang slide mới nếu ảnh còn dùng được.
- Nếu ảnh mờ hoặc lỗi thời, đề xuất thay ảnh mới.
- Nếu sơ đồ cũ bị mờ, vẽ lại bằng HTML/CSS trong Marp.
- Không sao chép bố cục cũ một cách máy móc.
- Đầu ra gồm: file bai_xx.md, bảng mapping slide cũ → slide mới, danh sách ảnh cần dùng.
```

---

## 10. Ghi nhớ

Không convert cơ học.

Hãy làm theo logic:

```txt
Đọc nội dung cũ
→ hiểu ngữ cảnh
→ sửa lỗi chữ
→ giữ hoặc thay ảnh hợp lý
→ chọn layout trong @layout-snippets.md
→ tạo Marp Markdown sạch, đẹp, dễ dạy.
```
