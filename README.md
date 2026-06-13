<p align="center">
  <img src="https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/SQL_Server-2019+-CC2927?logo=microsoftsqlserver&logoColor=white" />
</p>

# 🥗 NutriPath — Trợ Lý Dinh Dưỡng AI

NutriPath là ứng dụng quản lý dinh dưỡng thông minh sử dụng AI, giúp người dùng tính toán calo, theo dõi bữa ăn, khám phá công thức healthy và nhận tư vấn dinh dưỡng cá nhân hóa.

---

## 📁 Cấu trúc dự án

```
NutriPath/
├── NutriPath_Backend/          # REST API server (Node.js + pg for Supabase)
│   ├── src/
│   │   ├── app.js              # Core application logic (routes, handlers)
│   │   ├── server.js           # HTTP server bootstrap
│   │   ├── store.js            # Multi-source data store (JSON/SQL Server/Supabase)
│   │   ├── hateoas.js          # HAL link builder
│   │   ├── sqlserver-import.js # SQL Server data loader
│   │   └── data/seed.js        # Seed data (source of truth)
│   ├── scripts/smoke-test.js   # API smoke test
│   └── .env.example            # Environment variables template
│
├── NutriPath_Figma/            # Frontend SPA (React + Vite + TypeScript)
│   ├── src/app/
│   │   ├── pages/              # 12 pages (Landing, Dashboard, Admin, ...)
│   │   ├── components/         # Reusable components (Navbar, ChatBot, ...)
│   │   ├── api.ts              # Typed API client
│   │   ├── auth.ts             # AuthContext + useAuth hook
│   │   └── routes.ts           # React Router v7 config
│   └── vite.config.ts
│
├── NutriPath_Database.sql      # SQL Server schema + seed data
└── NutriPath_SQL_Test.sql      # SQL smoke test script
```

---

## 🚀 Quick Start

### Yêu cầu hệ thống

| Phần mềm | Phiên bản tối thiểu |
|---|---|
| **Node.js** | ≥ 18 |
| **npm** hoặc **pnpm** | bất kỳ |
| **SQL Server** *(tùy chọn)* | 2019+ |
| **sqlcmd** *(tùy chọn)* | đi kèm SQL Server |

### Bước 1 — Clone dự án

```bash
git clone <repo-url>
cd NutriPath
```

### Bước 2 — Khởi động Backend

```bash
cd NutriPath_Backend

# Copy file .env mẫu
cp .env.example .env
# Chỉnh sửa .env nếu cần (thêm GEMINI_API_KEY cho AI Chat)
npm install

# Khởi động server
npm run start
```

> **API chạy tại:** `http://127.0.0.1:8080`  
> Lần chạy đầu tiên sẽ tự tạo file `data/db.json` từ seed data.

### Bước 3 — Khởi động Frontend

```bash
cd NutriPath_Figma

# Cài dependencies
npm install

# Khởi động dev server
npm run dev
```

> **App chạy tại:** `http://127.0.0.1:5173`

### Bước 4 *(Tùy chọn)* — Thiết lập SQL Server

Nếu muốn dùng SQL Server thay vì JSON file:

```bash
# 1. Tạo database và seed data
sqlcmd -S localhost -E -i NutriPath_Database.sql

# 2. Chạy smoke test để xác nhận
sqlcmd -S localhost -E -i NutriPath_SQL_Test.sql

# 3. Cấu hình backend dùng SQL Server
# Sửa file NutriPath_Backend/.env:
#   NUTRIPATH_DATA_SOURCE=sqlserver
#   NUTRIPATH_SQL_SERVER=localhost
#   NUTRIPATH_SQL_DATABASE=NutriPath

# 4. Khởi động lại backend
cd NutriPath_Backend && npm run start
```

### Bước 5 *(Production)* — Thiết lập Supabase PostgreSQL

Supabase production dùng schema normalized, không dùng một dòng JSONB làm nguồn dữ liệu chính.

