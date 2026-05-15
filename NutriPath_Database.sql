/*
  NutriPath SQL Server schema + seed data
  Run with SQL Server Management Studio or:
  sqlcmd -S localhost -E -i NutriPath_Database.sql
*/

IF DB_ID(N'NutriPath') IS NULL
BEGIN
  CREATE DATABASE NutriPath;
END;
GO

USE NutriPath;
GO

SET NOCOUNT ON;
GO

DROP TABLE IF EXISTS dbo.LoginActivity;
DROP TABLE IF EXISTS dbo.AuthCredentials;
DROP TABLE IF EXISTS dbo.AdminSecuritySettings;
DROP TABLE IF EXISTS dbo.AdminAiSettings;
DROP TABLE IF EXISTS dbo.AdminSystemServices;
DROP TABLE IF EXISTS dbo.AdminKpis;
DROP TABLE IF EXISTS dbo.AdminUsers;
DROP TABLE IF EXISTS dbo.ChatCannedResponses;
DROP TABLE IF EXISTS dbo.ChatQuickReplies;
DROP TABLE IF EXISTS dbo.Payments;
DROP TABLE IF EXISTS dbo.RecipeSteps;
DROP TABLE IF EXISTS dbo.RecipeIngredients;
DROP TABLE IF EXISTS dbo.RecipeTags;
DROP TABLE IF EXISTS dbo.Recipes;
DROP TABLE IF EXISTS dbo.WeeklyProgress;
DROP TABLE IF EXISTS dbo.Goals;
DROP TABLE IF EXISTS dbo.MealItems;
DROP TABLE IF EXISTS dbo.MealSections;
DROP TABLE IF EXISTS dbo.MealLogs;
DROP TABLE IF EXISTS dbo.Foods;
DROP TABLE IF EXISTS dbo.Subscriptions;
DROP TABLE IF EXISTS dbo.Members;
DROP TABLE IF EXISTS dbo.PlanFeatures;
DROP TABLE IF EXISTS dbo.Faqs;
DROP TABLE IF EXISTS dbo.Plans;
DROP TABLE IF EXISTS dbo.ExerciseTypes;
DROP TABLE IF EXISTS dbo.ActivityLevels;
GO

CREATE TABLE dbo.ActivityLevels (
  id NVARCHAR(30) NOT NULL PRIMARY KEY,
  label NVARCHAR(100) NOT NULL,
  description NVARCHAR(255) NOT NULL,
  multiplier DECIMAL(6, 3) NOT NULL
);

CREATE TABLE dbo.ExerciseTypes (
  id NVARCHAR(30) NOT NULL PRIMARY KEY,
  label NVARCHAR(100) NOT NULL,
  calories_per_minute DECIMAL(6, 2) NOT NULL
);

CREATE TABLE dbo.Plans (
  id NVARCHAR(20) NOT NULL PRIMARY KEY,
  name NVARCHAR(50) NOT NULL,
  monthly_price INT NOT NULL,
  period NVARCHAR(50) NOT NULL,
  description NVARCHAR(255) NOT NULL
);

CREATE TABLE dbo.PlanFeatures (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  plan_id NVARCHAR(20) NOT NULL,
  label NVARCHAR(255) NOT NULL,
  included BIT NOT NULL,
  CONSTRAINT FK_PlanFeatures_Plans FOREIGN KEY (plan_id) REFERENCES dbo.Plans(id)
);

CREATE TABLE dbo.Members (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  name NVARCHAR(120) NOT NULL,
  email NVARCHAR(255) NOT NULL UNIQUE,
  initials NVARCHAR(10) NOT NULL,
  role NVARCHAR(30) NOT NULL DEFAULT N'member',
  status NVARCHAR(30) NOT NULL DEFAULT N'active',
  tier NVARCHAR(20) NOT NULL,
  gender NVARCHAR(20) NOT NULL,
  age INT NOT NULL,
  weight_kg DECIMAL(6, 2) NOT NULL,
  height_cm DECIMAL(6, 2) NOT NULL,
  activity_level_id NVARCHAR(30) NOT NULL,
  goal NVARCHAR(30) NOT NULL,
  joined_at DATE NOT NULL,
  calorie_target INT NOT NULL,
  protein_target DECIMAL(6, 1) NOT NULL,
  carbs_target DECIMAL(6, 1) NOT NULL,
  fat_target DECIMAL(6, 1) NOT NULL,
  water_target_glasses INT NOT NULL,
  member_days INT NOT NULL DEFAULT 0,
  saved_recipes INT NOT NULL DEFAULT 0,
  ai_conversations INT NOT NULL DEFAULT 0,
  tracked_calories INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  CONSTRAINT FK_Members_ActivityLevels FOREIGN KEY (activity_level_id) REFERENCES dbo.ActivityLevels(id),
  CONSTRAINT FK_Members_Plans FOREIGN KEY (tier) REFERENCES dbo.Plans(id)
);

