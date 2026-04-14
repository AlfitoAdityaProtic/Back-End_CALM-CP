const { google } = require("googleapis");
const prisma = require("../../config/prisma");
const { oauth2Client, GOOGLE_SCOPES } = require("../../config/googleOAuth");
const logActivity = require("../../utils/activityLogger");

function getGoogleAuthURL(userId) {
  if (!userId) {
    throw new Error("User ID is required to generate Google auth URL");
  }

  const state = JSON.stringify({ userId });

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    state,
  });
}

async function exchangeCodeForTokens(code) {
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens) {
    throw new Error("Failed to get Google tokens");
  }

  return tokens;
}

async function getGoogleUserProfile(tokens) {
  const client = new google.auth.OAuth2();
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({
    auth: client,
    version: "v2",
  });

  const { data } = await oauth2.userinfo.get();
  if (!data || !data.email || !data.id) {
    throw new Error("Failed to get valid Google user profile");
  }
  return data;
}

async function saveGoogleAccount({
  userId,
  profile,
  tokens,
  ipAddress = null,
  userAgent = null,
}) {
  if (!userId) {
    throw new Error("User ID is required to save Google account");
  }
  const existing = await prisma.googleAccount.findUnique({
    where: { userId },
  });

  const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

  let result;
  let actionType;
  let actionDescription;

  if (existing) {
    result = await prisma.googleAccount.update({
      where: { userId },
      data: {
        googleEmail: profile.email,
        googleSub: profile.id,
        accessToken: tokens.access_token || existing.accessToken,
        refreshToken: tokens.refresh_token || existing.refreshToken,
        tokenExpiry,
      },
    });

    actionType = "GOOGLE_ACCOUNT_UPDATED";
    actionDescription = `User memperbarui koneksi Google account (${profile.email})`;
  } else {
    result = await prisma.googleAccount.create({
      data: {
        userId,
        googleEmail: profile.email,
        googleSub: profile.id,
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry,
      },
    });

    actionType = "GOOGLE_ACCOUNT_CONNECTED";
    actionDescription = `User menghubungkan Google account (${profile.email})`;
  }

  console.log("SAVE GOOGLE ACCOUNT SUCCESS:", {
    userId,
    googleEmail: result.googleEmail,
    googleSub: result.googleSub,
  });

  await logActivity({
    userId,
    action: actionType,
    description: actionDescription,
    ipAddress,
    userAgent,
  });

  return result;
}

async function getGoogleConnectionStatus(userId) {
  if (!userId) {
    throw new Error("User ID is required to get Google connection status");
  }

  const googleAccount = await prisma.googleAccount.findUnique({
    where: { userId },
    select: {
      id: true,
      googleEmail: true,
      googleSub: true,
      tokenExpiry: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!googleAccount) {
    return {
      connected: false,
      googleEmail: null,
      tokenExpiry: null,
      googleSub: null,
      connectedAt: null,
      updatedAt: null,
    };
  }

  return {
    connected: true,
    googleEmail: googleAccount.googleEmail,
    tokenExpiry: googleAccount.tokenExpiry,
    googleSub: googleAccount.googleSub,
    connectedAt: googleAccount.createdAt,
    updatedAt: googleAccount.updatedAt,
  };
}

async function disconnectGoogleAccount(
  userId,
  ipAddress = null,
  userAgent = null,
) {
  if (!userId) {
    throw new Error("User ID is required to disconnect Google account");
  }

  const googleAccount = await prisma.googleAccount.findUnique({
    where: { userId },
  });

  if (!googleAccount) {
    return null;
  }

  await prisma.googleAccount.delete({
    where: { userId },
  });

  await logActivity({
    userId,
    action: "GOOGLE_ACCOUNT_DISCONNECTED",
    description: `User memutuskan koneksi Google account (${googleAccount.googleEmail})`,
    ipAddress,
    userAgent,
  });

  return true;
}

module.exports = {
  getGoogleAuthURL,
  exchangeCodeForTokens,
  getGoogleUserProfile,
  saveGoogleAccount,
  getGoogleConnectionStatus,
  disconnectGoogleAccount,
};