```bash
# 1. Mở Supabase SQL Editor và chạy:
NutriPath_Backend/sql/nutripath_supabase_normalized.sql

# 2. Cấu hình backend trên Render/Railway:
NUTRIPATH_DATA_SOURCE=supabase
NUTRIPATH_SUPABASE_STORAGE=normalized
NUTRIPATH_SUPABASE_SCHEMA=public
SUPABASE_DATABASE_URL=postgresql://postgres.xxxxxx:[PASSWORD]@aws-xxx.pooler.supabase.com:6543/postgres
SUPABASE_DATABASE_SSL=true
SUPABASE_DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

Backend sẽ tạo/đọc các bảng `nutripath_members`, `nutripath_foods`, `nutripath_meal_logs`, `nutripath_recipes`, `nutripath_payments`, `nutripath_chat_messages`, `nutripath_ai_safety_logs`... Nếu `public.nutripath_app_state` đã có dữ liệu cũ, lần chạy đầu sẽ dùng nó làm nguồn migrate khi các bảng normalized còn trống.

---

## ⚙️ Biến môi trường (Backend)

| Biến | Mặc định | Mô tả |
|---|---|---|
| `PORT` | `8080` | Port cho API server |
| `CORS_ORIGIN` | `http://127.0.0.1:5173` | Allowed CORS origin (Frontend URL) |
| `NUTRIPATH_DATA_SOURCE` | `json` | Nguồn dữ liệu: `json`, `sqlserver` hoặc `supabase` |
| `NUTRIPATH_DB` | `./data/db.json` | Đường dẫn file JSON database |
| `NUTRIPATH_SQL_SERVER` | `localhost` | SQL Server hostname |
| `NUTRIPATH_SQL_DATABASE` | `NutriPath` | Tên database SQL Server |
| `NUTRIPATH_SQL_TRUST_CERT` | `false` | Trust self-signed SSL cert |
| `SUPABASE_DATABASE_URL` | *(trống)* | PostgreSQL/pooler connection string từ Supabase |
| `SUPABASE_DATABASE_SSL` | `true` | Bật SSL khi kết nối Supabase PostgreSQL |
| `SUPABASE_DATABASE_SSL_REJECT_UNAUTHORIZED` | `false` | Cho phép Supabase pooler cert trong môi trường deploy |
| `SUPABASE_DATABASE_POOL_MAX` | `5` | Số kết nối PostgreSQL tối đa của backend |
| `NUTRIPATH_SUPABASE_STORAGE` | `normalized` | `normalized` dùng nhiều bảng production; `app_state`/`jsonb` chỉ cho legacy fallback |
| `NUTRIPATH_SUPABASE_SCHEMA` | `public` | Schema chứa các bảng NutriPath trên Supabase |
| `NUTRIPATH_SUPABASE_TABLE` | `public.nutripath_app_state` | Bảng legacy JSONB, chỉ dùng khi migrate hoặc bật `NUTRIPATH_SUPABASE_STORAGE=app_state` |
| `GEMINI_API_KEY` | *(trống)* | Google Gemini API key (cho AI Chat) |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model Gemini sử dụng |
| `GEMINI_RPM_LIMIT` | `5` | Rate limit requests/phút cho Gemini |
| `GEMINI_RPD_LIMIT` | `20` | Rate limit requests/ngày cho Gemini |
| `GROQ_API_KEY` | *(trống)* | Groq API key (fallback khi Gemini fail) |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | Model Groq sử dụng |
| `GROQ_RPM_LIMIT` | `30` | Rate limit requests/phút cho Groq |
| `GROQ_RPD_LIMIT` | `1000` | Rate limit requests/ngày cho Groq |
| `CHAT_ADMIN_KEY` | `TOILAKENFI` | Admin key cho chat management |

> **Lưu ý:** AI Chat sẽ dùng canned responses nếu không có API key. Khi có `GEMINI_API_KEY`, chatbot sẽ trả lời bằng AI thực.

---

## 🗺️ Kiến trúc hệ thống

```
┌─────────────────────┐       ┌──────────────────────────────────┐
│                     │       │          NutriPath Backend        │
│   React Frontend    │ HTTP  │   (Node.js REST API + pg)        │
│                     │◄─────►│                                  │
│  Vite + Tailwind v4 │       │  HAL-style HATEOAS REST API      │
│  React Router v7    │       │                                  │
│  TypeScript         │       │  ┌─────────┐    ┌─────────────┐  │
│  Recharts           │       │  │ JSON DB │ OR │ SQL/Supabase│  │
│  Lucide Icons       │       │  └─────────┘    └─────────────┘  │
│  shadcn/ui + Radix  │       │                                  │
│                     │       │  AI: Gemini / Groq (fallback)    │
└─────────────────────┘       └──────────────────────────────────┘
```

### Backend — HAL HATEOAS API

Backend sử dụng **Node.js REST API** với package `pg` khi chạy Supabase PostgreSQL production. API tuân theo chuẩn **HAL** (Hypertext Application Language):

- Mỗi response đều có `_links` để client biết các action khả dụng
- Collection responses dùng `_embedded` để chứa danh sách items
- Hỗ trợ **multi-mode data**: JSON file (dev nhanh), SQL Server hoặc Supabase PostgreSQL (production)

### Frontend — React SPA

Frontend dùng **React 18** + **Vite 6** + **TypeScript**, styling với **Tailwind CSS v4** và components từ **shadcn/ui** (Radix UI).

---

## 📄 Frontend Pages

