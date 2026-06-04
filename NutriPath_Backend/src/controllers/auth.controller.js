export function registerAuthRoutes(ctx) {
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

  route("POST", "/api/auth/register", async ({ req, store, body }) => {
    requireFields(body, ["name", "email", "password"]);
    const email = normalizeEmail(body.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) badRequest("Email không hợp lệ.");

    const password = String(body.password);
    if (password.length < 6) badRequest("Mật khẩu cần ít nhất 6 ký tự.");

    const credentials = ensureAuthCredentials(store.db);
    if (findCredentialByEmail(store.db, email)) {
      conflict("Email này đã có tài khoản đăng nhập.");
    }

    let member = findMemberByEmail(store.db, email);
    const isNewMember = !member;
    if (!member) {
      member = memberFromRegistration(store, { ...body, email });
    }

    const hashed = hashPassword(password);
    const credential = {
      id: store.nextId("auth", credentials),
      memberId: member.id,
      email,
      passwordHash: hashed.passwordHash,
      passwordSalt: hashed.passwordSalt,
      createdAt: new Date().toISOString(),
    };

    if (store.dataSource === "sqlserver") {
      if (isNewMember) await insertSqlServerAuthMember(member, credential);
      else await insertSqlServerCredential(credential);
      await store.reload();
      member = getMember(store.db, credential.memberId);
    } else {
      if (isNewMember) store.db.members.push(member);
      credentials.push(credential);
      await store.save();
    }

    return authSessionResponse(req, member, store.db);
  });

  route("POST", "/api/auth/login", async ({ req, store, body }) => {
    requireFields(body, ["email", "password"]);
    const email = normalizeEmail(body.email);
    const credential = findCredentialByEmail(store.db, email);

    if (!credential || !verifyPassword(body.password, credential)) {
      unauthorized("Email hoặc mật khẩu không đúng.");
    }

    const member = getMember(store.db, credential.memberId) || findMemberByEmail(store.db, email);
    if (!member) unauthorized("Tài khoản chưa gắn với hồ sơ thành viên.");

    return authSessionResponse(req, member, store.db);
  });

  route("GET", "/api/auth/me", async ({ req, store }) => {
    const { member } = requireSession(req, store);
    return {
      member: memberResource(req, member, store.db),
      _links: {
        self: currentLink(req),
        logout: link(req, "/api/auth/logout", "POST"),
        dashboard: link(req, `/api/members/${member.id}/dashboard`),
        profile: link(req, `/api/members/${member.id}/profile`),
      },
    };
  });

  route("POST", "/api/auth/logout", async ({ req }) => {
    const token = getBearerToken(req);
    if (token) sessions.delete(token);
    return {
      loggedOut: true,
      _links: {
        self: currentLink(req),
        login: link(req, "/api/auth/login", "POST"),
        register: link(req, "/api/auth/register", "POST"),
        api: link(req, "/api"),
      },
    };
  });
}
