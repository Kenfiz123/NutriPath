function getChatLanguage(req) {
  const rawHeader = req?.headers?.["accept-language"] || req?.headers?.get?.("accept-language") || "";
  return String(rawHeader).toLowerCase().startsWith("en") ? "en" : "vi";
}

function localizeQuickReplies(replies, language) {
  if (language !== "en") return replies;
  const translations = new Map([
    ["Tôi nên ăn gì hôm nay?", "What should I eat today?"],
    ["Tính calo bữa sáng", "Estimate my breakfast calories"],
    ["Gợi ý món Việt healthy", "Suggest healthy Vietnamese dishes"],
    ["Thực đơn giảm cân thuần Việt", "Vietnamese weight-loss meal plan"],
    ["AI Coach: xem giup ke hoach an hom nay", "AI Coach: review today's meal plan"],
  ]);
  return replies.map((reply) => translations.get(reply) || reply);
}

function englishCannedChatResponse(text) {
  const cleaned = String(text || "").trim();
  return `Thanks for your question about "${cleaned}". Tell me your health goal, portion size, or what you ate so I can give a more useful nutrition suggestion.`;
}

function localizeIntentReply(result, member, language) {
  if (!result || language !== "en") return result;
  const goal = Number(result.dailyCalorieGoal);
  if (result.applied) return { ...result, reply: `Done, I set your daily calorie goal to ${goal.toLocaleString("en-US")} kcal.` };
  if (!member) return { ...result, reply: "Please log in so I can save this calorie goal to your dashboard." };
  if (!Number.isInteger(goal)) return { ...result, reply: "I couldn't read the daily calorie goal. Try: set my goal to 1,800 kcal per day." };
  if (goal < 1200) return { ...result, reply: `${goal} kcal per day may be too low and unsafe, so I did not save it. Please consult a dietitian or doctor for aggressive weight-loss goals.` };
  if (goal > 5000) return { ...result, reply: `${goal} kcal per day is unusually high and should be personalized to your activity and body weight, so I did not save it.` };
  return result;
}

export function registerChatRoutes(ctx) {
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

  route("GET", "/api/chat/quick-replies", async ({ req, store }) => {
    const activeSession = getActiveSession(req, store);
    const language = getChatLanguage(req);
    return {
      quickReplies: localizeQuickReplies(getSafeChatQuickReplies(activeSession?.member || null), language),
      _links: {
        self: currentLink(req),
        sendMessage: link(req, "/api/chat/messages", "POST"),
      },
    };
  });

  route("GET", "/api/chat/history", async ({ req, store, url }) => {
    const activeSession = getActiveSession(req, store);
    const language = getChatLanguage(req);
    const member = activeSession?.member || (url.searchParams.get("memberId") ? getMember(store.db, url.searchParams.get("memberId")) : null);
    if (!member) {
      return {
        messages: [],
        quickReplies: localizeQuickReplies(getSafeChatQuickReplies(null), language),
        _links: {
          self: currentLink(req),
          sendMessage: link(req, "/api/chat/messages", "POST"),
        },
      };
    }

    return {
      messages: getMemberChatHistory(store.db, member.id),
      quickReplies: localizeQuickReplies(getSafeChatQuickReplies(member), language),
      _links: {
        self: currentLink(req),
        sendMessage: link(req, "/api/chat/messages", "POST"),
        member: link(req, `/api/members/${member.id}`),
      },
    };
  });

  route("POST", "/api/chat/messages", async ({ req, store, body }) => {
    requireFields(body, ["text"]);
    const activeSession = getActiveSession(req, store);
    const member = activeSession?.member || (body.memberId ? getMember(store.db, body.memberId) : null);
    const chatMode = body.mode === "coach" ? "coach" : "assistant";
    const language = getChatLanguage(req);
    const time = new Date().toISOString();

    if (isChatAdminKey(body.text)) {
      if (!activeSession) unauthorized("Bạn cần đăng nhập để bật keyAdmin.");
      activeSession.session.chatAdminOverride = true;
      const messages = [
        {
          id: store.nextId("msg", []),
          sender: "user",
          text: "[keyAdmin đã nhập]",
          time,
        },
        {
          id: store.nextId("msg", []),
          sender: "ai",
          text: "Đã bật keyAdmin cho phiên đăng nhập hiện tại. Giới hạn ký tự và rate limit chat tạm thời được bỏ qua cho đến lần đăng nhập tiếp.",
          time,
        },
      ];
      saveMemberChatMessages(store, activeSession.member, messages);
      await store.save();
      return {
        messages,
        adminOverride: true,
        quickReplies: localizeQuickReplies(getSafeChatQuickReplies(activeSession.member), language),
        _links: {
          self: currentLink(req),
          quickReplies: link(req, "/api/chat/quick-replies"),
        },
      };
    }

    if (chatMode === "coach") {
      if (!member) unauthorized("Bạn cần đăng nhập để dùng AI Coach SVIP.");
      if (!getMembershipAccess(member).aiCoach) {
        forbidden("AI Coach cá nhân hóa hiện chỉ mở cho gói SVIP. Bạn vẫn có thể dùng NutriBot thường hoặc nâng cấp để mở khóa AI Coach.", {
          requiredTier: "svip",
          tier: getMembershipAccess(member).tier,
        });
      }
    }

    const adminOverride = Boolean(activeSession?.session?.chatAdminOverride);
    const { cleaned, blocked } = validateSafeChatInput(body.text, member, { adminOverride });
    if (blocked) {
      logDangerousChat(store, req, member, cleaned, blocked.reason);
      await store.save();
      forbidden(chatBlockMessage(blocked.reason), {
        reason: blocked.reason,
      });
    }
    enforceSafeChatRateLimit(req, member, { adminOverride });
    const aiResult = await generateSafeGeminiChatResponse(store, member, cleaned, { mode: chatMode, language });
    const chatIntent = aiResult?.intent || parseCalorieGoalIntentFromText(cleaned);
    const intentResult = localizeIntentReply(
      await applyChatIntent(store, activeSession?.member || null, chatIntent),
      activeSession?.member || null,
      language,
    );
    const aiText = intentResult?.reply
      || aiResult?.reply
      || (language === "en" ? englishCannedChatResponse(cleaned) : safeCannedChatResponse(store.db, cleaned));
    const userMessage = {
      id: store.nextId("msg", []),
      sender: "user",
      text: cleaned,
      time,
    };
    const aiMessage = {
      id: store.nextId("msg", []),
      sender: "ai",
      text: aiText,
      time,
    };
    if (member) {
      member.stats.aiConversations = (member.stats.aiConversations || 0) + 1;
      saveMemberChatMessages(store, member, [userMessage, aiMessage]);
      await store.save();
    }
    return {
      messages: [userMessage, aiMessage],
      mode: chatMode,
      adminOverride,
      intent: chatIntent?.intent,
      dailyCalorieGoal: intentResult?.dailyCalorieGoal,
      member: intentResult?.member ? memberResource(req, intentResult.member, store.db) : undefined,
      quickReplies: localizeQuickReplies(getSafeChatQuickReplies(member), language),
      _links: {
        self: currentLink(req),
        quickReplies: link(req, "/api/chat/quick-replies"),
        member: member ? link(req, `/api/members/${member.id}`) : undefined,
        recipes: link(req, "/api/recipes"),
        calorieCalculator: link(req, "/api/calculations/calorie", "POST"),
      },
    };
  });
}
