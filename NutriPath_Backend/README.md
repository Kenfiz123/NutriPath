# NutriPath Backend

Backend REST cho FE NutriPath, dùng HAL-style HATEOAS. Mỗi response chính đều có `_links`; collection dùng `_embedded`.

## Chạy local

```bash
npm run start
```

Mặc định API chạy ở:

```text
http://127.0.0.1:8080
```

Chạy `npm install` nếu dùng Supabase PostgreSQL hoặc deploy production; local JSON mode vẫn chỉ dùng Node.js built-in modules.

## Chạy với dữ liệu SQL Server

Nếu đã import `NutriPath_Database.sql`, chạy backend bằng SQL Server source:

```powershell
$env:NUTRIPATH_DATA_SOURCE="sqlserver"
$env:NUTRIPATH_SQL_SERVER="localhost"
$env:NUTRIPATH_SQL_DATABASE="NutriPath"
node src/server.js
```

Khi đó FE vẫn gọi các API cũ, nhưng dữ liệu được load từ SQL Server lúc backend khởi động.

## Chạy với Supabase PostgreSQL

NutriPath hỗ trợ Supabase PostgreSQL bằng adapter JSONB để giữ nguyên toàn bộ API hiện tại.
Backend sẽ tự tạo và seed dòng state đầu tiên nếu bảng chưa có dữ liệu.

1. Tạo project Supabase.
2. Mở SQL Editor và chạy file `sql/nutripath_supabase_app_state.sql`.
3. Lấy connection string ở Supabase Database Settings, ưu tiên pooler URI cho server deploy.
4. Cấu hình backend:

```powershell
$env:NUTRIPATH_DATA_SOURCE="supabase"
$env:SUPABASE_DATABASE_URL="postgresql://postgres.xxxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres"
$env:NUTRIPATH_SUPABASE_TABLE="public.nutripath_app_state"
node src/server.js
```

Trên Render/Railway, đặt các biến môi trường tương tự trong dashboard. Không commit connection string hoặc database password.

## HATEOAS

Ví dụ `GET /api` trả về các link entrypoint:

```json
{
  "name": "NutriPath API",
  "_links": {
    "members": { "href": "http://127.0.0.1:8080/api/members", "method": "GET" },
    "recipes": { "href": "http://127.0.0.1:8080/api/recipes", "method": "GET" },
    "calorieCalculator": { "href": "http://127.0.0.1:8080/api/calculations/calorie", "method": "POST" }
  }
}
```

## API chính theo FE

- `GET /api/members/mem-001/dashboard?date=2026-03-13`: dashboard, macro, nước, activity, weekly chart.
- `POST /api/calculations/calorie`: tính BMR, TDEE, BMI, macro và calo đốt khi tập.
- `GET /api/foods?search=phở`: food database cho meal tracker.
- `GET /api/members/mem-001/meal-logs/2026-03-13`: nhật ký bữa ăn.
- `POST /api/members/mem-001/meal-logs/2026-03-13/meals/breakfast/items`: thêm món vào bữa ăn.
- `PATCH /api/members/mem-001/meal-logs/2026-03-13/water`: cập nhật lượng nước.
- `GET /api/recipes?tag=Low-cal&search=canh`: kho công thức.
- `GET /api/plans?billing=annual`: gói Free/VIP/SVIP kèm price preview.
- `POST /api/checkout/quote`: tính đơn hàng, VAT, mã `NUTRIPATH10`.
- `POST /api/payments`: checkout demo, nâng cấp member, không lưu dữ liệu thẻ.
- `POST /api/chat/messages`: NutriBot response.
- `GET /api/admin/overview`: dashboard admin.
- `GET /api/admin/users`: quản lý người dùng.
- `GET /api/admin/content`: content admin.
- `GET /api/admin/analytics`: chart admin.
- `GET/PATCH /api/admin/settings/ai`: cài đặt AI.
- `GET/PATCH /api/admin/security`: cài đặt bảo mật.

## Ví dụ request

```bash
curl -X POST http://127.0.0.1:8080/api/calculations/calorie \
  -H "Content-Type: application/json" \
  -d "{\"age\":25,\"weightKg\":65,\"heightCm\":168,\"gender\":\"female\",\"activityLevel\":\"light\",\"goal\":\"lose\",\"exerciseType\":\"walking\",\"durationMinutes\":30}"
```

```bash
curl -X POST http://127.0.0.1:8080/api/payments \
  -H "Content-Type: application/json" \
  -d "{\"memberId\":\"mem-001\",\"planId\":\"vip\",\"billing\":\"monthly\",\"paymentMethod\":\"card\",\"discountCode\":\"NUTRIPATH10\"}"
```

## Data store

Lần chạy đầu tiên sẽ tạo `data/db.json` từ seed data trong `src/data/seed.js`. File này được ignore để dữ liệu local không làm bẩn git.

Reset seed:

```bash
curl -X POST http://127.0.0.1:8080/api/dev/reset
```
