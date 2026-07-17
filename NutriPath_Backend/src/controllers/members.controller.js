export function registerMembersRoutes(ctx) {
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
    createMealLogDraft,
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
    normalizeMemberPreferences,
    normalizeMealLogLabels,
    normalizePath,
    normalizePersonalizedRecipe,
    normalizeSvipCalorieInsight,
    normalizeVietnameseText,
    normalizeWeightTracking,
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
    sanitizeEmail,
    sanitizeNumber,
    sanitizeText,
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

  function sanitizeMemberPreferencesInput(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const sanitizeList = (input, maxLength) => input === undefined
      ? undefined
      : Array.isArray(input)
        ? input.map((item) => sanitizeText(item, { maxLength })).filter(Boolean)
        : sanitizeText(input, { maxLength: maxLength * 4 });
    return {
      ...value,
      bodyShape: value.bodyShape === undefined ? undefined : sanitizeText(value.bodyShape, { maxLength: 30 }),
      dietStyle: value.dietStyle === undefined ? undefined : sanitizeText(value.dietStyle, { maxLength: 30 }),
      cuisinePreferences: sanitizeList(value.cuisinePreferences, 40),
      allergies: sanitizeList(value.allergies, 50),
      dislikedFoods: sanitizeList(value.dislikedFoods, 50),
      mealPreferences: sanitizeList(value.mealPreferences, 80),
    };
  }

  route("GET", "/api/members", async ({ req, store, url }) => {
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const tier = url.searchParams.get("tier");
    const members = store.db.members.filter((member) => {
      const matchSearch = !search || member.name.toLowerCase().includes(search) || member.email.toLowerCase().includes(search);
      const matchTier = !tier || member.tier === tier;
      return matchSearch && matchTier;
    });

    return collectionResponse(req, "members", members, {
      itemMapper: (member) => memberResource(req, member, store.db),
      links: { create: link(req, "/api/members", "POST") },
      meta: { filters: { search, tier } },
    });
  });

  route("POST", "/api/members", async ({ req, store, body }) => {
    requireFields(body, ["name", "email"]);
    const name = sanitizeText(body.name, { maxLength: 100 });
    const email = sanitizeEmail(body.email);
    if (!name) badRequest("Tên người dùng không hợp lệ.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) badRequest("Email không hợp lệ.");
    const tier = sanitizeText(body.tier || "free", { maxLength: 20 });
    const member = {
      id: store.nextId("mem", store.db.members),
      name,
      email,
      initials: sanitizeText(body.initials, { maxLength: 4 }) || initialsFromName(name),
      role: "member",
      status: "active",
      tier,
      gender: sanitizeText(body.gender || "female", { maxLength: 20 }),
      age: sanitizeNumber(body.age || 25, 25),
      weightKg: sanitizeNumber(body.weightKg || 65, 65),
      heightCm: sanitizeNumber(body.heightCm || 168, 168),
      activityLevel: sanitizeText(body.activityLevel || "light", { maxLength: 30 }),
      goal: sanitizeText(body.goal || "maintain", { maxLength: 30 }),
      preferences: normalizeMemberPreferences(sanitizeMemberPreferencesInput(body.preferences), {
        bodyShape: sanitizeText(body.bodyShape, { maxLength: 30 }),
        dietStyle: sanitizeText(body.dietStyle, { maxLength: 30 }),
      }),
      weightTracking: normalizeWeightTracking(body.weightTracking, {}, Number(body.weightKg || 65)),
      joinedAt: new Date().toISOString().slice(0, 10),
      calorieTarget: sanitizeNumber(body.calorieTarget || 1800, 1800),
      macroTargets: body.macroTargets || { protein: 120, carbs: 220, fat: 60 },
      waterTargetGlasses: sanitizeNumber(body.waterTargetGlasses || 8, 8),
      subscription: { planId: tier, billing: "monthly", status: "active", startedAt: new Date().toISOString().slice(0, 10), renewsAt: null },
      stats: { memberDays: 0, savedRecipes: 0, aiConversations: 0, trackedCalories: 0, streakDays: 0 },
    };
    store.db.members.push(member);
    await store.save();
    return memberResource(req, member, store.db);
  });

  route("GET", "/api/members/:id", async ({ req, store, params }) => {
    const member = getMember(store.db, params.id);
    if (!member) notFound(req, "Member not found.");
    return memberResource(req, member, store.db);
  });

  route("PATCH", "/api/members/:id", async ({ req, store, params, body }) => {
    const { sessionMember, member } = assertMemberSessionAccess(req, store, params.id);
    const isAdmin = sessionMember.role?.toLowerCase() === "admin";
    const updates = { ...body };
    const allowed = new Set(isAdmin
      ? ["name", "email", "calorieTarget", "waterTargetGlasses", "role", "status", "tier", "subscription", "macroTargets", "preferences", "weightTracking"]
      : ["name", "email", "calorieTarget", "waterTargetGlasses", "preferences", "weightTracking"]);

    if (updates.name !== undefined) {
      updates.name = sanitizeText(updates.name, { maxLength: 100 });
      if (!updates.name) badRequest("Tên người dùng không hợp lệ.");
    }
    if (updates.email !== undefined) {
      updates.email = sanitizeEmail(updates.email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) badRequest("Email không hợp lệ.");
    }
    for (const field of ["role", "status", "tier"]) {
      if (updates[field] !== undefined) updates[field] = sanitizeText(updates[field], { maxLength: 20 });
    }
    if (updates.calorieTarget !== undefined) {
      const target = sanitizeNumber(updates.calorieTarget, Number.NaN);
      if (!Number.isFinite(target) || target < 1200 || target > 5000) badRequest("Mục tiêu calo phải nằm trong khoảng 1200-5000 kcal/ngày.");
      updates.calorieTarget = Math.round(target);
    }
    if (updates.waterTargetGlasses !== undefined) {
      const target = sanitizeNumber(updates.waterTargetGlasses, Number.NaN);
      if (!Number.isFinite(target) || target < 2 || target > 20) badRequest("Mục tiêu nước phải nằm trong khoảng 500-5000ml/ngày.");
      updates.waterTargetGlasses = Math.round(target * 10) / 10;
    }

    if (updates.preferences !== undefined) {
      updates.preferences = normalizeMemberPreferences(sanitizeMemberPreferencesInput(updates.preferences), member.preferences);
    }
    if (updates.weightTracking !== undefined) {
      updates.weightTracking = normalizeWeightTracking(updates.weightTracking, member.weightTracking, member.weightKg || 65);
      member.weightKg = updates.weightTracking.latestWeightKg;
    }

    for (const [key, value] of Object.entries(updates)) {
      if (allowed.has(key)) member[key] = value;
    }
    if (updates.name) member.initials = initialsFromName(member.name);
    await store.save();
    return memberResource(req, member, store.db);
  });

  route("DELETE", "/api/members/:id", async ({ req, store, params }) => {
    const before = store.db.members.length;
    store.db.members = store.db.members.filter((member) => member.id !== params.id);
    if (store.db.members.length === before) notFound(req, "Member not found.");
    await store.save();
    return {
      deleted: params.id,
      _links: {
        collection: link(req, "/api/members"),
        api: link(req, "/api"),
      },
    };
  });

  route("GET", "/api/members/:memberId/profile", async ({ req, store, params }) => {
    const member = getMember(store.db, params.memberId);
    if (!member) notFound(req, "Member not found.");
    const plan = getPlan(store.db, member.subscription?.planId || member.tier);
    const payments = store.db.payments.filter((payment) => payment.memberId === member.id);
    return {
      member: memberResource(req, member, store.db),
      plan: plan ? planResource(req, plan) : null,
      benefits: plan?.features || [],
      billingHistory: payments.map((payment) => paymentResource(req, payment)),
      _links: {
        self: currentLink(req),
        member: link(req, `/api/members/${member.id}`),
        payments: link(req, `/api/members/${member.id}/payments`),
        plans: link(req, "/api/plans"),
        checkout: link(req, "/api/payments", "POST"),
      },
    };
  });

  route("GET", "/api/members/:memberId/notifications", async ({ req, store, params, url }) => {
    const { member } = assertMemberSessionAccess(req, store, params.memberId);
    const notifications = syncMemberNotifications(store, member);
    await store.save();
    const unreadOnly = url.searchParams.get("unread") === "true";
    const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 30), 100));
    const visible = notifications
      .filter((notification) => !unreadOnly || !notification.readAt)
      .slice(0, limit);
    return collectionResponse(req, "notifications", visible, {
      itemMapper: (notification) => notificationResource(req, notification),
      links: {
        member: link(req, `/api/members/${member.id}`),
        markAllRead: link(req, `/api/members/${member.id}/notifications/read-all`, "PATCH"),
      },
      meta: {
        unreadCount: notifications.filter((notification) => !notification.readAt).length,
        total: notifications.length,
      },
    });
  });

  route("PATCH", "/api/members/:memberId/notifications/read-all", async ({ req, store, params }) => {
    const { member } = assertMemberSessionAccess(req, store, params.memberId);
    const now = new Date().toISOString();
    const notifications = ensureNotifications(store.db).filter((notification) => notification.memberId === member.id);
    for (const notification of notifications) {
      notification.readAt ||= now;
      notification.updatedAt = now;
    }
    await store.save();
    return {
      updated: notifications.length,
      unreadCount: 0,
      _links: {
        notifications: link(req, `/api/members/${member.id}/notifications`),
      },
    };
  });

  route("PATCH", "/api/members/:memberId/notifications/:id", async ({ req, store, params, body }) => {
    const { member } = assertMemberSessionAccess(req, store, params.memberId);
    const notification = ensureNotifications(store.db).find((item) => item.memberId === member.id && item.id === params.id);
    if (!notification) notFound(req, "Notification not found.");
    const now = new Date().toISOString();
    if (body.read === false) {
      notification.readAt = null;
    } else {
      notification.readAt = now;
    }
    notification.updatedAt = now;
    await store.save();
    return notificationResource(req, notification);
  });

  route("GET", "/api/members/:memberId/dashboard", async ({ req, store, params, url }) => {
    const member = getMember(store.db, params.memberId);
    if (!member) notFound(req, "Member not found.");
    const selectedDate = parseDate(url.searchParams.get("date")) || new Date();
    const date = toLocalDateString(selectedDate);
    assertMealLogAccess(member, date);
    const existingLog = store.db.mealLogs.find((entry) => entry.memberId === member.id && entry.date === date);
    const log = existingLog ? ensureMealLog(store, member.id, date) : createMealLogDraft(store, member.id, date);
    const summary = summarizeMealLog(log, member);

    return {
      date,
      greeting: `Xin chào, ${member.name}`,
      member: memberResource(req, member, store.db),
      nutrition: summary,
      mealLog: mealLogResource(req, log, member),
      weeklyProgress: buildWeeklyProgress(store.db, member, selectedDate),
      tips: buildDashboardTips(log, summary),
      achievements: buildDashboardAchievements(store.db, member, log, summary, selectedDate),
      _links: {
        self: currentLink(req),
        member: link(req, `/api/members/${member.id}`),
        mealLog: link(req, `/api/members/${member.id}/meal-logs/${date}`),
        foods: link(req, "/api/foods"),
        recipes: link(req, "/api/recipes"),
        chat: link(req, "/api/chat/messages", "POST"),
      },
    };
  });
}