CREATE TABLE dbo.AuthCredentials (
  id NVARCHAR(60) NOT NULL PRIMARY KEY,
  member_id NVARCHAR(40) NOT NULL,
  email NVARCHAR(255) NOT NULL UNIQUE,
  password_hash NVARCHAR(255) NOT NULL,
  password_salt NVARCHAR(255) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_AuthCredentials_Members FOREIGN KEY (member_id) REFERENCES dbo.Members(id)
);

CREATE TABLE dbo.Subscriptions (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  member_id NVARCHAR(40) NOT NULL,
  plan_id NVARCHAR(20) NOT NULL,
  billing NVARCHAR(30) NOT NULL,
  status NVARCHAR(30) NOT NULL,
  started_at DATE NOT NULL,
  renews_at DATE NULL,
  days_total INT NULL,
  days_remaining INT NULL,
  CONSTRAINT FK_Subscriptions_Members FOREIGN KEY (member_id) REFERENCES dbo.Members(id),
  CONSTRAINT FK_Subscriptions_Plans FOREIGN KEY (plan_id) REFERENCES dbo.Plans(id)
);

CREATE TABLE dbo.Foods (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  name NVARCHAR(160) NOT NULL,
  category NVARCHAR(80) NOT NULL,
  calories DECIMAL(8, 1) NOT NULL,
  protein DECIMAL(8, 1) NOT NULL,
  carbs DECIMAL(8, 1) NOT NULL,
  fat DECIMAL(8, 1) NOT NULL,
  portion NVARCHAR(120) NOT NULL
);

CREATE TABLE dbo.MealLogs (
  id NVARCHAR(80) NOT NULL PRIMARY KEY,
  member_id NVARCHAR(40) NOT NULL,
  log_date DATE NOT NULL,
  water_glasses INT NOT NULL DEFAULT 0,
  steps INT NOT NULL DEFAULT 0,
  burned_calories INT NOT NULL DEFAULT 0,
  active_minutes INT NOT NULL DEFAULT 0,
  CONSTRAINT UQ_MealLogs_Member_Date UNIQUE (member_id, log_date),
  CONSTRAINT FK_MealLogs_Members FOREIGN KEY (member_id) REFERENCES dbo.Members(id)
);

CREATE TABLE dbo.MealSections (
  id NVARCHAR(40) NOT NULL,
  meal_log_id NVARCHAR(80) NOT NULL,
  name NVARCHAR(80) NOT NULL,
  icon NVARCHAR(40) NOT NULL,
  target_kcal INT NOT NULL,
  meal_time TIME NOT NULL,
  CONSTRAINT PK_MealSections PRIMARY KEY (id, meal_log_id),
  CONSTRAINT FK_MealSections_MealLogs FOREIGN KEY (meal_log_id) REFERENCES dbo.MealLogs(id)
);

CREATE TABLE dbo.MealItems (
  id NVARCHAR(60) NOT NULL PRIMARY KEY,
  meal_log_id NVARCHAR(80) NOT NULL,
  meal_section_id NVARCHAR(40) NOT NULL,
  food_id NVARCHAR(40) NULL,
  name NVARCHAR(160) NOT NULL,
  calories DECIMAL(8, 1) NOT NULL,
  protein DECIMAL(8, 1) NOT NULL,
  carbs DECIMAL(8, 1) NOT NULL,
  fat DECIMAL(8, 1) NOT NULL,
  portion NVARCHAR(120) NOT NULL,
  quantity DECIMAL(8, 2) NOT NULL DEFAULT 1,
  CONSTRAINT FK_MealItems_Sections FOREIGN KEY (meal_section_id, meal_log_id) REFERENCES dbo.MealSections(id, meal_log_id),
  CONSTRAINT FK_MealItems_Foods FOREIGN KEY (food_id) REFERENCES dbo.Foods(id)
);

CREATE TABLE dbo.Goals (
  id NVARCHAR(40) NOT NULL,
  meal_log_id NVARCHAR(80) NOT NULL,
  label NVARCHAR(120) NOT NULL,
  done BIT NOT NULL,
  CONSTRAINT PK_Goals PRIMARY KEY (id, meal_log_id),
  CONSTRAINT FK_Goals_MealLogs FOREIGN KEY (meal_log_id) REFERENCES dbo.MealLogs(id)
);

