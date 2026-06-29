# Remake Slides

Remake các bài giảng PowerPoint thành deck Marp MDX theo một visual system mới, nhất quán, đọc tốt trên màn hình, và phù hợp cho e-learning.

Repo này ưu tiên:

- Giữ nguyên nội dung, ý nghĩa, thứ tự slide, và hình ảnh có giá trị từ file gốc.
- Không bắt chước style PowerPoint cũ.
- Dùng theme, component MDX, và Tailwind utilities của repo làm chuẩn trình bày mới.

## Mục tiêu

Nguồn gốc của mỗi bài là `.pptx`, nhưng đầu ra cần là:

- `bai_XX.mdx` để chỉnh sửa nội dung và layout
- `bai_XX.html` để review nhanh
- bộ `assets/` sạch, đặt tên rõ ràng theo slide nguồn

Deck remake phải dễ đọc, gọn, chặt chẽ, và trung thành với bài học gốc hơn là “đẹp kiểu PowerPoint”.

## Nguyên tắc cốt lõi

### 1. Giữ nội dung, bỏ style cũ

Chỉ giữ:

- nội dung chữ
- thứ tự slide
- quan hệ giữa text và ảnh
- các hình ảnh, sơ đồ, tư liệu thực sự có ý nghĩa

Không giữ:

- màu nền cũ
- font cũ
- border, shadow, gradient, shape trang trí
- bố cục PowerPoint nếu nó làm slide mới kém đọc hơn

### 2. Fidelity quan trọng hơn “cải biên”

- Không tự ý thêm facts mới.
- Không rút gọn mạnh tay chỉ để layout dễ hơn.
- Không đổi nghĩa câu chữ, nhất là tên riêng, ngày tháng, timeline, thuật ngữ chính trị/pháp lý.
- Nếu ảnh gốc chỉ là ảnh text chất lượng thấp, hãy dựng lại bằng MDX text/card thay vì nhét ảnh raster.

### 3. Ảnh phải đúng slide nguồn

- Mỗi ảnh dùng trong deck phải truy ngược được về đúng slide gốc.
- Không lấy ảnh từ slide bên cạnh chỉ vì “trông giống”.
- Không dùng ảnh AI để thay ảnh nguồn.
- Nếu ảnh quá nhỏ hoặc chỉ mang tính trang trí, có thể bỏ, nhưng không được làm mất ý chính của slide.

## Cấu trúc repo

```text
courses/<course_id>/
  source-ppt/          # file .pptx gốc
  pptx-analysis/       # YAML + screenshots + extracted images
  assets/              # ảnh cuối cùng dùng trong deck remake
  md_slides/           # file .mdx và .html

components/            # reusable MDX components
template/              # theme Marp/Tailwind
tools/                 # extract, render, QA, cleanup
```

## Workflow chuẩn

### 1. Cài dependencies

```sh
npm install
uv sync
```

Lệnh này sẽ tạo `.venv/` cho project và cài sẵn các thư viện Python cần cho
tooling.

### 2. Extract PPTX trước khi làm

Không đọc `.pptx` trực tiếp để remake. Luôn extract trước:

```sh
uv run python tools/extract_pptx_structure.py courses/giao_duc_chinh_tri/source-ppt/bai_06.pptx
```

Kết quả sinh ra:

- `bai_06.yaml`
- `screenshots/slide_001.jpg`
- `images/slide_001_image_01.png`

### 3. Đọc YAML theo range slide

Với deck lớn, không mở toàn bộ YAML một lúc:

```sh
uv run python tools/slide_yaml_slice.py courses/giao_duc_chinh_tri/pptx-analysis/bai_06/bai_06.yaml --slides 1-8 --paths
```

Luôn xem screenshot trước khi dựng slide để hiểu:

- hierarchy
- reading order
- ảnh nào thực sự có ý nghĩa
- text nào nên đi cùng ảnh nào

### 4. Viết MDX

Deck source nằm tại:

