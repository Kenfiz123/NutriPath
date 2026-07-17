import crypto from "node:crypto";

const OTP_PURPOSES = new Set(["register", "password-reset"]);
const OTP_MIN_LENGTH = 6;
const OTP_MAX_LENGTH = 8;
const OTP_REQUEST_COOLDOWN_MS = 60 * 1000;
const OTP_REQUEST_WINDOW_MS = 60 * 60 * 1000;
const OTP_REQUEST_MAX_PER_WINDOW = 5;
const OTP_TICKET_TTL_MS = 10 * 60 * 1000;
const otpRequestBuckets = new Map();
const otpVerificationTickets = new Map();

function normalizeSupabaseOtpUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/auth\/v1\/?$/i, "")
    .replace(/\/+$/, "");
}

function inferSupabaseOtpUrlFromDatabase() {
  const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  const match = String(databaseUrl).match(/postgres\.([a-z0-9-]+)(?=[:@])/i);
  return match?.[1] ? `https://${match[1]}.supabase.co` : "";
}

function getSupabaseOtpConfig() {
  const projectUrl = normalizeSupabaseOtpUrl(
    process.env.SUPABASE_URL
      || process.env.SUPABASE_PROJECT_URL
      || process.env.SUPABASE_REST_URL
      || process.env.NUTRIPATH_SUPABASE_URL
      || process.env.VITE_SUPABASE_URL
      || inferSupabaseOtpUrlFromDatabase(),
  );
  const anonKey = process.env.SUPABASE_ANON_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_PUBLIC_KEY
    || process.env.NUTRIPATH_SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_ANON_KEY
    || "";
  return { projectUrl, anonKey };
}

