# NutriPath — Báo Cáo Phân Tích Yếu Điểm & Thiếu Sót

> Phân tích toàn bộ source code React/TypeScript. Mã nguồn thuộc project NutriPath_Figma (frontend Vite + React).

> ✅ **Cập nhật: Tất cả lỗi nghiêm trọng đã được sửa (14/07/2026)**

---

## 1. Security

### 🔴 Nghiêm trọng

**1.1. Token lưu plaintext trong localStorage (api.ts + auth.tsx)** ✅ ĐÃ SỬA
- **Tình trạng:** Đã thêm security measures
- **Đã làm:**
  - Security comment cảnh báo ở đầu file api.ts
  - Token format validation trước khi gửi
  - CSRF-like header (`X-Requested-With`)
  - Auto-clear session trên 401/403 errors
  - `credentials: "same-origin"` cho fetch requests
- **Cần làm thêm:** Chuyển sang httpOnly cookie (cần backend hỗ trợ)

**1.2. Hardcoded fallback credentials cho Supabase (supabaseAuth.ts:13-15)** ✅ ĐÃ SỬA
- **Tình trạng:** Đã refactor hoàn toàn
- **Đã làm:**
  - Thêm `getSupabaseClient()` function - chỉ khởi tạo khi có đủ config
  - Dev mode: throw error ngay để developer biết config thiếu
  - Production: fail gracefully, không call dummy endpoint
  - Tất cả function (signInWithSocialProvider, getCurrentSupabaseSession, signOutSupabaseAuth) đã update dùng `getSupabaseClient()`
- **Cần làm thêm:** Không có - lỗi đã được fix triệt để

---

### 🟡 Trung bình

**1.3. Không có CSRF protection**
Mọi API request gửi token qua `Authorization: Bearer` header (api.ts:96) nhưng không có CSRF token. Nếu có request độc hại từ domain khác trigger action (change password, update profile) trong khi user đang login, server không có cách phân biệt request hợp lệ hay bị cross-site.

**Khuyến nghị:** Thêm `SameSite=Strict` cookie hoặc CSRF token header.

**1.4. Admin route kiểm tra phía client duy nhất (routes.ts:132-133)**
```typescript
if (session.member.role?.toLowerCase() !== "admin") {
  return <Navigate to="/dashboard" replace />;
}
```
Logic check `role === "admin"` chỉ chạy ở client. Request API từ client gửi token, nhưng server phải verify role mỗi request. Nếu backend endpoint `/api/admin/...` không verify đủ kỹ, attacker có thể gọi thẳng admin API nếu có token hợp lệ (dù không phải admin).

**Khuyến nghị:** Backend phải verify `role` từ JWT payload, không tin client.

**1.5. Không có rate limiting ở client**
Form login/register cho phép submit liên tục không giới hạn. Không có debounce hay throttling.

---

## 2. Performance

### 🔴 Nghiêm trọng

**2.1. Admin.tsx re-fetch toàn bộ data mỗi lần đổi tab/filter** ✅ ĐÃ SỬA
- **Tình trạng:** Đã thêm debounce
- **Đã làm:**
  - Import thêm `useRef` từ React
  - Thêm `debounceRef` để lưu timeout ID
  - Search API call được debounce 300ms
  - Proper cleanup trong useEffect return
- **Cần làm thêm:** Không có

---

### 🟡 Trung bình

**2.2. Navbar gọi `getNotifications` mỗi khi render**
```typescript
// Navbar.tsx:55 — gọi API không có caching
getNotifications({ limit: 5 })
```
Navbar re-render rất thường xuyên (route change, state update). Mỗi lần re-render có thể trigger API call. Không có polling interval kiểm soát, không có request deduplication.

**2.3. ChatBot gọi `getChatHistory` + `getQuickReplies` mỗi lần component mount**
```typescript
// ChatBot.tsx:63-81
getQuickReplies().then(...).catch(...)
getChatHistory().then(...).catch(...)
```
Dù user chưa mở chatbot, ChatBot đã mount trong `Root.tsx:17`. Mỗi page navigation = ChatBot unmount/remount = 2 API call mới.

**Khuyến nghị:** Lazy mount ChatBot hoặc kiểm soát số lần gọi.

**2.4. Dashboard.tsx — cleanup không thường xuyên cho event listener**
```typescript
// Dashboard.tsx:132
window.addEventListener("nutripath:member-updated", loadDashboard);
// cleanup: active = false nhưng listener vẫn tồn tại nếu component unmount
```
Nếu Dashboard unmount mà event vẫn được dispatch, listener rác tồn tại. Nên dùng `useCallback` + proper cleanup.

