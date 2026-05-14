/*
  NutriPath SQL smoke test
  Run after importing NutriPath_Database.sql.
*/

USE NutriPath;
GO

SET NOCOUNT ON;
GO

DECLARE @Failures TABLE (message NVARCHAR(255));

IF (SELECT COUNT(*) FROM dbo.Members) < 1 INSERT INTO @Failures VALUES (N'Members table has no rows');
IF (SELECT COUNT(*) FROM dbo.Foods) < 10 INSERT INTO @Failures VALUES (N'Foods table has fewer rows than expected');
IF (SELECT COUNT(*) FROM dbo.Recipes) < 5 INSERT INTO @Failures VALUES (N'Recipes table has fewer rows than expected');
IF (SELECT COUNT(*) FROM dbo.Plans) <> 3 INSERT INTO @Failures VALUES (N'Plans table should contain Free, VIP, SVIP');
IF NOT EXISTS (SELECT 1 FROM dbo.MealLogs WHERE member_id = N'mem-001' AND log_date = '2026-03-13')
  INSERT INTO @Failures VALUES (N'Missing sample meal log for mem-001 on 2026-03-13');
IF NOT EXISTS (SELECT 1 FROM dbo.Payments WHERE member_id = N'mem-001' AND status = N'paid')
  INSERT INTO @Failures VALUES (N'Missing paid payment history for mem-001');

IF EXISTS (SELECT 1 FROM @Failures)
BEGIN
  SELECT N'FAILED' AS test_status, message FROM @Failures;
  THROW 51000, 'NutriPath SQL smoke test failed.', 1;
END;

SELECT N'PASSED' AS test_status, N'NutriPath SQL data is ready.' AS message;

SELECT 'Members' AS table_name, COUNT(*) AS rows_count FROM dbo.Members
UNION ALL SELECT 'Foods', COUNT(*) FROM dbo.Foods
UNION ALL SELECT 'Recipes', COUNT(*) FROM dbo.Recipes
UNION ALL SELECT 'RecipeTags', COUNT(*) FROM dbo.RecipeTags
UNION ALL SELECT 'MealLogs', COUNT(*) FROM dbo.MealLogs
UNION ALL SELECT 'MealSections', COUNT(*) FROM dbo.MealSections
UNION ALL SELECT 'MealItems', COUNT(*) FROM dbo.MealItems
UNION ALL SELECT 'Plans', COUNT(*) FROM dbo.Plans
UNION ALL SELECT 'PlanFeatures', COUNT(*) FROM dbo.PlanFeatures
UNION ALL SELECT 'Payments', COUNT(*) FROM dbo.Payments
UNION ALL SELECT 'AdminUsers', COUNT(*) FROM dbo.AdminUsers;

SELECT
  m.id AS member_id,
  m.name,
  m.email,
  s.plan_id,
  s.billing,
  s.status,
  s.renews_at
FROM dbo.Members m
JOIN dbo.Subscriptions s ON s.member_id = m.id
WHERE m.id = N'mem-001';

SELECT
  ml.log_date,
  SUM(mi.calories) AS total_calories,
  SUM(mi.protein) AS total_protein,
  SUM(mi.carbs) AS total_carbs,
  SUM(mi.fat) AS total_fat,
  ml.water_glasses,
  ml.steps,
  ml.burned_calories
FROM dbo.MealLogs ml
JOIN dbo.MealItems mi ON mi.meal_log_id = ml.id
WHERE ml.member_id = N'mem-001'
GROUP BY ml.log_date, ml.water_glasses, ml.steps, ml.burned_calories;

SELECT TOP 5
  r.name,
  r.calories,
  r.time_minutes,
  STRING_AGG(rt.tag, ', ') AS tags
FROM dbo.Recipes r
LEFT JOIN dbo.RecipeTags rt ON rt.recipe_id = r.id
GROUP BY r.name, r.calories, r.time_minutes
ORDER BY r.calories;

DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS;
GO
