export function registerNutritionRoutes(ctx) {
  const {
    CUSTOM_FOOD_UNITS,
    VIETNAM_NUTRITION_INGREDIENTS,
    addDays,
    adminColorForMember,
    apiLinks,
    applyChatIntent,
    applyNutritionCalculationToMember,
    applyWaterEquivalent,
    assertMealItemQuota,
    assertMealLogAccess,
    assertMemberSessionAccess,
    assertNumberInRange,
    authSessionResponse,
    badRequest,
    buildAdminOverview,
    buildAdvancedNutritionContext,
    buildCalculationWarnings,
    buildDashboardAchievements,
    buildDashboardTips,
    buildNutritionProfile,
    buildNutritionReport,
    buildPersonalizedRecipePrompt,
    buildQuote,
    buildReportCsv,
    buildSafeChatHistoryContext,
    buildSafeNutritionContext,
    buildSvipCalorieInsightPrompt,
    buildSvipFoodPhotoRefinementPrompt,
    buildWeeklyCoachPlan,
    buildWeeklyProgress,
    calculateCalories,
    callAiProviderForText,
    callGeminiProvider,
    callGeminiVisionProvider,
    callGroqProvider,
    callOpenAiCompatibleProvider,
    canUseAdvancedAiContext,
    cannedChatResponse,
    chatBlockMessage,
    chatHistoryResource,
    collectionResponse,
    conflict,
    countTrackedMealDays,
    csvValue,
    currentLink,
    customFoodResource,
    dateToUtcDay,
    daysBetweenDates,
    earliestDateString,
    enforceSafeChatRateLimit,
    ensureAuthCredentials,
    ensureChatHistory,
    ensureCoachPlans,
    ensureMealLog,
    ensureNotifications,
    ensurePersonalFoods,
    ensurePersonalizedRecipes,
    errorResponse,
    estimateCustomCookedFood,
    estimateFoodPhotoCalories,
    extractGeminiText,
    extractJsonObject,
    extractMillilitersFromPortion,
    findCredentialByEmail,
    findMemberByEmail,
    foodResource,
    forbidden,
    geminiQuotaMessage,
    generatePersonalizedRecipe,
    generateSafeGeminiChatResponse,
    generateSvipCalorieInsight,
    getActiveSession,
    getAdminUsersData,
    getAiProviders,
    getBearerToken,
    getChatAdminKey,
    getClientIp,
    getDrinkWaterEquivalentGlasses,
    getFatPct,
    getFood,
    getGeminiRateState,
    getGoalDelta,
    getMealHistoryDayDelta,
    getMealItemCount,
    getMember,
    getMemberChatHistory,
    getMembershipAccess,
    getNormalizedTier,
    getPersonalizedRecipeQuestions,
    getPlan,
    getPlanPayments,
    getProteinPerKg,
    getRecipe,
    getRecipeImageUrl,
    getSafeCalorieMinimum,
    getSafeChatLimits,
    getSafeChatQuickReplies,
    getSafeChatTier,
    getSubscriptionSnapshot,
    hashPassword,
    initialsFromName,
    insertSqlServerAuthMember,
    insertSqlServerCredential,
    isChatAdminKey,
    isSameLocalDate,
    isTruthyQuery,
    link,
    loadEnvFile,
    localizePersonalizedRecipe,
    localizePersonalizedRecipeText,
    logDangerousChat,
    makeEmptyReportLog,
    matchRoute,
    mealLogResource,
    memberFromRegistration,
    memberResource,
    normalizeChatIntent,
    normalizeEmail,
    normalizeFoodPhotoEstimate,
    normalizeForPolicy,
    normalizeIngredient,
    normalizeMealLogLabels,
    normalizePath,
    normalizePersonalizedRecipe,
    normalizeSvipCalorieInsight,
    normalizeVietnameseText,
    notFound,
    notificationResource,
    paginateItems,
    parseCalorieGoalIntentFromText,
    parseChatIntent,
    parseDate,
    parseFoodPhotoImage,
    paymentResource,
    personalizedRecipeResource,
    planLabel,
    planResource,
    readBody,
    recipeResource,
    redactSensitiveText,
    refineFoodPhotoEstimateForSvip,
    releaseGeminiQuota,
    reportDateRange,
    requireAdminSession,
    requireFields,
    requireSession,
    reserveGeminiQuota,
    roleLabel,
    round,
    route,
    safeCannedChatResponse,
    saveMealLogChanges,
    saveMemberChatMessages,
    saveMemberNutritionProfile,
    savePersonalizedRecipe,
    saveSqlServerMealLog,
    saveSqlServerMemberNutritionProfile,
    saveSqlServerPaymentAndSubscription,
    sendJson,
    serviceUnavailable,
    sessions,
    splitPath,
    startOfWeek,
    summarizeMealLog,
    syncMemberNotifications,
    toLocalDateString,
    tooManyRequests,
    unauthorized,
    updateMemberDailyCalorieGoal,
    updateSqlServerMemberCalorieGoal,
    updateWaterGoalStatus,
    upsertNotification,
    validateSafeChatInput,
    validateSafeChatOutput,
    verifyPassword
  } = ctx;

  route("GET", "/api/foods", async ({ req, store, url }) => {
    const searchRaw = url.searchParams.get("search") || "";
    const search = normalizeVietnameseText(searchRaw);
    const category = url.searchParams.get("category");
    const foods = store.db.foods.filter((food) => {
      const haystack = normalizeVietnameseText(`${food.name} ${food.category} ${food.portion}`);
      const matchSearch = !search || haystack.includes(search);
      const matchCategory = !category || food.category === category;
      return matchSearch && matchCategory;
    });
    const page = paginateItems(url, foods, { defaultLimit: 50, maxLimit: 200 });
    const categories = [...new Set(store.db.foods.map((food) => food.category))].sort();
    return collectionResponse(req, "foods", page.items, {
      itemMapper: (food) => foodResource(req, food),
      links: { create: link(req, "/api/foods", "POST") },
      meta: {
        filters: { search: searchRaw, category },
        categories,
        pagination: {
          page: page.page,
          limit: page.limit,
          total: page.total,
          totalPages: page.totalPages,
        },
      },
    });
  });

  route("POST", "/api/foods", async ({ req, store, body }) => {
    requireAdminSession(req, store);
    requireFields(body, ["name", "calories", "protein", "carbs", "fat", "portion"]);
    const food = {
      id: store.nextId("food", store.db.foods),
      name: body.name,
      category: body.category || "Khác",
      calories: Number(body.calories),
      protein: Number(body.protein),
      carbs: Number(body.carbs),
      fat: Number(body.fat),
      portion: body.portion,
    };
    if ([food.calories, food.protein, food.carbs, food.fat].some((value) => Number.isNaN(value) || value < 0)) {
      badRequest("Thông tin dinh dưỡng không hợp lệ.");
    }
    store.db.foods.push(food);
    await store.save();
    return foodResource(req, food);
  });

  route("GET", "/api/foods/:id", async ({ req, store, params }) => {
    const food = getFood(store.db, params.id);
    if (!food) notFound(req, "Food not found.");
    return foodResource(req, food);
  });

  route("GET", "/api/nutrition/custom-food/ingredients", async ({ req, url }) => {
    const search = normalizeVietnameseText(url.searchParams.get("search") || "");
    const ingredients = VIETNAM_NUTRITION_INGREDIENTS.filter((item) => {
      if (!search) return true;
      const haystack = normalizeVietnameseText([item.name, ...(item.aliases || [])].join(" "));
      return haystack.includes(search);
    });

    return collectionResponse(req, "ingredients", ingredients, {
      links: { estimate: link(req, "/api/nutrition/custom-food/estimate", "POST") },
      meta: {
        units: CUSTOM_FOOD_UNITS,
        examples: [
          "Cơm gà áp chảo: 1 chén cơm, 1 miếng ức gà, 1 muỗng cà phê dầu ăn, một ít rau.",
          "Bánh mì trứng: 1 ổ bánh mì, 1 quả trứng, 1 muỗng cà phê mayonnaise.",
          "Canh rau: 1 bát rau xanh, 1 muỗng cà phê nước mắm.",
        ],
      },
    });
  });

  route("POST", "/api/nutrition/custom-food/estimate", async ({ req, store, body }) => {
    requireSession(req, store);
    const result = estimateCustomCookedFood(body);
    return {
      ...result,
      logic: {
        formula: "Calories = gram × kcal_per_100g / 100",
        macroFormula: "Macro = gram × macro_per_100g / 100",
        servingFormula: "Per serving = total / number_of_servings",
        reminder: "Kết quả là ước tính, có thể dao động theo cách nấu và khẩu phần thực tế.",
      },
      _links: {
        self: currentLink(req),
        ingredients: link(req, "/api/nutrition/custom-food/ingredients"),
      },
    };
  });

  route("PATCH", "/api/foods/:id", async ({ req, store, params, body }) => {
    requireAdminSession(req, store);
    const food = getFood(store.db, params.id);
    if (!food) notFound(req, "Food not found.");
    Object.assign(food, body, { id: food.id });
    await store.save();
    return foodResource(req, food);
  });

  route("DELETE", "/api/foods/:id", async ({ req, store, params }) => {
    requireAdminSession(req, store);
    const before = store.db.foods.length;
    store.db.foods = store.db.foods.filter((food) => food.id !== params.id);
    if (store.db.foods.length === before) notFound(req, "Food not found.");
    await store.save();
    return { deleted: params.id, _links: { collection: link(req, "/api/foods") } };
  });

  route("GET", "/api/members/:memberId/meal-logs", async ({ req, store, params, url }) => {
    const member = getMember(store.db, params.memberId);
    if (!member) notFound(req, "Member not found.");
    const date = url.searchParams.get("date");
    if (date) assertMealLogAccess(member, date);
    const access = getMembershipAccess(member);
    const logs = store.db.mealLogs.filter((log) => {
      if (log.memberId !== member.id) return false;
      if (date && log.date !== date) return false;
      return getMealHistoryDayDelta(log.date) < access.mealHistoryDays;
    });
    return collectionResponse(req, "mealLogs", logs, {
      itemMapper: (log) => mealLogResource(req, log, member),
      links: {
        member: link(req, `/api/members/${member.id}`),
        create: link(req, `/api/members/${member.id}/meal-logs`, "POST"),
      },
      meta: { access },
    });
  });

  route("POST", "/api/members/:memberId/meal-logs", async ({ req, store, params, body }) => {
    const member = getMember(store.db, params.memberId);
    if (!member) notFound(req, "Member not found.");
    requireFields(body, ["date"]);
    assertMealLogAccess(member, body.date);
    const existing = store.db.mealLogs.find((log) => log.memberId === member.id && log.date === body.date);
    if (existing) return mealLogResource(req, existing, member);
    const log = ensureMealLog(store, member.id, body.date);
    await saveMealLogChanges(store, log);
    return mealLogResource(req, log, member);
  });

  route("GET", "/api/members/:memberId/meal-logs/:date", async ({ req, store, params }) => {
    const member = getMember(store.db, params.memberId);
    if (!member) notFound(req, "Member not found.");
    assertMealLogAccess(member, params.date);
    const log = ensureMealLog(store, member.id, params.date);
    await saveMealLogChanges(store, log);
    return mealLogResource(req, log, member);
  });

  route("GET", "/api/members/:memberId/reports/nutrition", async ({ req, store, params, url }) => {
    const { member } = assertMemberSessionAccess(req, store, params.memberId);
    const days = Number(url.searchParams.get("days") || member.access?.analyticsWindowDays || getMembershipAccess(member).analyticsWindowDays);
    const endDate = url.searchParams.get("endDate") || toLocalDateString();
    if (url.searchParams.get("endDate") && !parseDate(endDate)) badRequest("Ngày kết thúc báo cáo không hợp lệ.");
    return buildNutritionReport(req, store.db, member, { days, endDate });
  });

  route("GET", "/api/members/:memberId/reports/export", async ({ req, store, params, url }) => {
    const { member } = assertMemberSessionAccess(req, store, params.memberId);
    const access = getMembershipAccess(member);
    if (!access.reportExports) {
      forbidden("Tính năng xuất báo cáo chỉ dành cho gói SVIP.", {
        tier: access.tier,
        reportExports: access.reportExports,
      });
    }
    const days = Number(url.searchParams.get("days") || access.analyticsWindowDays);
    const endDate = url.searchParams.get("endDate") || toLocalDateString();
    if (url.searchParams.get("endDate") && !parseDate(endDate)) badRequest("Ngày kết thúc báo cáo không hợp lệ.");
    const report = buildNutritionReport(req, store.db, member, { days, endDate });
    return {
      filename: `nutripath-report-${member.id}-${report.range.from}-${report.range.to}.csv`,
      mimeType: "text/csv;charset=utf-8",
      content: buildReportCsv(report),
      generatedAt: report.generatedAt,
      _links: {
        report: link(req, `/api/members/${member.id}/reports/nutrition?days=${report.range.days}&endDate=${encodeURIComponent(report.range.to)}`),
        member: link(req, `/api/members/${member.id}`),
      },
    };
  });

  route("GET", "/api/members/:memberId/custom-foods", async ({ req, store, params, url }) => {
    const { member } = assertMemberSessionAccess(req, store, params.memberId);
    const search = normalizeVietnameseText(url.searchParams.get("search") || "");
    const foods = ensurePersonalFoods(store.db)
      .filter((food) => {
        if (food.memberId !== member.id) return false;
        if (!search) return true;
        return normalizeVietnameseText(`${food.name} ${food.portion}`).includes(search);
      })
      .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));

    return collectionResponse(req, "customFoods", foods, {
      itemMapper: (food) => customFoodResource(req, food),
      links: { create: link(req, `/api/members/${member.id}/custom-foods`, "POST") },
    });
  });

  route("POST", "/api/members/:memberId/custom-foods", async ({ req, store, params, body }) => {
    const { member } = assertMemberSessionAccess(req, store, params.memberId);
    const addableItem = body.addableItem || body.estimate?.addableItem || body;
    requireFields(addableItem, ["name", "calories", "protein", "carbs", "fat", "portion"]);

    const now = new Date().toISOString();
    const savedFood = {
      id: store.nextId("custom-food", ensurePersonalFoods(store.db)),
      memberId: member.id,
      name: String(addableItem.name).trim(),
      calories: round(Number(addableItem.calories), 1),
      protein: round(Number(addableItem.protein), 1),
      carbs: round(Number(addableItem.carbs), 1),
      fat: round(Number(addableItem.fat), 1),
      portion: String(addableItem.portion || "1 phần tự nấu"),
      servings: Number(body.estimate?.servings || body.servings || 1),
      cookingMethod: String(body.estimate?.cookingMethod || body.cookingMethod || ""),
      ingredients: body.estimate?.ingredients || body.ingredients || [],
      confidence: body.estimate?.confidence || body.confidence || null,
      disclaimer: body.estimate?.disclaimer || "Món tự nấu đã lưu là ước tính, có thể dao động theo khẩu phần thực tế.",
      createdAt: now,
      updatedAt: now,
    };

    if ([savedFood.calories, savedFood.protein, savedFood.carbs, savedFood.fat].some((value) => Number.isNaN(value) || value < 0)) {
      badRequest("Thông tin dinh dưỡng của món cá nhân không hợp lệ.");
    }

    ensurePersonalFoods(store.db).unshift(savedFood);
    await store.save();
    return customFoodResource(req, savedFood);
  });

  route("PATCH", "/api/members/:memberId/meal-logs/:date/water", async ({ req, store, params, body }) => {
    const member = getMember(store.db, params.memberId);
    if (!member) notFound(req, "Member not found.");
    assertMealLogAccess(member, params.date);
    const log = ensureMealLog(store, member.id, params.date);
    requireFields(body, ["waterGlasses"]);
    log.waterGlasses = Math.max(0, Number(body.waterGlasses));
    updateWaterGoalStatus(log, member);
    if (log.waterGlasses >= (member.waterTargetGlasses || 8)) {
      upsertNotification(store, member.id, "water-done", "Đã đạt mục tiêu nước", `Bạn đã hoàn thành ${log.waterGlasses}/${member.waterTargetGlasses || 8} ly nước trong ngày ${params.date}.`, {
        key: `${member.id}:water-done:${params.date}`,
        actionHref: "/dashboard",
      });
    }
    await saveMealLogChanges(store, log);
    return mealLogResource(req, log, member);
  });

  route("POST", "/api/members/:memberId/meal-logs/:date/meals/:mealId/items", async ({ req, store, params, body }) => {
    const member = getMember(store.db, params.memberId);
    if (!member) notFound(req, "Member not found.");
    assertMealLogAccess(member, params.date);
    const log = ensureMealLog(store, member.id, params.date);
    const meal = log.meals.find((entry) => entry.id === params.mealId);
    if (!meal) notFound(req, "Meal section not found.");

    let source = null;
    if (body.foodId) {
      source = getFood(store.db, body.foodId);
      if (!source) notFound(req, "Food not found.");
    }
    const quantity = Math.max(0.1, Number(body.quantity || 1));
    const category = body.category || source?.category || null;
    const portion = body.portion || source?.portion || "1 phần";
    const waterEquivalentGlasses = getDrinkWaterEquivalentGlasses({ ...source, ...body, category, portion }, quantity);
    const item = {
      id: store.nextId("item", meal.items),
      foodId: source?.id || body.foodId || null,
      name: body.name || source?.name,
      category,
      calories: round(Number(body.calories ?? source?.calories ?? 0) * quantity, 1),
      protein: round(Number(body.protein ?? source?.protein ?? 0) * quantity, 1),
      carbs: round(Number(body.carbs ?? source?.carbs ?? 0) * quantity, 1),
      fat: round(Number(body.fat ?? source?.fat ?? 0) * quantity, 1),
      portion,
      quantity,
      waterEquivalentGlasses,
    };
    if (!item.name) badRequest("Either foodId or name is required.");
    assertMealItemQuota(member, log);
    meal.items.push(item);
    applyWaterEquivalent(log, member, waterEquivalentGlasses);
    log.goals = log.goals.map((goal) => goal.id === "journal" ? { ...goal, done: true } : goal);
    upsertNotification(store, member.id, "meal-added", "Đã thêm món vào nhật ký", `${item.name} đã được ghi vào ${meal.name} ngày ${params.date}.`, {
      key: `${member.id}:meal-added:${params.date}`,
      actionHref: "/tracker",
    });
    await saveMealLogChanges(store, log);
    return mealLogResource(req, log, member);
  });

  route("DELETE", "/api/members/:memberId/meal-logs/:date/meals/:mealId/items/:itemId", async ({ req, store, params }) => {
    const member = getMember(store.db, params.memberId);
    if (!member) notFound(req, "Member not found.");
    assertMealLogAccess(member, params.date);
    const log = ensureMealLog(store, member.id, params.date);
    const meal = log.meals.find((entry) => entry.id === params.mealId);
    if (!meal) notFound(req, "Meal section not found.");
    const item = meal.items.find((entry) => entry.id === params.itemId);
    if (!item) notFound(req, "Meal item not found.");
    const source = item.foodId ? getFood(store.db, item.foodId) : null;
    const waterEquivalentGlasses = Number(item.waterEquivalentGlasses) || getDrinkWaterEquivalentGlasses({ ...source, ...item, category: item.category || source?.category }, item.quantity);
    meal.items = meal.items.filter((item) => item.id !== params.itemId);
    applyWaterEquivalent(log, member, -waterEquivalentGlasses);
    await saveMealLogChanges(store, log);
    return mealLogResource(req, log, member);
  });

  route("POST", "/api/ai/food-photo-estimate", async ({ req, store, body }) => {
    const { member } = requireSession(req, store);
    enforceSafeChatRateLimit(req, member);
    const image = parseFoodPhotoImage(body);
    const estimate = await estimateFoodPhotoCalories(store, member, image, body.notes || "");
    return {
      estimate,
      addableItem: {
        name: estimate.dishName,
        calories: estimate.calories,
        protein: estimate.protein,
        carbs: estimate.carbs,
        fat: estimate.fat,
        portion: estimate.portion,
        quantity: 1,
      },
      _links: {
        self: currentLink(req),
        mealLogs: link(req, `/api/members/${member.id}/meal-logs`),
        foods: link(req, "/api/foods"),
      },
    };
  });
}
