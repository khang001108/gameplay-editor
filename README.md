# Game Editor — Tiny Swords RTS

Bộ công cụ thiết kế game, chia theo chế độ (tab trên cùng):

- **🗺 Map Editor** — vẽ terrain bằng tileset tự import, đặt building/unit lên lưới, vẽ khu vực Spawn/Trigger/Boundary.
- **⚙️ Gameplay Editor** — kéo-thả node (Event → Condition → Action), xuất ra JSON cho game runtime đọc.
- **🎨 UI Editor**, **🎮 Playtest** — chưa làm (đánh dấu "sắp có" trên tab).

Mỗi chế độ có state, Export/Load JSON, Undo/Redo riêng — đổi tên/màn hình ở đầu trang không ảnh hưởng chế độ còn lại.

## Chạy thử

```bash
npm install
npm run dev
```

Mở địa chỉ hiện ra trong terminal (mặc định `http://localhost:5173`).

Muốn dùng **☁ Lưu Cloud** (lưu online, mở lại từ máy khác) thì làm thêm theo [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — không làm thì app vẫn chạy đầy đủ, riêng nút Cloud/Đăng nhập sẽ tự ẩn.

## Build bản production

```bash
npm run build
```

Kết quả nằm trong thư mục `dist/` — có thể deploy như 1 static site bình thường (Vercel/Netlify/GitHub Pages...).

## Cách dùng — Map Editor

1. **Terrain**: tab "Terrain" ở Sidebar → nhập Tile W/H (px) — và Margin/Spacing nếu ảnh có viền/khoảng cách giữa các ô (giống Tiled) → **+ Import ảnh tileset** (PNG/JPG bất kỳ). **Kéo chuột trong bảng tile** để chọn 1 hoặc nhiều ô cùng lúc (giữ đúng bố cục đã chọn), bấm **Vẽ** rồi kéo chuột trên canvas để tô cả cụm; bấm **Xoá (Eraser)** để xoá theo cỡ tẩy 1×1/2×2/3×3.
   - **Animation cho tile**: chọn đúng 1 ô, bấm nút **🎞 Animation cho ô #...**, bấm **+ Thêm frame** rồi click 1 ô khác trong bảng để nối vào chuỗi, chỉnh thời lượng từng frame (ms). Từ đó hễ vẽ ô gốc này lên map, tile sẽ tự động chạy qua các frame (giống Tile Animation trong Tiled).
2. **Buildings / Units**: chuyển tab tương ứng, **kéo** 1 item từ Sidebar thả vào canvas để đặt. Kéo lại object đã đặt (khi đang ở tool "Chọn / Di chuyển") để di chuyển.
3. **Spawn/Area**: tab "Spawn/Area" → chọn loại (Spawn/Trigger/Boundary) → **kéo chuột** trên canvas để vẽ hình chữ nhật.
4. **Chỉnh thuộc tính**: click chọn 1 building/unit/khu vực, panel bên phải (Inspector) hiện property để sửa; không chọn gì thì Inspector hiện Map Settings (kích thước lưới, tile size).
5. **Xoá**: chọn rồi bấm phím `Delete`/`Backspace`, hoặc nút xoá trong Inspector. Phím `Esc` thoát tool vẽ hiện tại về "Chọn / Di chuyển".
6. **Lưu/Mở**: **Export JSON** / **Load JSON** ở góc trên — file JSON tự chứa cả ảnh tileset (dạng base64) nên mở lại ở máy khác không cần kèm file ảnh riêng.
7. **Undo/Redo**: nút ↶/↷ trên TopBar hoặc `Ctrl+Z` / `Ctrl+Y` (`Ctrl+Shift+Z` cũng là Redo). 1 nét vẽ/xoá terrain kéo chuột dài tính là 1 bước undo, không phải từng ô.

## Cách dùng — Gameplay Editor

1. **Kéo node** từ Sidebar bên trái thả vào Canvas ở giữa.
2. **Nối node**: rê chuột từ chấm tròn bên phải 1 node sang chấm tròn bên trái node khác.
   - `Condition` có 2 output (`true`/`false`) — nối được 2 nhánh khác nhau.
3. **Chỉnh thuộc tính**: click chọn 1 node, panel bên phải (Inspector) hiện toàn bộ property để sửa.
4. **Xoá node**: chọn node rồi bấm nút "Xoá node" trong Inspector, hoặc bấm phím `Delete`/`Backspace`.
5. **Lưu**: bấm **Export JSON** ở góc trên — tải về 1 file `.json` chứa toàn bộ graph.
6. **Mở lại**: bấm **Load JSON**, chọn đúng file đã export trước đó.
7. **Undo/Redo**: nút ↶/↷ trên TopBar hoặc `Ctrl+Z` / `Ctrl+Y`.

## Lưu Cloud (online)

Cần cấu hình Supabase trước — xem [SUPABASE_SETUP.md](./SUPABASE_SETUP.md). Sau đó:

1. **Đăng nhập/Đăng ký** ở góc phải TopBar (email + mật khẩu).
2. **☁ Lưu Cloud**: lần đầu tạo 1 bản ghi mới; bấm lại các lần sau sẽ **cập nhật** đúng bản đó (không tạo trùng).
3. **Mở Cloud**: liệt kê các map (ở Map Editor) hoặc graph (ở Gameplay Editor) đã lưu của tài khoản đang đăng nhập — bấm tên để tải lại.
4. **Autosave**: sau khi đã Lưu Cloud ít nhất 1 lần, các thay đổi tiếp theo tự lưu lại sau ~4 giây ngừng thao tác.
5. Mỗi tài khoản chỉ thấy map/graph của chính mình (Row Level Security ở Supabase).

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
  "tilesets": [{
    "id": "...", "name": "...", "imageDataUrl": "data:image/png;base64,...",
    "tileWidth": 32, "tileHeight": 32, "marginX": 0, "marginY": 0, "spacingX": 0, "spacingY": 0,
    "columns": 8, "rows": 8,
    "animations": { "5": [{ "tileIndex": 5, "duration": 200 }, { "tileIndex": 6, "duration": 200 }] }
  }],
  "terrain": [null, { "tilesetId": "...", "tileIndex": 5 }, "... (mảng phẳng, dài width×height, row-major)"],
  "objects": [{ "id": "...", "kind": "building", "defType": "townhall", "x": 2, "y": 3, "values": { "side": "player", "hp": 500 } }],
  "areas": [{ "id": "...", "kind": "spawn", "name": "Spawn 1", "team": "player", "x": 1, "y": 1, "width": 3, "height": 3 }]
}
```

## Đã làm / Chưa làm

**Đã làm**:
- **Map Editor**: import tileset ảnh bất kỳ (hỗ trợ margin/spacing kiểu Tiled, cắt lưới pixel-perfect qua canvas — không lệch/nhoè), chọn 1 hoặc nhiều ô cùng lúc để vẽ theo cụm, gắn animation nhiều frame cho từng tile (tự chạy trên canvas), đặt 6 loại building + 4 loại unit lên lưới (kéo-thả, di chuyển, chỉnh property), vẽ khu vực Spawn/Trigger/Boundary, resize map, save/load JSON (tự chứa cả ảnh tileset).
- **Gameplay Editor**: đầy đủ 3 khu vực, 14 loại node (4 Event, 2 Condition, 8 Action), kéo-thả, nối dây, chỉnh property, save/load JSON, validate khi load (bỏ qua node/edge lỗi thay vì crash).
- **Undo/Redo** riêng cho từng chế độ (nút + Ctrl+Z/Ctrl+Y), gộp nét vẽ/kéo-thả liên tục thành 1 bước.
- **Lưu Cloud**: đăng nhập qua Supabase, lưu/mở map & graph theo tài khoản, autosave khi đang làm việc.
- Tab chuyển đổi giữa các chế độ, mỗi chế độ giữ state/Export/Load riêng.

**Chưa làm**: UI Editor (thiết kế 7 màn hình), Playtest (chạy thử ghép Map + Gameplay), và runtime đọc + THỰC THI các file JSON này trong game thật.

**Lưu ý**: phần Lưu Cloud đã viết đầy đủ code (Auth + CRUD Supabase) nhưng chưa test được với project Supabase thật (cần bạn tự tạo project theo SUPABASE_SETUP.md) — nếu gặp lỗi khi thao tác thực tế, báo lại để mình sửa.
