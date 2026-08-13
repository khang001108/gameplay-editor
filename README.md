# Gameplay Editor — Tiny Swords RTS

Tool thiết kế gameplay bằng kéo-thả node (Event → Condition → Action), xuất ra JSON cho game runtime đọc.

## Chạy thử

```bash
npm install
npm run dev
```

Mở địa chỉ hiện ra trong terminal (mặc định `http://localhost:5173`).

## Build bản production

```bash
npm run build
```

Kết quả nằm trong thư mục `dist/` — có thể deploy như 1 static site bình thường (Vercel/Netlify/GitHub Pages...).

## Cách dùng

1. **Kéo node** từ Sidebar bên trái thả vào Canvas ở giữa.
2. **Nối node**: rê chuột từ chấm tròn bên phải 1 node sang chấm tròn bên trái node khác.
   - `Condition` có 2 output (`true`/`false`) — nối được 2 nhánh khác nhau.
3. **Chỉnh thuộc tính**: click chọn 1 node, panel bên phải (Inspector) hiện toàn bộ property để sửa.
4. **Xoá node**: chọn node rồi bấm nút "Xoá node" trong Inspector, hoặc bấm phím `Delete`/`Backspace`.
5. **Lưu**: bấm **Export JSON** ở góc trên — tải về 1 file `.json` chứa toàn bộ graph.
6. **Mở lại**: bấm **Load JSON**, chọn đúng file đã export trước đó.

## Thêm 1 loại node mới (không cần sửa Canvas/Sidebar/Inspector)

1. Tạo file mới trong `src/nodeDefinitions/events|conditions|actions/`, copy 1 file có sẵn làm mẫu.
2. Khai báo `type`, `label`, `color`, `inputs`, `outputs`, `fields`.
3. Thêm đúng 1 dòng import + đưa vào mảng `NODE_DEFINITIONS` trong `src/nodeDefinitions/index.ts`.

Toàn bộ UI (Sidebar, node hiển thị trên Canvas, form trong Inspector) tự động nhận diện node mới — không phải sửa code hiển thị.

## Định dạng JSON xuất ra

```json
{
  "version": 1,
  "name": "Tên graph",
  "nodes": [
    { "id": "...", "position": { "x": 0, "y": 0 },
      "data": { "defType": "spawn_unit", "category": "action", "values": { "unitType": "warrior", "count": 2 } } }
  ],
  "edges": [
    { "id": "...", "source": "nodeA", "sourceHandle": "out", "target": "nodeB", "targetHandle": "in" }
  ]
}
```

`nodes[].data.defType` khớp với `type` trong file khai báo node (`src/nodeDefinitions/`) — game runtime dùng giá trị này để biết phải thực thi logic gì.

## Đã làm / Chưa làm

**Đã làm**: Editor đầy đủ 3 khu vực, 14 loại node (4 Event, 2 Condition, 8 Action), kéo-thả, nối dây, chỉnh property, save/load JSON, validate khi load (bỏ qua node/edge lỗi thay vì crash).

**Chưa làm** (đúng như phạm vi đã thống nhất — bước tiếp theo nếu cần): gameplay runtime đọc và THỰC THI file JSON này trong game thật.