| Route | Page | Auth? | Mô tả |
|---|---|---|---|
| `/` | Landing Page | ❌ | Trang chủ giới thiệu sản phẩm |
| `/login` | Login | ❌ | Đăng nhập |
| `/register` | Register | ❌ | Đăng ký tài khoản mới |
| `/dashboard` | Dashboard | ✅ | Tổng quan dinh dưỡng hàng ngày |
| `/calculator` | Calorie Calculator | ❌ | Máy tính BMR, TDEE, BMI, macro |
| `/tracker` | Meal Tracker | ✅ | Nhật ký bữa ăn theo ngày |
| `/recipes` | Recipes | ❌ | Kho công thức healthy |
| `/pricing` | Pricing Plans | ❌ | So sánh gói Free/VIP/SVIP |
| `/svip` | SVIP Landing | ❌ | Trang giới thiệu gói SVIP |
| `/checkout` | Checkout | ✅ | Thanh toán nâng cấp gói |
| `/member` | Member Profile | ✅ | Hồ sơ thành viên |
| `/admin` | Admin Panel | ✅ 🔒 | Quản trị hệ thống (role admin) |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới |
| `POST` | `/api/auth/login` | Đăng nhập |

### Members
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/members/:id` | Thông tin thành viên |
| `GET` | `/api/members/:id/dashboard?date=` | Dashboard dinh dưỡng |

### Meal Logs
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/members/:id/meal-logs/:date` | Nhật ký bữa ăn theo ngày |
| `POST` | `/api/members/:id/meal-logs/:date/meals/:mealId/items` | Thêm món ăn |
| `DELETE` | `/api/members/:id/meal-logs/:date/meals/:mealId/items/:itemId` | Xóa món ăn |
| `PATCH` | `/api/members/:id/meal-logs/:date/water` | Cập nhật lượng nước |

### Foods & Recipes
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/foods?search=` | Tìm kiếm thực phẩm |
| `GET` | `/api/recipes?tag=&search=` | Kho công thức (lọc tag, tìm kiếm) |

### Calculator
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/calculations/calorie` | Tính BMR, TDEE, BMI, macro, calo đốt |

### Plans & Payments
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/plans?billing=monthly|annual` | Danh sách gói + preview giá |
| `GET` | `/api/faqs` | Câu hỏi thường gặp |
| `POST` | `/api/checkout/quote` | Tính đơn hàng (VAT, mã giảm giá) |
| `POST` | `/api/payments` | Thanh toán (demo, không lưu thẻ) |

### Chat
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/chat/messages` | Gửi tin nhắn cho NutriBot AI |

### Admin
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/admin/overview` | Dashboard admin (KPIs, services) |
| `GET` | `/api/admin/users` | Quản lý người dùng |
| `GET` | `/api/admin/content` | Quản lý nội dung |
| `GET` | `/api/admin/analytics` | Thống kê & biểu đồ |
| `GET/PATCH` | `/api/admin/settings/ai` | Cài đặt AI model |
| `GET/PATCH` | `/api/admin/security` | Cài đặt bảo mật |

### Dev
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/dev/reset` | Reset database về seed data |

---

## 🗄️ Database & Seed Data

SQL Server script vẫn là baseline local/legacy. Runtime hiện tại hỗ trợ JSON dev, SQL Server và Supabase PostgreSQL normalized; catalog seed chính nằm trong `NutriPath_Backend/src/data/seed.js`.

### Bảng dữ liệu chính

| Bảng | Mô tả | Seed rows |
|---|---|---|
| `Members` | Thông tin thành viên | 1 |
| `AuthCredentials` | Mật khẩu hash (PBKDF2 + salt) | runtime |
| `Subscriptions` | Đăng ký gói thành viên | 1 |
| `Foods` | Cơ sở dữ liệu thực phẩm Việt, đồ uống healthy và món phổ biến | 75 |
| `MealLogs` | Nhật ký bữa ăn theo ngày | 1 |
| `MealSections` | Các bữa (sáng/trưa/tối/phụ) | 4 |
| `MealItems` | Món ăn trong từng bữa | 8 |
| `Goals` | Mục tiêu hàng ngày | 4 |
| `WeeklyProgress` | Tiến trình calo tuần | 7 |
| `Recipes` | Công thức nấu ăn và đồ uống healthy | 11 |
| `RecipeTags` | Tag phân loại công thức | runtime |
| `RecipeIngredients` | Nguyên liệu | runtime |
| `RecipeSteps` | Các bước nấu | runtime |
| `Plans` | Gói Free/VIP/SVIP | 3 |
| `PlanFeatures` | Tính năng của mỗi gói | 12 |
| `Payments` | Lịch sử thanh toán | 3 |
| `Faqs` | Câu hỏi thường gặp | 4 |

### Bảng hỗ trợ