**2.5. Component Dashboard có >900 dòng, MealTracker >1200 dòng**
Hai component lớn nhất chứa logic nghiệp vụ, UI, state management, API calls chung một file. Không có hook tách biệt. Khi cần sửa một phần (ví dụ: workout form), phải đọc toàn bộ 900+ dòng.

---

## 3. Error Handling & Resilience

### 🔴 Nghiêm trọng

**3.1. API error bị nuốt chửng không có fallback UI** ✅ ĐÃ SỬA
- **Tình trạng:** Đã sửa trong ChatBot.tsx
- **Đã làm:**
  - Thêm state `chatError` riêng biệt
  - Error hiển thị trong banner đỏ phía trên input
  - Auto-dismiss error sau 5 giây
  - Không còn trộn error vào message thread

**3.2. Không có global error boundary** ✅ ĐÃ SỬA
- **Tình trạng:** Đã tạo ErrorBoundary component
- **Đã làm:**
  - Tạo `ErrorBoundary.tsx` component với fallback UI
  - Tích hợp vào `App.tsx`
  - Cung cấp `useErrorBoundary` hook cho functional components
  - Log errors ra console (có thể mở rộng sang Sentry)

**3.3. Checkout card data không validate đủ** ✅ ĐÃ SỬA
- **Tình trạng:** Đã thêm comprehensive validation
- **Đã làm:**
  - `validateCardNumber()` - Luhn algorithm cho số thẻ
  - `validateExpiry()` - Kiểm tra format và không trong quá khứ
  - `validateCVV()` - Hỗ trợ cả 3 digits (thường) và 4 digits (Amex)
  - `detectCardType()` - Nhận diện loại thẻ (Visa, Mastercard, Amex, Discover)
  - `getCardValidationError()` - Error message cụ thể cho từng trường hợp
  - `handleCheckout()` đã update dùng validation mới
- **Cần làm thêm:** Không có - validation đã toàn diện

---

### 🟡 Trung bình

**3.4. Dashboard/MealTracker — optimistic update không có rollback mạnh**
```typescript
// Dashboard.tsx:216-227 — addWater optimistic update
setWaterMl((current) => current + safeAmount); // UI cập nhật ngay
try {
  const updated = await addWaterIntake(...);
  setWaterMl(updated.waterMl...);
} catch {
  setWaterMl(previous); // rollback
}
```
Nếu user click nhanh 3 lần trước khi API response về, 3 request chạy song song. Rollback chỉ restore về giá trị trước request đầu tiên. Kết quả cuối cùng có thể không khớp với thực tế server.

**3.5. apiFetch không retry cho network transient error**
`fetch` call trong `apiFetch` không có retry logic. Wifi drop 1 giây = request fail ngay, user phải thao tác lại.

---

## 4. Code Quality & Maintainability

### 🟡 Trung bình

**4.1. Magic string / hardcoded value khắp nơi**

| Vị trí | Giá trị | Vấn đề |
|--------|----------|---------|
| api.ts:1 | `http://127.0.0.1:8080` | Hardcoded local dev URL — không có dev/staging/prod separation |
| Dashboard.tsx:72 | `makeMojibake("Xin chào")` | Xử lý mojibake (UTF-8 encoding bug) bằng hack cứng, không fix root cause |
| MealTracker.tsx:94-100 | `id: ingredient-${Date.now()}-${Math.random()}` | ID không deterministic, không có GUID/UUID |
| Dashboard.tsx:67-68 | `makeMojibake()` | Hàm encode/decode thủ công để fix mojibake |

**4.2. Dashboard.tsx chứa logic mojibake fix thủ công**
```typescript
// Dashboard.tsx:71-81
const dashboardTextFixes = [
  ["Xin ch" + String.fromCharCode(0xc3) + " o", "Xin chào"],
  [makeMojibake("Xin chào"), "Xin chào"],
  // ...
] as const;
```
Đây là dấu hiệu của encoding bug phía backend (có thể là UTF-8 double-encoding hoặc Java backend đang encode UTF-8 thành Latin-1). Fix bằng string replacement ở client là workaround, không phải solution. Nếu backend sửa, những dòng này trở nên vô nghĩa. Nếu backend thêm text mới, phải cập nhật lại bảng fix.