```text
courses/<course_id>/md_slides/bai_XX.mdx
```

Ví dụ:

```mdx
<Card className="min-h-[220px] border-l-[8px] border-l-[var(--red)] bg-white/92 px-[28px] py-[22px]">
  <div className="text-[28px] font-bold leading-tight text-[var(--red)]">
    Mục tiêu
  </div>
  <div className="text-[23px] leading-[1.36] text-[var(--ink)]">
    Trình bày được nội dung bài học.
  </div>
</Card>
```

## Component ưu tiên

Dùng lại component sẵn có thay vì tự dựng mọi thứ từ đầu:

- `CoverSlide`
- `DeckLogo`
- `Kicker`
- `Card`
- `MediaCard`
- `ModuleCard`
- `PillItem`
- `QuoteBox`
- `QuestionCard`
- `StatCard`
- `ThanksCard`

Hai quy ước quan trọng:

- slide mở đầu chuẩn dùng `CoverSlide`
- slide cảm ơn chuẩn dùng `ThanksCard`

## Quy tắc layout quan trọng

- Dùng `className`, không dùng `class`.
- Không dùng `h3` cho title nhỏ trong card.
- Không dùng `<p>` trong `Card`.
- Ưu tiên `div` và `span` với size explicit như `text-[23px]`, `leading-[1.38]`.
- Giữ spacing chặt, tránh khoảng trắng chết lớn.
- Với layout ảnh + text, ưu tiên `flex items-stretch gap-*`.
- Không bọc một `MediaCard` đơn lẻ trong `Card`.
- Không set đồng thời width và height cứng cho ảnh nếu chưa kiểm tra crop.

## Render và kiểm tra

### Render HTML

```sh
COURSE=giao_duc_chinh_tri DECK=bai_06 npm run html
```

### Build CSS theme

```sh
npm run build:css
```

### Watch theme

```sh
npm run watch:css
```

### Preview

```sh
npm run preview
```

### QA tự động

```sh
npm run check:overflow -- --course giao_duc_chinh_tri --deck bai_06
npm run check:images -- --course giao_duc_chinh_tri --deck bai_06
npm run check:image-quality -- --course giao_duc_chinh_tri --deck bai_06
```

### Giảm widow text

```sh
uv run python tools/avoid_widows.py courses/giao_duc_chinh_tri/md_slides/bai_06.mdx
```

### Gợi ý màu nền cho image card

```sh
uv run python tools/card_bg_color.py courses/giao_duc_chinh_tri/assets/bai_06_s029_image_01.png --ignore-white
```

## Checklist hoàn thiện một deck

- Mỗi slide gốc có đúng một slide remake tương ứng.
- Nội dung chữ khớp YAML, không bị thêm facts mới.
- Ảnh dùng đúng slide nguồn.
- Ảnh có ý nghĩa không bị crop mất nội dung.
- Không có overflow.
- Text và ảnh đủ lớn để đọc trên màn hình.
- Không còn vùng trắng lớn vô nghĩa.
- Các slide cuối cùng đã được render và review lại bằng HTML.

## Ví dụ thực tế

Workflow vừa dùng để remake `bai_06`:

1. Extract `bai_06.pptx`
2. Slice YAML theo cụm slide
3. Copy ảnh cần dùng sang `assets/` theo tên `bai_06_sXXX_image_YY.*`
4. Viết `courses/giao_duc_chinh_tri/md_slides/bai_06.mdx`
5. Chạy `avoid_widows`
6. Render HTML
7. Chạy check overflow / image size / image quality
8. Chỉnh các slide có ảnh nguồn quá nhỏ bằng layout text-first nếu cần

## Ghi chú

`AGENTS.md` là tài liệu chi tiết và nghiêm ngặt hơn về fidelity, image rules, MDX rules, và workflow cho AI agents. Nếu README và `AGENTS.md` có vẻ khác nhau ở mức chi tiết, hãy ưu tiên `AGENTS.md`.