CREATE TABLE dbo.WeeklyProgress (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  member_id NVARCHAR(40) NOT NULL,
  progress_date DATE NOT NULL,
  day_label NVARCHAR(10) NOT NULL,
  consumed INT NOT NULL,
  target INT NOT NULL,
  CONSTRAINT FK_WeeklyProgress_Members FOREIGN KEY (member_id) REFERENCES dbo.Members(id)
);

CREATE TABLE dbo.Recipes (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  name NVARCHAR(180) NOT NULL,
  image_url NVARCHAR(1000) NULL,
  time_minutes INT NOT NULL,
  calories INT NOT NULL,
  difficulty INT NOT NULL,
  servings INT NOT NULL,
  protein DECIMAL(8, 1) NOT NULL,
  carbs DECIMAL(8, 1) NOT NULL,
  fat DECIMAL(8, 1) NOT NULL,
  fiber DECIMAL(8, 1) NOT NULL
);

CREATE TABLE dbo.RecipeTags (
  recipe_id NVARCHAR(40) NOT NULL,
  tag NVARCHAR(80) NOT NULL,
  CONSTRAINT PK_RecipeTags PRIMARY KEY (recipe_id, tag),
  CONSTRAINT FK_RecipeTags_Recipes FOREIGN KEY (recipe_id) REFERENCES dbo.Recipes(id)
);

CREATE TABLE dbo.RecipeIngredients (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  recipe_id NVARCHAR(40) NOT NULL,
  name NVARCHAR(160) NOT NULL,
  amount NVARCHAR(100) NOT NULL,
  sort_order INT NOT NULL,
  CONSTRAINT FK_RecipeIngredients_Recipes FOREIGN KEY (recipe_id) REFERENCES dbo.Recipes(id)
);

CREATE TABLE dbo.RecipeSteps (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  recipe_id NVARCHAR(40) NOT NULL,
  step_order INT NOT NULL,
  instruction NVARCHAR(1000) NOT NULL,
  CONSTRAINT FK_RecipeSteps_Recipes FOREIGN KEY (recipe_id) REFERENCES dbo.Recipes(id)
);

CREATE TABLE dbo.Payments (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  member_id NVARCHAR(40) NOT NULL,
  invoice NVARCHAR(50) NOT NULL UNIQUE,
  plan_id NVARCHAR(20) NOT NULL,
  billing NVARCHAR(30) NOT NULL,
  payment_method NVARCHAR(30) NULL,
  amount INT NOT NULL,
  currency NVARCHAR(10) NOT NULL DEFAULT N'VND',
  status NVARCHAR(30) NOT NULL,
  paid_at DATETIME2 NOT NULL,
  CONSTRAINT FK_Payments_Members FOREIGN KEY (member_id) REFERENCES dbo.Members(id),
  CONSTRAINT FK_Payments_Plans FOREIGN KEY (plan_id) REFERENCES dbo.Plans(id)
);

CREATE TABLE dbo.Faqs (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  question NVARCHAR(255) NOT NULL,
  answer NVARCHAR(1000) NOT NULL
);

CREATE TABLE dbo.ChatQuickReplies (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  text NVARCHAR(255) NOT NULL
);

CREATE TABLE dbo.ChatCannedResponses (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  prompt NVARCHAR(255) NOT NULL UNIQUE,
  response NVARCHAR(2000) NOT NULL
);

CREATE TABLE dbo.AdminUsers (
  id NVARCHAR(20) NOT NULL PRIMARY KEY,
  name NVARCHAR(120) NOT NULL,
  email NVARCHAR(255) NOT NULL,
  role NVARCHAR(50) NOT NULL,
  status NVARCHAR(30) NOT NULL,
  joined_at DATE NOT NULL,
  plan_name NVARCHAR(50) NOT NULL
);

CREATE TABLE dbo.AdminKpis (
  id NVARCHAR(50) NOT NULL PRIMARY KEY,
  label NVARCHAR(120) NOT NULL,
  value DECIMAL(12, 2) NOT NULL,
  change_text NVARCHAR(30) NOT NULL
);

CREATE TABLE dbo.AdminSystemServices (
  id NVARCHAR(40) NOT NULL PRIMARY KEY,
  name NVARCHAR(120) NOT NULL,
  status NVARCHAR(30) NOT NULL,
  uptime NVARCHAR(20) NOT NULL,
  latency_ms INT NOT NULL
);

