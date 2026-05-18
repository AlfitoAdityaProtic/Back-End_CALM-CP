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

    const result = response.data;

    return {
      aiInsight: result.aiInsight,
      aiScoreExplanation: result.aiScoreExplanation,
      recoverySuggestion: result.recoverySuggestion,
      aiModelName: result.aiModelName || "social-battery-ai-v1",
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

// async function generateSocialBatteryInsight(aiPayload) {
//   // TODO: bagian ini diganti dengan real AI integration

//   const aiInsight = `Hari ini kamu memiliki ${aiPayload.totalEvents} event dengan total durasi ${aiPayload.totalDurationMinutes} menit. Aktivitas sosialmu berada pada level ${aiPayload.batteryStatus}.`;

//   const aiScoreExplanation = `Score ${aiPayload.batteryScore.toFixed(
//     2,
//   )} dihitung berdasarkan jumlah event, total durasi, jumlah attendee, dan event berdurasi panjang. Semakin padat jadwal dan semakin tinggi intensitas sosial, semakin rendah battery score.`;

//   const recoverySuggestion =
//     aiPayload.batteryScore >= 80
//       ? "Energi sosialmu masih cukup baik. Tetap jaga jeda antar aktivitas agar tidak cepat terkuras."
//       : aiPayload.batteryScore >= 50
//         ? "Ambil jeda singkat 15-30 menit setelah aktivitas sosial yang padat."
//         : "Prioritaskan waktu tenang, kurangi aktivitas sosial tambahan, dan coba istirahat tanpa notifikasi.";

//   const aiModelName = "dummy-ai-v1";

//   return {
//     aiInsight,
//     aiScoreExplanation,
//     recoverySuggestion,
//     aiModelName,
//   };
// }

module.exports = {
  generateSocialBatteryInsight,
};
