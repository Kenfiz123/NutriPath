export function registerAdminRoutes(ctx) {
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

  route("GET", "/api/admin/overview", async ({ req, store }) => {
    requireAdminSession(req, store);
    return {
      ...buildAdminOverview(store.db),
      _links: {
        self: currentLink(req),
        users: link(req, "/api/admin/users"),
        payments: link(req, "/api/admin/payments"),
        content: link(req, "/api/admin/content"),
        analytics: link(req, "/api/admin/analytics"),
        aiSettings: link(req, "/api/admin/settings/ai"),
        security: link(req, "/api/admin/security"),
      },
    };
  });

  route("GET", "/api/admin/users", async ({ req, store, url }) => {
    requireAdminSession(req, store);
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    const normalizeFilter = (value) => String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    const normalizedRole = normalizeFilter(role);
    const normalizedStatus = normalizeFilter(status);
    const allUsers = getAdminUsersData(store.db);
    const users = allUsers.filter((user) => {
      const matchSearch = !search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
      const matchRole = !normalizedRole || normalizedRole === "tat ca" || normalizeFilter(user.role) === normalizedRole;
      const matchStatus = !normalizedStatus || normalizedStatus === "tat ca" || normalizeFilter(user.status) === normalizedStatus;
      return matchSearch && matchRole && matchStatus;
    });
    return collectionResponse(req, "users", users, {
      itemMapper: (user) => ({ ...user, _links: { self: link(req, `/api/admin/users/${user.id}`) } }),
      links: { overview: link(req, "/api/admin/overview") },
      meta: {
        total: allUsers.length,
        filters: {
          search: url.searchParams.get("search") || "",
          role: role || "Tất cả",
          status: status || "Tất cả",
        },
        roleBreakdown: [
          { role: "User", count: allUsers.filter((user) => user.role === "User").length },
          { role: "Moderator", count: allUsers.filter((user) => user.role === "Moderator").length },
          { role: "Admin", count: allUsers.filter((user) => user.role === "Admin").length },
        ],
      },
    });
  });

  route("GET", "/api/admin/payments", async ({ req, store, url }) => {
    requireAdminSession(req, store);
    const search = String(url.searchParams.get("search") || "").trim().toLowerCase();
    const status = String(url.searchParams.get("status") || "all").trim().toLowerCase();
    const planId = String(url.searchParams.get("planId") || "all").trim().toLowerCase();
    const allPayments = [...(store.db.payments || [])].sort((left, right) => {
      const leftTime = Date.parse(left.createdAt || left.paidAt || "") || 0;
      const rightTime = Date.parse(right.createdAt || right.paidAt || "") || 0;
      return rightTime - leftTime;
    });

    const enrichedPayments = allPayments.map((payment) => {
      const member = getMember(store.db, payment.memberId);
      const plan = getPlan(store.db, payment.planId);
      return {
        ...paymentResource(req, payment),
        planName: plan?.name || payment.planId?.toUpperCase() || "--",
        member: member ? {
          id: member.id,
          name: member.name,
          email: member.email,
          initials: member.initials || initialsFromName(member.name),
        } : null,
      };
    });

    const filteredPayments = enrichedPayments.filter((payment) => {
      const matchesStatus = status === "all" || String(payment.status || "").toLowerCase() === status;
      const matchesPlan = planId === "all" || String(payment.planId || "").toLowerCase() === planId;
      const searchable = [
        payment.invoice,
        payment.transactionRef,
        payment.providerTransactionNo,
        payment.member?.name,
        payment.member?.email,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && matchesPlan && (!search || searchable.includes(search));
    });
    const paymentPage = paginateItems(url, filteredPayments, { defaultLimit: 25, maxLimit: 100 });
    const countByStatus = (value) => allPayments.filter((payment) => payment.status === value).length;
    const paidPayments = allPayments.filter((payment) => payment.status === "paid");

    return {
      summary: {
        totalTransactions: allPayments.length,
        paidTransactions: paidPayments.length,
        pendingTransactions: countByStatus("pending"),
        failedTransactions: countByStatus("failed"),
        trialTransactions: countByStatus("trial"),
        grossRevenue: paidPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0),
        currency: "VND",
      },
      filters: {
        search: url.searchParams.get("search") || "",
        status,
        planId,
      },
      pagination: {
        page: paymentPage.page,
        limit: paymentPage.limit,
        total: paymentPage.total,
        totalPages: paymentPage.totalPages,
      },
      _embedded: { payments: paymentPage.items },
      _links: {
        self: currentLink(req),
        overview: link(req, "/api/admin/overview"),
      },
    };
  });

  route("GET", "/api/admin/content", async ({ req, store, url }) => {
    requireAdminSession(req, store);
    const foodPage = paginateItems(url, store.db.foods, { defaultLimit: 100, maxLimit: 300 });
    const recipePage = paginateItems(url, store.db.recipes, { defaultLimit: 100, maxLimit: 300 });
    return {
      foods: foodPage.items.map((food) => foodResource(req, food)),
      recipes: recipePage.items.map((recipe) => recipeResource(req, recipe)),
      mealPlans: store.db.plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        target: plan.description,
        calories: plan.pricePreview?.monthlyPrice || plan.monthlyPrice || 0,
        meals: plan.features.filter((feature) => feature.included).length,
        status: plan.id === "free" ? "public" : "active",
      })),
      _links: {
        self: currentLink(req),
        foods: link(req, "/api/foods"),
        recipes: link(req, "/api/recipes"),
        overview: link(req, "/api/admin/overview"),
      },
      pagination: {
        foods: {
          page: foodPage.page,
          limit: foodPage.limit,
          total: foodPage.total,
          totalPages: foodPage.totalPages,
        },
        recipes: {
          page: recipePage.page,
          limit: recipePage.limit,
          total: recipePage.total,
          totalPages: recipePage.totalPages,
        },
      },
    };
  });

  route("GET", "/api/admin/analytics", async ({ req, store }) => {
    requireAdminSession(req, store);
    const today = parseDate(toLocalDateString()) || new Date();
    const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dailyMeals = Array.from({ length: 7 }, (_, index) => {
      const current = addDays(today, -(6 - index));
      const date = toLocalDateString(current);
      const logs = (store.db.mealLogs || []).filter((log) => log.date === date);
      return {
        day: labels[current.getDay()],
        meals: logs.reduce((sum, log) => sum + getMealItemCount(log), 0),
      };
    });

    const macroTotals = (store.db.mealLogs || []).reduce((sum, log) => {
      const summary = summarizeMealLog(log, getMember(store.db, log.memberId));
      sum.carbs += summary.totals.carbs;
      sum.protein += summary.totals.protein;
      sum.fat += summary.totals.fat;
      return sum;
    }, { carbs: 0, protein: 0, fat: 0 });
    const totalMacros = macroTotals.carbs + macroTotals.protein + macroTotals.fat;
    const nutritionShare = [
      { name: "Carbs", value: totalMacros ? round((macroTotals.carbs / totalMacros) * 100, 1) : 0 },
      { name: "Protein", value: totalMacros ? round((macroTotals.protein / totalMacros) * 100, 1) : 0 },
      { name: "Ch?t b?o", value: totalMacros ? round((macroTotals.fat / totalMacros) * 100, 1) : 0 },
    ];

    const dishCounts = new Map();
    for (const log of store.db.mealLogs || []) {
      for (const meal of log.meals || []) {
        for (const item of meal.items || []) {
          const key = item.name;
          const current = dishCounts.get(key) || {
            dish: item.name,
            searches: 0,
            calories: item.calories || 0,
            category: item.category || "Kh?c",
          };
          current.searches += item.quantity || 1;
          dishCounts.set(key, current);
        }
      }
    }

    const topDishes = [...dishCounts.values()]
      .sort((a, b) => b.searches - a.searches)
      .slice(0, 10)
      .map((dish, index) => ({
        rank: index + 1,
        ...dish,
      }));

    return {
      dailyMeals,
      nutritionShare,
      topDishes,
      _links: {
        self: currentLink(req),
        overview: link(req, "/api/admin/overview"),
        users: link(req, "/api/admin/users"),
      },
    };
  });

  route("GET", "/api/admin/system", async ({ req, store }) => {
    requireAdminSession(req, store);
    return {
      services: store.db.admin.systemServices,
      _links: {
        self: currentLink(req),
        overview: link(req, "/api/admin/overview"),
      },
    };
  });

  route("GET", "/api/admin/settings/ai", async ({ req, store }) => {
    requireAdminSession(req, store);
    return {
      settings: store.db.admin.aiSettings,
      _links: {
        self: currentLink(req),
        update: link(req, "/api/admin/settings/ai", "PATCH"),
        overview: link(req, "/api/admin/overview"),
      },
    };
  });

  route("PATCH", "/api/admin/settings/ai", async ({ req, store, body }) => {
    requireAdminSession(req, store);
    store.db.admin.aiSettings = { ...store.db.admin.aiSettings, ...body };
    await store.save();
    return {
      settings: store.db.admin.aiSettings,
      _links: {
        self: link(req, "/api/admin/settings/ai"),
        update: link(req, "/api/admin/settings/ai", "PATCH"),
      },
    };
  });

  route("GET", "/api/admin/security", async ({ req, store }) => {
    requireAdminSession(req, store);
    return {
      security: store.db.admin.security,
      _links: {
        self: currentLink(req),
        update: link(req, "/api/admin/security", "PATCH"),
        aiSafetyLogs: link(req, "/api/admin/ai-safety-logs"),
        overview: link(req, "/api/admin/overview"),
      },
    };
  });

  route("GET", "/api/admin/ai-safety-logs", async ({ req, store }) => {
    requireAdminSession(req, store);
    return {
      logs: store.db.aiSafetyLogs || [],
      _links: {
        self: currentLink(req),
        security: link(req, "/api/admin/security"),
        overview: link(req, "/api/admin/overview"),
      },
    };
  });

  route("PATCH", "/api/admin/security", async ({ req, store, body }) => {
    requireAdminSession(req, store);
    store.db.admin.security = { ...store.db.admin.security, ...body };
    await store.save();
    return {
      security: store.db.admin.security,
      _links: {
        self: link(req, "/api/admin/security"),
        update: link(req, "/api/admin/security", "PATCH"),
      },
    };
  });
}