CREATE TABLE dbo.AdminAiSettings (
  id INT NOT NULL PRIMARY KEY CHECK (id = 1),
  model NVARCHAR(100) NOT NULL,
  auto_portion_recommendation BIT NOT NULL,
  smart_meal_suggestions BIT NOT NULL,
  nutrition_validation BIT NOT NULL,
  confidence_threshold INT NOT NULL,
  calorie_formula NVARCHAR(255) NOT NULL
);

CREATE TABLE dbo.AdminSecuritySettings (
  id INT NOT NULL PRIMARY KEY CHECK (id = 1),
  two_factor_enabled BIT NOT NULL,
  min_password_length INT NOT NULL,
  require_special_char BIT NOT NULL,
  require_uppercase BIT NOT NULL,
  require_number BIT NOT NULL
);

CREATE TABLE dbo.LoginActivity (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  ip NVARCHAR(80) NOT NULL,
  device NVARCHAR(120) NOT NULL,
  location NVARCHAR(120) NOT NULL,
  login_time DATETIME2 NOT NULL,
  status NVARCHAR(30) NOT NULL
);
GO

INSERT INTO dbo.ActivityLevels (id, label, description, multiplier) VALUES
(N'sedentary', N'Ít vận động', N'Ngồi văn phòng, ít hoặc không tập', 1.200),
(N'light', N'Nhẹ nhàng', N'Tập nhẹ 1-3 ngày/tuần', 1.375),
(N'moderate', N'Vừa phải', N'Tập vừa 3-5 ngày/tuần', 1.550),
(N'active', N'Năng động', N'Tập nặng 6-7 ngày/tuần', 1.725),
(N'very_active', N'Rất năng động', N'Tập rất nặng hoặc vận động viên', 1.900);

INSERT INTO dbo.ExerciseTypes (id, label, calories_per_minute) VALUES
(N'walking', N'Đi bộ', 5),
(N'running', N'Chạy bộ', 10),
(N'cycling', N'Đạp xe', 8),
(N'swimming', N'Bơi lội', 9),
(N'yoga', N'Yoga', 4),
(N'hiit', N'HIIT', 12),
(N'gym', N'Gym (cơ)', 7),
(N'badminton', N'Cầu lông', 8);

INSERT INTO dbo.Plans (id, name, monthly_price, period, description) VALUES
(N'free', N'Free', 0, N'mãi mãi', N'Khởi đầu hành trình sức khỏe của bạn'),
(N'vip', N'VIP', 99000, N'tháng', N'Nâng cao sức khỏe với đầy đủ tính năng'),
(N'svip', N'SVIP', 199000, N'tháng', N'Trải nghiệm đỉnh cao với AI Coach cá nhân');

INSERT INTO dbo.PlanFeatures (plan_id, label, included) VALUES
(N'free', N'Máy tính calo cơ bản', 1),
(N'free', N'5 công thức / tháng', 1),
(N'free', N'AI chat giới hạn (5 tin/ngày)', 1),
(N'free', N'Theo dõi calo không giới hạn', 0),
(N'vip', N'Công thức không giới hạn', 1),
(N'vip', N'Theo dõi calo không giới hạn', 1),
(N'vip', N'50 tin nhắn AI / ngày', 1),
(N'vip', N'AI Coach dinh dưỡng cá nhân', 0),
(N'svip', N'Tất cả tính năng VIP', 1),
(N'svip', N'AI chat không giới hạn', 1),
(N'svip', N'AI Coach dinh dưỡng cá nhân', 1),
(N'svip', N'Hỗ trợ ưu tiên 24/7', 1);

INSERT INTO dbo.Members (
  id, name, email, initials, role, status, tier, gender, age, weight_kg, height_cm,
  activity_level_id, goal, joined_at, calorie_target, protein_target, carbs_target,
  fat_target, water_target_glasses, member_days, saved_recipes, ai_conversations,
  tracked_calories, streak_days
) VALUES (
  N'mem-001', N'Minh An', N'minha@email.com', N'MA', N'member', N'active',
  N'svip', N'female', 25, 65, 168, N'light', N'lose', '2025-12-13',
  1800, 120, 220, 60, 8, 127, 43, 89, 38240, 7
);

INSERT INTO dbo.Subscriptions (member_id, plan_id, billing, status, started_at, renews_at, days_total, days_remaining) VALUES
(N'mem-001', N'svip', N'annual', N'active', '2025-12-13', '2027-03-13', 730, 365);