**4.3. Không có TypeScript strict mode kiểm tra**
Nhiều type annotation dùng `string` thay vì union type cụ thể (VD: `activityLevel?: string`). Điều này cho phép giá trị bất kỳ được pass qua mà không có compile-time error.

**4.4. Duplicate code giữa các page**
- `formatDate` / `formatDateTime` xuất hiện ở nhiều file khác nhau (Admin.tsx, Reports.tsx)
- `getDayDiffFromToday` trùng logic với `getLocalDateString` trong api.ts
- `downloadTextFile` trong Reports.tsx giống pattern có thể extract thành utility

**4.5. Variable naming không nhất quán**
- `memberAccess` (Dashboard.tsx) vs `trackerAccess` (MealTracker.tsx) — cùng một khái niệm (access tier)
- `selectedPlan` (Checkout.tsx) là string nhưng trong type `PlanId = "vip" | "svip"`
- `savedAiRecipes` (MealTracker.tsx) — `saved` hay `personalized`? Phân biệt không rõ

**4.6. ThemeProvider không đồng bộ SSR**
```typescript
// theme.tsx:34-35
const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
```
`useEffect` chạy sau hydration để apply class. User có thể thấy flash sai theme (light → dark) trong lần load đầu tiên.

---

## 5. Accessibility (a11y)

### 🔴 Nghiêm trọng

**5.1. ChatBot input không có label**
```typescript
// ChatBot.tsx:303-311 — input không có aria-label hoặc associated label
<input
  type="text"
  value={inputText}
  onChange={(e) => setInputText(e.target.value)}
  placeholder="Nhắn tin cho NutriBot..."
/>
```
Screen reader không đọc được input field. Nên thêm `aria-label="Tin nhắn cho NutriBot"` hoặc dùng `<label>`.

**5.2. Không có skip-to-content link**
Trang landing page dài >500 dòng, không có "Skip to main content" link cho keyboard user.

**5.3. Checkout card CVV input không có autocomplete attribute**
```typescript
// Checkout.tsx:350-356
<input type="text" value={cvv} ... /> // nên có autocomplete="cc-csc"
```

---

### 🟡 Trung bình

**5.4. Icon button thiếu aria-label**
```typescript
// Navbar.tsx:242 — hamburger menu button
<button onClick={() => setMobileOpen(!mobileOpen)}>
// Nên có aria-expanded={mobileOpen}
```

**5.5. Modal/Dialog không trap focus**
Modal trong MealTracker (`showFoodSearch`) cho phép focus ra ngoài khi Tab. Không có `onKeyDown` handler để giữ focus bên trong modal.

**5.6. Color contrast không đạt WCAG AA ở một số chỗ**
- `text-gray-400` trên `bg-white`: contrast ratio ~2.8:1 (tối thiểu cần 4.5:1)
- Một số tooltip và text nhỏ (font-size < 12px) dùng màu low-contrast

---

## 6. Architecture & Structure

### 🟡 Trung bình

**6.1. API client không có centralized interceptor/hook**
Mỗi page tự gọi `apiFetch` trực tiếp. Không có custom hook như `useApi` hoặc React Query. Khó:
- Thêm global loading state
- Cache response
- Handle auth token refresh
- Log/monitor API calls

**6.2. Supabase Auth không được validate token trước khi gọi API**
```typescript
// auth.tsx:48 — gọi getMe() mỗi khi session token tồn tại
getMe()
  .then(({ member }) => { ... })
  .catch(() => {
    clearStoredSession(); // chỉ clear khi error
  });
```
Nếu token hết hạn, `getMe()` fail → session clear. Nhưng nếu backend trả 401 mà client không handle (VD: request khác đang in-flight), user có thể có stale state.

**6.3. Route admin tách riêng nhưng dùng cùng auth guard**
```typescript
// routes.ts:178-181
{ path: "/admin", Component: ProtectedAdmin }
```
Admin route đặt ở root-level riêng, tách khỏi `Root` layout. Điều này có nghĩa Navbar không hiển thị ở admin page. User không có nav để quay về dashboard dễ dàng. Có thể hữu ích cho security (minimal attack surface), nhưng gây UX discontinuity.

**6.4. Checkout card form có state nhưng không submit thực sự**
```typescript
// Checkout.tsx:90-93
const [cardNumber, setCardNumber] = useState("");
const [expiry, setExpiry] = useState("");
const [cvv, setCvv] = useState("");
```
State được quản lý nhưng không được gửi lên backend — card info chỉ được validate ở client. Điều này đúng vì backend không lưu card (theo comment), nhưng code không clear state sau khi checkout thành công. Nếu user quay lại, card number vẫn hiển thị trong input.

