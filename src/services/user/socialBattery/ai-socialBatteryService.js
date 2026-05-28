const axios = require("axios");
async function generateSocialBatteryInsight(aiPayload) {
  try {
    const response = await axios.post(
      process.env.SOCIAL_BATTERY_AI_URL,
      aiPayload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );

    const result = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    return {
      aiInsight: result.aiInsight,
      aiScoreExplanation: result.aiScoreExplanation,
      recoverySuggestion: result.recoverySuggestion,
      aiModelName: result.aiModelName || "social-battery-ai-v3",
    };
  } catch (error) {
    console.error(
      "AI Social Battery Error:",
      error.response?.data || error.message,
    );

    throw new Error("Gagal Generate AI Insight Social Battery");
  }
}

module.exports = {
  generateSocialBatteryInsight,
};