INSERT INTO dbo.Foods (id, name, category, calories, protein, carbs, fat, portion) VALUES
(N'food-001', N'Phở bò tái tô nhỏ', N'Súp & Cháo', 320, 22, 48, 5, N'1 tô nhỏ (400ml)'),
(N'food-002', N'Cháo gà gừng', N'Súp & Cháo', 280, 18, 38, 5, N'1 tô (350g)'),
(N'food-003', N'Cơm tấm sườn nướng', N'Cơm', 480, 28, 55, 14, N'1 đĩa (350g)'),
(N'food-004', N'Bún chả Hà Nội', N'Bún', 420, 26, 52, 11, N'1 phần (350g)'),
(N'food-005', N'Gỏi cuốn tôm thịt', N'Gỏi & Salad', 75, 6, 10, 1.5, N'1 cuốn (80g)'),
(N'food-006', N'Canh chua cá lóc', N'Canh', 210, 24, 16, 4, N'1 bát (300ml)'),
(N'food-007', N'Rau muống xào tỏi', N'Rau củ', 120, 4, 10, 6, N'1 đĩa (150g)'),
(N'food-008', N'Đậu phụ sốt cà chua', N'Món chay', 195, 14, 12, 10, N'1 đĩa (200g)'),
(N'food-009', N'Cơm gạo lứt trắng', N'Cơm', 216, 5, 45, 1.8, N'1 chén (180g)'),
(N'food-010', N'Thịt gà luộc xé', N'Protein', 165, 31, 0, 3.6, N'100g'),
(N'food-011', N'Trứng ốp la', N'Protein', 96, 7, 0.5, 7, N'1 quả (60g)'),
(N'food-012', N'Canh rau muống', N'Canh', 60, 3, 8, 1, N'1 bát (250ml)'),
(N'food-013', N'Bún bò Huế tô nhỏ', N'Bún', 380, 24, 50, 8, N'1 tô nhỏ (450ml)'),
(N'food-014', N'Bánh mì kẹp thịt', N'Bánh mì', 320, 18, 38, 10, N'1 ổ (120g)'),
(N'food-015', N'Xôi đậu xanh', N'Xôi', 280, 8, 52, 4, N'1 gói (200g)');

INSERT INTO dbo.MealLogs (id, member_id, log_date, water_glasses, steps, burned_calories, active_minutes) VALUES
(N'log-mem-001-2026-03-13', N'mem-001', '2026-03-13', 5, 6420, 320, 45);

INSERT INTO dbo.MealSections (id, meal_log_id, name, icon, target_kcal, meal_time) VALUES
(N'breakfast', N'log-mem-001-2026-03-13', N'Bữa sáng', N'sunrise', 450, '07:30'),
(N'lunch', N'log-mem-001-2026-03-13', N'Bữa trưa', N'sun', 620, '12:00'),
(N'dinner', N'log-mem-001-2026-03-13', N'Bữa tối', N'moon', 500, '18:30'),
(N'snack', N'log-mem-001-2026-03-13', N'Bữa phụ', N'orange', 200, '15:30');

INSERT INTO dbo.MealItems (id, meal_log_id, meal_section_id, food_id, name, calories, protein, carbs, fat, portion, quantity) VALUES
(N'item-101', N'log-mem-001-2026-03-13', N'breakfast', N'food-002', N'Cháo gà gừng', 280, 18, 38, 5, N'1 tô (350g)', 1),
(N'item-102', N'log-mem-001-2026-03-13', N'breakfast', N'food-011', N'Trứng ốp la', 96, 7, 0.5, 7, N'1 quả (60g)', 1),
(N'item-103', N'log-mem-001-2026-03-13', N'breakfast', N'food-012', N'Canh rau muống', 60, 3, 8, 1, N'1 bát nhỏ', 1),
(N'item-201', N'log-mem-001-2026-03-13', N'lunch', N'food-009', N'Cơm gạo lứt trắng', 216, 5, 45, 1.8, N'1 chén (180g)', 1),
(N'item-202', N'log-mem-001-2026-03-13', N'lunch', N'food-010', N'Thịt gà luộc xé', 165, 31, 0, 3.6, N'100g', 1),
(N'item-203', N'log-mem-001-2026-03-13', N'lunch', N'food-007', N'Rau muống xào tỏi', 120, 4, 10, 6, N'1 đĩa (150g)', 1),
(N'item-204', N'log-mem-001-2026-03-13', N'lunch', N'food-006', N'Canh chua cá lóc', 210, 24, 16, 4, N'1 bát (300ml)', 1),
(N'item-401', N'log-mem-001-2026-03-13', N'snack', N'food-005', N'Gỏi cuốn tôm thịt', 150, 12, 20, 3, N'2 cuốn (160g)', 2);