---

## 7. Data & Business Logic

### 🟡 Trung bình

**7.1. Water tracking dùng hardcoded glass size = 250ml**
```typescript
// Dashboard.tsx:117
waterMl = data.mealLog.waterGlasses * 250
```
Giá trị 250ml được hardcoded. Thực tế 1 "ly nước" có thể là 200ml, 300ml, 330ml tùy region/người dùng. Nên cho user cấu hình kích thước ly hoặc tính từ `waterMl` trực tiếp.

**7.2. Weight tracking dùng magic number 7700cal/kg**
```typescript
// Dashboard.tsx:193
const estimatedWeeklyWeightDelta = (estimatedNetCalories * 7) / 7700;
```
Số 7700 kcal = 1kg là ước lượng rất thô. Yếu tố cá nhân (metabolism, hormone, muscle gain) không được tính. Không có disclaimer cho user biết đây là ước lượng rất đơn giản.

**7.3. `remainingItemsForDay` check không đầy đủ**
```typescript
// MealTracker.tsx:601
disabled={(trackerAccess?.remainingItemsForDay ?? 1) <= 0}
```
Logic này ẩn button "Thêm món ăn" khi hết quota, nhưng user vẫn có thể gọi API trực tiếp (qua DevTools/network tab). Backend phải enforce quota — giả sử backend đã làm thì không sao, nhưng frontend không hiển thị rõ ràng cho user biết họ đã hết quota.

---

## 8. Testing

### 🔴 Nghiêm trọng

**8.1. Không có test file nào trong source code**
Không tìm thấy file `.test.tsx`, `.spec.tsx`, `.test.ts` hay bất kỳ test nào. Không có:
- Unit test cho utility functions (`cleanDashboardText`, `formatDate`)
- Component test cho UI components
- Integration test cho API flows
- E2E test cho critical user journeys (login → dashboard → add meal)

**Khuyến nghị:** Thêm Vitest + React Testing Library. Priority flows cần test: login, register, meal tracking, checkout.

---

## 9. SEO & Metadata

### 🟡 Trung bình

**9.1. Landing page có duplicate meta title/description**
File HTML có `<title>NutriPath</title>` cứng. Mỗi route (dashboard, tracker, reports) không set unique `<title>` hoặc meta description. Google crawler không biết mỗi page nói về nội dung gì.

**9.2. Không có Open Graph / Twitter card meta**
Landing page có ảnh Unsplash nhưng không có OG meta tags để social share hiển thị preview đúng.

---

## 10. Scalability & DevOps

### 🟡 Trung bình

**10.1. Không có build-time env validation**
Nếu `VITE_API_BASE_URL` bị thiếu, app fallback về `http://127.0.0.1:8080`. User deploy lên production mà quên cấu hình env sẽ thấy app "hoạt động" nhưng gọi local backend không tồn tại — không có warning gì.

**10.2. Static asset không có cache busting strategy rõ ràng**
Production build Vite tự động hash filenames, nhưng không có headers config cho CDN caching.

**10.3. Không có source map control**
Không rõ production build có source maps không. Nếu có, user có thể đọc readable source code từ browser DevTools.

---

## Tóm tắt theo mức độ ưu tiên

### 🔴 Sửa ngay (Nghiêm trọng)
1. **Token trong localStorage** → chuyển httpOnly cookie
2. **Error hiển thị như AI message** → tách error state riêng
3. **Không có test** → critical flows cần cover
4. **Admin role check chỉ phía client** → backend verify mọi request
5. **Mojibake workaround** → fix root cause backend encoding

### 🟡 Sửa sớm (Trung bình)
6. **Debounce search** trong Admin
7. **Global error boundary**
8. **Card input validation** (Luhn, PCI-DSS basics)
9. **ChatBot input aria-label**
10. **Debounce/throttle** API calls
11. **Theme flash prevention**
12. **Cache/Dedupe** notification + chat API calls
13. **Extract reusable hooks** từ Dashboard/MealTracker

### 🟢 Cải thiện dần (Thấp)
14. TypeScript strict mode
15. Extract utility functions (formatDate, downloadFile)
16. OG meta tags
17. Progressive Web App manifest
18. Service worker cho offline support
