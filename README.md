# Game Editor — Tiny Swords RTS

Bộ công cụ thiết kế game, chia theo chế độ (tab trên cùng):

- **🗺 Map Editor** — vẽ terrain bằng tileset tự import, đặt building/unit lên lưới, vẽ khu vực Spawn/Trigger/Boundary.
- **⚙️ Gameplay Editor** — kéo-thả node (Event → Condition → Action), xuất ra JSON cho game runtime đọc.
- **🎨 UI Editor**, **🎮 Playtest** — chưa làm (đánh dấu "sắp có" trên tab).

Mỗi chế độ có state, Export/Load JSON riêng — đổi tên/màn hình ở đầu trang không ảnh hưởng chế độ còn lại.

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

## Cách dùng — Map Editor

1. **Terrain**: tab "Terrain" ở Sidebar → chọn kích thước 1 tile (px) → **+ Import ảnh tileset** (PNG/JPG bất kỳ, ảnh được cắt lưới tự động theo kích thước đã chọn). Click 1 ô trong bảng tile để chọn brush, bấm **Vẽ** rồi kéo chuột trên canvas để tô; bấm **Xoá (Eraser)** để xoá. Chọn cỡ cọ 1×1/2×2/3×3.
2. **Buildings / Units**: chuyển tab tương ứng, **kéo** 1 item từ Sidebar thả vào canvas để đặt. Kéo lại object đã đặt (khi đang ở tool "Chọn / Di chuyển") để di chuyển.
3. **Spawn/Area**: tab "Spawn/Area" → chọn loại (Spawn/Trigger/Boundary) → **kéo chuột** trên canvas để vẽ hình chữ nhật.
4. **Chỉnh thuộc tính**: click chọn 1 building/unit/khu vực, panel bên phải (Inspector) hiện property để sửa; không chọn gì thì Inspector hiện Map Settings (kích thước lưới, tile size).
5. **Xoá**: chọn rồi bấm phím `Delete`/`Backspace`, hoặc nút xoá trong Inspector. Phím `Esc` thoát tool vẽ hiện tại về "Chọn / Di chuyển".
6. **Lưu/Mở**: **Export JSON** / **Load JSON** ở góc trên — file JSON tự chứa cả ảnh tileset (dạng base64) nên mở lại ở máy khác không cần kèm file ảnh riêng.

## Cách dùng — Gameplay Editor

1. **Kéo node** từ Sidebar bên trái thả vào Canvas ở giữa.
2. **Nối node**: rê chuột từ chấm tròn bên phải 1 node sang chấm tròn bên trái node khác.
   - `Condition` có 2 output (`true`/`false`) — nối được 2 nhánh khác nhau.
3. **Chỉnh thuộc tính**: click chọn 1 node, panel bên phải (Inspector) hiện toàn bộ property để sửa.
4. **Xoá node**: chọn node rồi bấm nút "Xoá node" trong Inspector, hoặc bấm phím `Delete`/`Backspace`.
5. **Lưu**: bấm **Export JSON** ở góc trên — tải về 1 file `.json` chứa toàn bộ graph.
6. **Mở lại**: bấm **Load JSON**, chọn đúng file đã export trước đó.

## Thêm 1 loại building/unit mới (Map Editor)

1. Tạo file mới trong `src/mapDefinitions/buildings|units/`, copy 1 file có sẵn làm mẫu.
2. Khai báo `type`, `kind`, `label`, `color`, `footprintWidth/Height`, `fields`.
3. Thêm đúng 1 dòng import + đưa vào mảng `MAP_OBJECT_DEFINITIONS` trong `src/mapDefinitions/index.ts`.

## Thêm 1 loại node mới (Gameplay Editor, không cần sửa Canvas/Sidebar/Inspector)

1. Tạo file mới trong `src/nodeDefinitions/events|conditions|actions/`, copy 1 file có sẵn làm mẫu.
2. Khai báo `type`, `label`, `color`, `inputs`, `outputs`, `fields`.
3. Thêm đúng 1 dòng import + đưa vào mảng `NODE_DEFINITIONS` trong `src/nodeDefinitions/index.ts`.

Toàn bộ UI (Sidebar, node hiển thị trên Canvas, form trong Inspector) tự động nhận diện node mới — không phải sửa code hiển thị.

## Định dạng JSON xuất ra — Gameplay Editor

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

## Định dạng JSON xuất ra — Map Editor

```json
{
  "version": 1,
  "name": "Tên map",
  "width": 20, "height": 15, "tileSize": 32,
  "tilesets": [{ "id": "...", "name": "...", "imageDataUrl": "data:image/png;base64,...", "tileWidth": 32, "tileHeight": 32, "columns": 8, "rows": 8 }],
  "terrain": [null, { "tilesetId": "...", "tileIndex": 5 }, "... (mảng phẳng, dài width×height, row-major)"],
  "objects": [{ "id": "...", "kind": "building", "defType": "townhall", "x": 2, "y": 3, "values": { "side": "player", "hp": 500 } }],
  "areas": [{ "id": "...", "kind": "spawn", "name": "Spawn 1", "team": "player", "x": 1, "y": 1, "width": 3, "height": 3 }]
}
```

## Đã làm / Chưa làm

**Đã làm**:
- **Map Editor**: import tileset ảnh bất kỳ (tự cắt lưới), vẽ/xoá terrain bằng brush 1×3, đặt 6 loại building + 4 loại unit lên lưới (kéo-thả, di chuyển, chỉnh property), vẽ khu vực Spawn/Trigger/Boundary, resize map, save/load JSON (tự chứa cả ảnh tileset).
- **Gameplay Editor**: đầy đủ 3 khu vực, 14 loại node (4 Event, 2 Condition, 8 Action), kéo-thả, nối dây, chỉnh property, save/load JSON, validate khi load (bỏ qua node/edge lỗi thay vì crash).
- Tab chuyển đổi giữa các chế độ, mỗi chế độ giữ state/Export/Load riêng.

**Chưa làm**: UI Editor (thiết kế 7 màn hình), Playtest (chạy thử ghép Map + Gameplay), và runtime đọc + THỰC THI các file JSON này trong game thật.