INSERT INTO dbo.Goals (id, meal_log_id, label, done) VALUES
(N'calories', N'log-mem-001-2026-03-13', N'Calo nạp vào', 1),
(N'water', N'log-mem-001-2026-03-13', N'Uống đủ nước', 0),
(N'exercise', N'log-mem-001-2026-03-13', N'Tập thể dục', 1),
(N'journal', N'log-mem-001-2026-03-13', N'Ghi nhật ký', 1);

INSERT INTO dbo.WeeklyProgress (member_id, progress_date, day_label, consumed, target) VALUES
(N'mem-001', '2026-03-09', N'T2', 1620, 1800),
(N'mem-001', '2026-03-10', N'T3', 1880, 1800),
(N'mem-001', '2026-03-11', N'T4', 1420, 1800),
(N'mem-001', '2026-03-12', N'T5', 1750, 1800),
(N'mem-001', '2026-03-13', N'T6', 1340, 1800),
(N'mem-001', '2026-03-14', N'T7', 0, 1800),
(N'mem-001', '2026-03-15', N'CN', 0, 1800);

INSERT INTO dbo.Recipes (id, name, image_url, time_minutes, calories, difficulty, servings, protein, carbs, fat, fiber) VALUES
(N'recipe-001', N'Phở Bò Tái Chín Truyền Thống', N'https://images.unsplash.com/photo-1719677775416-1dd6a93f1a73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', 30, 380, 2, 2, 28, 48, 6, 2),
(N'recipe-002', N'Cơm Tấm Sườn Nướng Bì Chả', N'https://images.unsplash.com/photo-1760888549075-0b9727e07735?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', 40, 520, 3, 2, 34, 58, 18, 2),
(N'recipe-003', N'Bún Chả Hà Nội Chính Gốc', N'https://images.unsplash.com/photo-1587496579013-90f32e3ea9d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', 35, 420, 2, 2, 30, 52, 12, 4),
(N'recipe-004', N'Cháo Gà Gừng Hành Bổ Dưỡng', N'https://images.unsplash.com/photo-1650562075965-4940a2cfbfe4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', 45, 280, 1, 3, 22, 38, 5, 1),
(N'recipe-005', N'Gỏi Cuốn Tôm Thịt Sốt Tương', N'https://images.unsplash.com/photo-1734771573616-7cb630b439bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', 25, 220, 2, 3, 18, 30, 4, 3),
(N'recipe-006', N'Canh Chua Cá Lóc Miền Nam', N'https://images.unsplash.com/photo-1665116582773-51394e546f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', 30, 210, 2, 3, 26, 16, 4, 5),
(N'recipe-007', N'Rau Muống Xào Tỏi Thơm Giòn', N'https://images.unsplash.com/photo-1594916107106-4837e3ed0e6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', 10, 120, 1, 2, 4, 10, 6, 4),
(N'recipe-008', N'Đậu Phụ Sốt Cà Chua Hành Lá', N'https://images.unsplash.com/photo-1692296979410-0ef15ccebc62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', 20, 195, 1, 2, 14, 12, 10, 3);

INSERT INTO dbo.RecipeTags (recipe_id, tag) VALUES
(N'recipe-001', N'High-protein'), (N'recipe-001', N'<30 mins'),
(N'recipe-002', N'High-protein'),
(N'recipe-003', N'High-protein'), (N'recipe-003', N'<30 mins'),
(N'recipe-004', N'Low-cal'), (N'recipe-004', N'<30 mins'),
(N'recipe-005', N'Low-cal'), (N'recipe-005', N'High-protein'), (N'recipe-005', N'<30 mins'),
(N'recipe-006', N'Low-cal'), (N'recipe-006', N'High-protein'), (N'recipe-006', N'<30 mins'),
(N'recipe-007', N'Low-cal'), (N'recipe-007', N'Vegetarian'), (N'recipe-007', N'<30 mins'),
(N'recipe-008', N'Low-cal'), (N'recipe-008', N'Vegetarian'), (N'recipe-008', N'<30 mins');