| Bảng | Mô tả |
|---|---|
| `ActivityLevels` | 5 mức hoạt động (sedentary → very_active) |
| `ExerciseTypes` | 8 loại bài tập + calories/phút |
| `ChatQuickReplies` | Gợi ý nhanh cho chatbot |
| `ChatCannedResponses` | Câu trả lời mẫu (khi không có AI key) |
| `AdminUsers`, `AdminKpis`, `AdminSystemServices` | Data cho Admin panel |
| `AdminAiSettings`, `AdminSecuritySettings` | Cài đặt hệ thống |
| `LoginActivity` | Log đăng nhập |

### Khởi tạo database

```bash
# Tạo DB + seed data
sqlcmd -S <server> -E -i NutriPath_Database.sql

# Kiểm tra
sqlcmd -S <server> -E -i NutriPath_SQL_Test.sql
```

---

## 🔐 Authentication

Hệ thống sử dụng **PBKDF2** để hash mật khẩu:

1. **Đăng ký** (`POST /api/auth/register`): Backend tạo salt ngẫu nhiên, hash password bằng PBKDF2 (100,000 iterations, SHA-512), lưu vào `AuthCredentials`
2. **Đăng nhập** (`POST /api/auth/login`): Backend hash password input với salt đã lưu, so sánh hash
3. **Session**: Bearer token được lưu trong `localStorage` phía client, gửi qua header `Authorization`
4. **Phân quyền**: `role: "member"` → user bình thường, `role: "admin"` → truy cập Admin panel

### Tài khoản mẫu

Seed data có 1 member (`mem-001` — Minh An) nhưng **không có password seed** vì lý do bảo mật.  
→ Hãy **đăng ký tài khoản mới** qua trang `/register` khi sử dụng.

---

## 🤖 AI Chat (NutriBot)

Chatbot dinh dưỡng hỗ trợ 2 chế độ:

| Chế độ | Điều kiện | Mô tả |
|---|---|---|
| **Canned** | Không có API key | Trả lời từ `ChatCannedResponses` |
| **AI thực** | Có `GEMINI_API_KEY` | Gọi Google Gemini (fallback Groq) |

AI Chat có tích hợp:
- **Rate limiting**: Giới hạn requests/phút và requests/ngày
- **Safety filtering**: Chặn prompt injection, nội dung không an toàn
- **Fallback**: Gemini → Groq → Canned responses

---

## 🛠️ Scripts hữu ích

### Backend

```bash
# Chạy development mode (auto-reload)
npm run dev

# Chạy production
npm run start

# Kiểm tra syntax tất cả file
npm run check

# Chạy API smoke test
npm run test:smoke

# Reset database về seed data
curl -X POST http://127.0.0.1:8080/api/dev/reset
```

### Frontend

```bash
# Chạy development mode
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

---

## 👥 Hướng dẫn cho Team

### Lần đầu setup dự án

```bash
# 1. Clone repo
git clone <repo-url> && cd NutriPath

# 2. Backend
cd NutriPath_Backend
cp .env.example .env
# Chỉnh sửa .env: thêm GEMINI_API_KEY nếu muốn AI Chat thực
npm install
npm run start

# 3. Frontend (terminal mới)
cd NutriPath_Figma
npm install
npm run dev

# 4. (Tùy chọn) SQL Server
sqlcmd -S localhost -E -i NutriPath_Database.sql
sqlcmd -S localhost -E -i NutriPath_SQL_Test.sql
```

### Chuyển sang SQL Server mode

```powershell
# PowerShell
$env:NUTRIPATH_DATA_SOURCE="sqlserver"
$env:NUTRIPATH_SQL_SERVER="localhost"
$env:NUTRIPATH_SQL_DATABASE="NutriPath"
node src/server.js
```

```bash
# Bash / macOS / Linux
NUTRIPATH_DATA_SOURCE=sqlserver \
NUTRIPATH_SQL_SERVER=localhost \
NUTRIPATH_SQL_DATABASE=NutriPath \
node src/server.js
```

---

## 📌 Lưu ý kỹ thuật

- **Backend cần `npm install` khi deploy/production**: Supabase PostgreSQL dùng package `pg`; local JSON mode vẫn chạy nhẹ và tự tạo `data/db.json`.
- **Data file bị gitignore**: `data/db.json` không được commit, sẽ tự tạo lần chạy đầu
- **File `.env` bị gitignore**: Mỗi dev cần tạo từ `.env.example`
- **Multi-mode data**: Cùng API, có thể chuyển giữa JSON, SQL Server và Supabase PostgreSQL qua env
- **Admin page (85KB)**: File `Admin.tsx` khá lớn, cân nhắc chia nhỏ nếu cần mở rộng
- **Khi sửa SQL logic**: Luôn đồng bộ với các hàm trong `app.js` và `sqlserver-import.js`

---

## 📄 License

© 2026 NutriPath. All rights reserved.