function cleanupOtpState(now = Date.now()) {
  for (const [key, bucket] of otpRequestBuckets) {
    if (bucket.resetAt <= now) otpRequestBuckets.delete(key);
  }
  for (const [ticket, verification] of otpVerificationTickets) {
    if (verification.expiresAt <= now) otpVerificationTickets.delete(ticket);
  }
}

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
    clearSessionCookie,
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
    ensureMembers,
    ensureOAuthIdentities,
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
    getSessionToken,
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
    updateSqlServerCredentialPassword,
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
    verifyPassword,
    verifySupabaseAccessToken
  } = ctx;

  function requireOtpPurpose(value) {
    const purpose = String(value || "").trim().toLowerCase();
    if (!OTP_PURPOSES.has(purpose)) badRequest("Mục đích OTP không hợp lệ.");
    return purpose;
  }

  function requireOtpEmail(value) {
    const email = normalizeEmail(value);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) badRequest("Email không hợp lệ.");
    return email;
  }

  function reserveOtpRequest(req, email, purpose) {
    const now = Date.now();
    cleanupOtpState(now);
    const key = `${purpose}:${email}:${getClientIp(req)}`;
    const existing = otpRequestBuckets.get(key);
    const bucket = existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + OTP_REQUEST_WINDOW_MS, lastSentAt: 0 };

    const cooldownRemaining = bucket.lastSentAt + OTP_REQUEST_COOLDOWN_MS - now;
    if (cooldownRemaining > 0) {
      const retryAfterSeconds = Math.ceil(cooldownRemaining / 1000);
      tooManyRequests(`Vui lòng chờ ${retryAfterSeconds} giây trước khi gửi lại OTP.`, { retryAfterSeconds });
    }
    if (bucket.count >= OTP_REQUEST_MAX_PER_WINDOW) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      tooManyRequests("Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau.", { retryAfterSeconds });
    }

    bucket.count += 1;
    bucket.lastSentAt = now;
    otpRequestBuckets.set(key, bucket);
  }

  function requireSupabaseOtpConfig() {
    const config = getSupabaseOtpConfig();
    if (!config.projectUrl || !config.anonKey) {
      serviceUnavailable("Backend chưa cấu hình Supabase Email OTP.", {
        missing: [!config.projectUrl ? "SUPABASE_URL" : null, !config.anonKey ? "SUPABASE_ANON_KEY" : null].filter(Boolean),
      });
    }
    return config;
  }

  async function callSupabaseOtp(pathname, body) {
    const { projectUrl, anonKey } = requireSupabaseOtpConfig();
    const configuredTimeout = Number(process.env.AUTH_OTP_TIMEOUT_MS || 5000);
    const timeoutMs = Math.min(10000, Math.max(2000, Number.isFinite(configuredTimeout) ? configuredTimeout : 5000));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(new URL(pathname, `${projectUrl}/`).toString(), {
        method: "POST",
        signal: controller.signal,
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.msg || payload?.message || payload?.error_description || response.statusText;
        if (response.status === 429) tooManyRequests("Supabase đang giới hạn gửi OTP. Vui lòng thử lại sau.");
        if (response.status >= 500) serviceUnavailable("Dịch vụ gửi OTP đang tạm thời gián đoạn.", { providerStatus: response.status });
        unauthorized(message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
      }
      return payload || {};
    } catch (error) {
      if (error?.status) throw error;
      serviceUnavailable("Không kết nối được Supabase Email OTP.", {
        code: error?.code || error?.name || "otp_transport_error",
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async function sendSupabaseEmailOtp(email) {
    await callSupabaseOtp("/auth/v1/otp", {
      email,
      create_user: true,
      data: { source: "nutripath-email-otp" },
    });
  }

  async function verifySupabaseEmailOtp(email, otp) {
    const payload = await callSupabaseOtp("/auth/v1/verify", {
      email,
      token: otp,
      type: "email",
    });
    const verifiedEmail = normalizeEmail(payload?.user?.email || payload?.email);
    if (verifiedEmail !== email) unauthorized("Mã OTP không khớp với email cần xác minh.");
  }

  function issueOtpVerificationTicket(email, purpose) {
    cleanupOtpState();
    const ticket = crypto.randomBytes(32).toString("base64url");
    const expiresAt = Date.now() + OTP_TICKET_TTL_MS;
    otpVerificationTickets.set(ticket, { email, purpose, expiresAt });
    return { ticket, expiresAt };
  }

  function consumeOtpVerificationTicket(value, email, purpose) {
    cleanupOtpState();
    const ticket = String(value || "").trim();
    const verification = ticket ? otpVerificationTickets.get(ticket) : null;
    if (!verification
      || verification.email !== email
      || verification.purpose !== purpose
      || verification.expiresAt <= Date.now()) {
      unauthorized("Phiên xác minh OTP không hợp lệ hoặc đã hết hạn.");
    }
    otpVerificationTickets.delete(ticket);
  }

  route("POST", "/api/auth/otp/request", async ({ req, store, body }) => {
    requireFields(body, ["email", "purpose"]);
    const email = requireOtpEmail(body.email);
    const purpose = requireOtpPurpose(body.purpose);
    const credential = findCredentialByEmail(store.db, email);

    if (purpose === "register" && credential) conflict("Email này đã có tài khoản đăng nhập.");
    reserveOtpRequest(req, email, purpose);

    if (purpose === "register" || credential) await sendSupabaseEmailOtp(email);

    return {
      sent: true,
      expiresInSeconds: OTP_TICKET_TTL_MS / 1000,
      retryAfterSeconds: OTP_REQUEST_COOLDOWN_MS / 1000,
      message: purpose === "password-reset"
        ? "Nếu email đã đăng ký, mã OTP đã được gửi đến hộp thư của bạn."
        : "Mã OTP đã được gửi đến email của bạn.",
    };
  });

  route("POST", "/api/auth/otp/verify", async ({ store, body }) => {
    requireFields(body, ["email", "purpose", "otp"]);
    const email = requireOtpEmail(body.email);
    const purpose = requireOtpPurpose(body.purpose);
    const otp = String(body.otp || "").trim();
    if (!new RegExp(`^\\d{${OTP_MIN_LENGTH},${OTP_MAX_LENGTH}}$`).test(otp)) {
      badRequest(`Mã OTP phải gồm từ ${OTP_MIN_LENGTH} đến ${OTP_MAX_LENGTH} chữ số.`);
    }
    if (purpose === "password-reset" && !findCredentialByEmail(store.db, email)) {
      unauthorized("Mã OTP không hợp lệ hoặc đã hết hạn.");
    }

    await verifySupabaseEmailOtp(email, otp);
    const verification = issueOtpVerificationTicket(email, purpose);
    return {
      verified: true,
      verificationTicket: verification.ticket,
      expiresAt: new Date(verification.expiresAt).toISOString(),
    };
  });

  route("POST", "/api/auth/register", async ({ req, store, body }) => {
    requireFields(body, ["name", "email", "password", "verificationTicket"]);
    const email = normalizeEmail(body.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) badRequest("Email không hợp lệ.");

    const password = String(body.password);
    if (password.length < 6) badRequest("Mật khẩu cần ít nhất 6 ký tự.");

    const credentials = ensureAuthCredentials(store.db);
    if (findCredentialByEmail(store.db, email)) {
      conflict("Email này đã có tài khoản đăng nhập.");
    }
    consumeOtpVerificationTicket(body.verificationTicket, email, "register");

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

  route("POST", "/api/auth/password/reset", async ({ req, store, body }) => {
    requireFields(body, ["email", "newPassword", "verificationTicket"]);
    const email = requireOtpEmail(body.email);
    const newPassword = String(body.newPassword || "");
    if (newPassword.length < 6) badRequest("Mật khẩu cần ít nhất 6 ký tự.");

    const credential = findCredentialByEmail(store.db, email);
    if (!credential) unauthorized("Không thể đặt lại mật khẩu cho tài khoản này.");
    consumeOtpVerificationTicket(body.verificationTicket, email, "password-reset");

    const hashed = hashPassword(newPassword);
    const nextCredential = {
      ...credential,
      passwordHash: hashed.passwordHash,
      passwordSalt: hashed.passwordSalt,
    };

    if (store.dataSource === "sqlserver") {
      await updateSqlServerCredentialPassword(nextCredential);
      await store.reload();
    } else {
      Object.assign(credential, nextCredential);
      await store.save();
    }

    for (const [token, session] of sessions) {
      if (session.memberId === credential.memberId) sessions.delete(token);
    }

    return {
      reset: true,
      message: "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại.",
      _links: { login: link(req, "/api/auth/login", "POST") },
    };
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

  route("POST", "/api/auth/supabase", async ({ req, store, body }) => {
    requireFields(body, ["accessToken"]);
    const supabaseUser = await verifySupabaseAccessToken(body.accessToken);
    const email = normalizeEmail(supabaseUser.email);
    if (!supabaseUser.id) badRequest("Supabase user id không hợp lệ.");

    const credential = findCredentialByEmail(store.db, email);
    let member = findMemberByEmail(store.db, email) || (credential ? getMember(store.db, credential.memberId) : null);
    const isNewMember = !member;

    if (!member) {
      member = memberFromRegistration(store, {
        email,
        name: supabaseUser.name,
        goal: "maintain",
      });
    }

    const upsertIdentity = () => {
      const identities = ensureOAuthIdentities(store.db);
      const now = new Date().toISOString();
      const existing = identities.find((identity) => identity.providerUserId === supabaseUser.id)
        || identities.find((identity) => normalizeEmail(identity.email) === email && identity.providerName === supabaseUser.provider);
      const nextIdentity = {
        id: existing?.id || store.nextId("oauth", identities),
        memberId: member.id,
        provider: "supabase",
        providerName: supabaseUser.provider,
        providerUserId: supabaseUser.id,
        email,
        name: supabaseUser.name,
        avatarUrl: supabaseUser.avatarUrl,
        emailConfirmedAt: supabaseUser.emailConfirmedAt,
        lastLoginAt: now,
        createdAt: existing?.createdAt || now,
      };

      if (existing) Object.assign(existing, nextIdentity);
      else identities.push(nextIdentity);
    };

    if (store.dataSource === "sqlserver") {
      if (isNewMember) {
        const fallbackSecret = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
        const hashed = hashPassword(`supabase-oauth:${supabaseUser.id}:${fallbackSecret}`);
        const oauthCredential = {
          id: store.nextId("auth", ensureAuthCredentials(store.db)),
          memberId: member.id,
          email,
          passwordHash: hashed.passwordHash,
          passwordSalt: hashed.passwordSalt,
          createdAt: new Date().toISOString(),
        };
        await insertSqlServerAuthMember(member, oauthCredential);
        await store.reload();
        member = getMember(store.db, oauthCredential.memberId);
      }
    } else {
      if (isNewMember) ensureMembers(store.db).push(member);
      upsertIdentity();
      try {
        await store.save();
      } catch (error) {
        console.error("Supabase OAuth member sync failed:", {
          dataSource: store.dataSource,
          message: error?.message,
          code: error?.code,
        });
        serviceUnavailable("Không thể lưu hồ sơ đăng nhập Supabase. Kiểm tra SUPABASE_DATABASE_URL và NUTRIPATH_SUPABASE_TABLE trên backend.");
      }
    }

    if (!member) unauthorized("Không thể đồng bộ tài khoản Supabase với hồ sơ NutriPath.");
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
    const token = getSessionToken(req);
    if (token) sessions.delete(token);
    clearSessionCookie(req);
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