INSERT INTO dbo.RecipeIngredients (recipe_id, name, amount, sort_order) VALUES
(N'recipe-001', N'Bánh phở tươi', N'300g', 1), (N'recipe-001', N'Thịt bò tái', N'150g', 2), (N'recipe-001', N'Nước dùng xương bò', N'1 lít', 3),
(N'recipe-002', N'Cơm tấm', N'300g', 1), (N'recipe-002', N'Sườn heo non', N'300g', 2), (N'recipe-002', N'Dưa chua', N'50g', 3),
(N'recipe-003', N'Bún tươi', N'300g', 1), (N'recipe-003', N'Thịt ba chỉ', N'200g', 2), (N'recipe-003', N'Rau sống', N'1 mớ', 3),
(N'recipe-004', N'Gạo tẻ', N'150g', 1), (N'recipe-004', N'Gà', N'300g', 2), (N'recipe-004', N'Gừng', N'3 lát', 3),
(N'recipe-005', N'Bánh tráng', N'10 tờ', 1), (N'recipe-005', N'Tôm luộc', N'200g', 2), (N'recipe-005', N'Thịt nạc luộc', N'150g', 3),
(N'recipe-006', N'Cá lóc', N'400g', 1), (N'recipe-006', N'Cà chua', N'2 quả', 2), (N'recipe-006', N'Me chua', N'2 muỗng', 3),
(N'recipe-007', N'Rau muống', N'400g', 1), (N'recipe-007', N'Tỏi', N'4 tép', 2), (N'recipe-007', N'Dầu ăn', N'2 muỗng', 3),
(N'recipe-008', N'Đậu phụ trắng', N'300g', 1), (N'recipe-008', N'Cà chua', N'3 quả', 2), (N'recipe-008', N'Hành lá', N'3 cọng', 3);

INSERT INTO dbo.RecipeSteps (recipe_id, step_order, instruction) VALUES
(N'recipe-001', 1, N'Nướng hành tây và gừng đến khi dậy mùi thơm.'), (N'recipe-001', 2, N'Đun nước dùng với hoa hồi, quế, gừng và hành nướng.'), (N'recipe-001', 3, N'Trụng bánh phở, xếp thịt bò, chan nước dùng sôi và thêm rau thơm.'),
(N'recipe-002', 1, N'Ướp sườn với nước mắm, đường, tỏi, sả.'), (N'recipe-002', 2, N'Nướng sườn đến vàng thơm.'), (N'recipe-002', 3, N'Dọn với cơm tấm, dưa chua và nước mắm.'),
(N'recipe-003', 1, N'Ướp thịt với nước mắm, đường, tỏi.'), (N'recipe-003', 2, N'Nướng thịt và chả đến chín vàng.'), (N'recipe-003', 3, N'Ăn kèm bún, rau sống và nước chấm.'),
(N'recipe-004', 1, N'Luộc gà với gừng và hành tím.'), (N'recipe-004', 2, N'Ninh gạo bằng nước luộc gà.'), (N'recipe-004', 3, N'Xé gà, nêm cháo và rắc hành ngò.'),
(N'recipe-005', 1, N'Luộc tôm thịt và thái mỏng.'), (N'recipe-005', 2, N'Nhúng bánh tráng, xếp rau, bún, tôm thịt.'), (N'recipe-005', 3, N'Cuộn chặt và ăn kèm sốt tương.'),
(N'recipe-006', 1, N'Sơ chế cá, cà chua, dứa và đậu bắp.'), (N'recipe-006', 2, N'Nấu nước canh với me chua.'), (N'recipe-006', 3, N'Cho cá và rau vào, nêm chua ngọt.'),
(N'recipe-007', 1, N'Nhặt và rửa rau muống.'), (N'recipe-007', 2, N'Phi tỏi thơm.'), (N'recipe-007', 3, N'Xào rau trên lửa lớn, nêm vừa ăn.'),
(N'recipe-008', 1, N'Chiên hoặc áp chảo đậu phụ.'), (N'recipe-008', 2, N'Xào cà chua thành sốt.'), (N'recipe-008', 3, N'Cho đậu vào đảo nhẹ, thêm hành lá.');

INSERT INTO dbo.Payments (id, member_id, invoice, plan_id, billing, payment_method, amount, currency, status, paid_at) VALUES
(N'pay-001', N'mem-001', N'INV-2026-031', N'svip', N'monthly', N'card', 199000, N'VND', N'paid', '2026-03-13T09:00:00'),
(N'pay-002', N'mem-001', N'INV-2026-021', N'svip', N'monthly', N'card', 199000, N'VND', N'paid', '2026-02-13T09:00:00'),
(N'pay-003', N'mem-001', N'INV-2026-011', N'svip', N'upgrade', N'card', 100000, N'VND', N'paid', '2026-01-13T09:00:00');

INSERT INTO dbo.Faqs (id, question, answer) VALUES
(N'faq-001', N'Tôi có thể hủy bất cứ lúc nào không?', N'Có, bạn có thể hủy đăng ký bất cứ lúc nào. Gói tiếp tục hoạt động đến hết kỳ thanh toán.'),
(N'faq-002', N'Thanh toán có an toàn không?', N'Có. Backend demo không lưu số thẻ, CVV hoặc dữ liệu thanh toán nhạy cảm.'),
(N'faq-003', N'Tôi có thể nâng cấp từ VIP lên SVIP không?', N'Có, bạn có thể nâng cấp bất cứ lúc nào. Phần chênh lệch được tính theo kỳ còn lại.'),
(N'faq-004', N'SVIP khác gì VIP?', N'SVIP có AI Coach cá nhân, thực đơn tùy chỉnh, hỗ trợ ưu tiên và phân tích cơ thể nâng cao.');

INSERT INTO dbo.ChatQuickReplies (text) VALUES
(N'Tôi nên ăn gì hôm nay?'),
(N'Tính calo bữa sáng'),
(N'Gợi ý món Việt healthy'),
(N'Thực đơn giảm cân thuần Việt');

INSERT INTO dbo.ChatCannedResponses (prompt, response) VALUES
(N'Tôi nên ăn gì hôm nay?', N'Dựa trên mục tiêu của bạn, tôi gợi ý: sáng cháo gà gừng, trưa cơm gạo lứt với gà luộc và rau, tối canh chua cá lóc. Tổng khoảng 1,200-1,500 kcal tùy khẩu phần.'),
(N'Tính calo bữa sáng', N'Bạn gửi tên món và khẩu phần, tôi sẽ ước tính calo. Ví dụ: phở bò tô nhỏ khoảng 320 kcal, cháo gà gừng khoảng 280 kcal.'),
(N'Gợi ý món Việt healthy', N'Ba món Việt lành mạnh: gỏi cuốn tôm thịt, canh chua cá lóc, đậu phụ sốt cà chua. Các món này giàu protein hoặc chất xơ và dễ kiểm soát khẩu phần.'),
(N'Thực đơn giảm cân thuần Việt', N'Một ngày mẫu: sáng cháo gà, trưa cơm gạo lứt + cá kho + rau luộc, tối canh rau + đậu phụ. Ưu tiên nước lọc, hạn chế nước ngọt và đồ chiên.');

INSERT INTO dbo.AdminUsers (id, name, email, role, status, joined_at, plan_name) VALUES
(N'U001', N'Nguyễn Thị Mai', N'mai.nt@example.com', N'User', N'active', '2026-03-10', N'Free'),
(N'U002', N'Trần Minh Quân', N'quan.tm@example.com', N'Admin', N'active', '2026-03-09', N'VIP'),
(N'U003', N'Lê Thị Hoa', N'hoa.lt@example.com', N'User', N'inactive', '2026-03-08', N'Free'),
(N'U004', N'Phạm Văn An', N'an.pv@example.com', N'Moderator', N'active', '2026-03-07', N'VIP'),
(N'U005', N'Hoàng Minh Tuấn', N'tuan.hm@example.com', N'User', N'active', '2026-03-06', N'Free');

INSERT INTO dbo.AdminKpis (id, label, value, change_text) VALUES
(N'total-users', N'Tổng người dùng', 48291, N'+12%'),
(N'dau', N'DAU hôm nay', 3840, N'+7%'),
(N'ai-messages', N'Tin nhắn AI/ngày', 94200, N'+18%'),
(N'retention', N'Tỉ lệ giữ chân', 68.4, N'+2%');

INSERT INTO dbo.AdminSystemServices (id, name, status, uptime, latency_ms) VALUES
(N'api', N'API Server', N'online', N'99.9%', 42),
(N'database', N'Database', N'online', N'99.7%', 18),
(N'ai', N'AI Service', N'online', N'99.5%', 210),
(N'cdn', N'CDN', N'online', N'100%', 8);

INSERT INTO dbo.AdminAiSettings (
  id, model, auto_portion_recommendation, smart_meal_suggestions,
  nutrition_validation, confidence_threshold, calorie_formula
) VALUES (
  1, N'Gemini 1.5 Pro', 1, 1, 0, 75, N'(10 x W) + (6.25 x H) - (5 x A) + 5'
);

INSERT INTO dbo.AdminSecuritySettings (
  id, two_factor_enabled, min_password_length, require_special_char, require_uppercase, require_number
) VALUES (
  1, 0, 8, 1, 0, 1
);

INSERT INTO dbo.LoginActivity (ip, device, location, login_time, status) VALUES
(N'192.168.1.105', N'Chrome / macOS', N'Hà Nội, VN', '2026-03-14T09:42:00', N'success'),
(N'45.76.102.8', N'Safari / iOS', N'Đà Nẵng, VN', '2026-03-13T22:30:00', N'failed');
GO

SELECT N'NutriPath database created and seeded successfully.' AS message;
GO
