// const OpenAi = require("openai");
// const openai = new OpenAi({
//   apiKey: process.env.OPENAI_API_KEY,
// })

// async function generateSocialBatteryInsight(aiPayload) {
//   const prompt = `
// Kamu adalah AI wellness assistant.

// Analisa data social battery user berikut dan balas HANYA JSON valid dengan format:

// {
//   "aiInsight": "...",
//   "aiScoreExplanation": "...",
//   "recoverySuggestion": "...",
//   "aiModelName": "..."
// }

// Data:
// ${JSON.stringify(aiPayload, null, 2)}
// `;

//   const response = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     messages: [
//       {
//         role: "system",
//         content:
//           "Kamu adalah AI wellness assistant yang membantu user memahami social battery mereka.",
//       },
//       {
//         role: "user",
//         content: prompt,
//       },
//     ],
//     temperature: 0.7,
//   });

//   const rawResult = response.choices[0].message.content;

//   const parsedResult = JSON.parse(rawResult);

//   return {
//     aiInsight: parsedResult.aiInsight,
//     aiScoreExplanation: parsedResult.aiScoreExplanation,
//     recoverySuggestion: parsedResult.recoverySuggestion,
//     aiModelName: parsedResult.aiModelName || "gpt-4.1-mini",
//   };
// }

async function generateSocialBatteryInsight(aiPayload) {
  // TODO: nanti bagian ini diganti dengan real AI integration

  const aiInsight = `Hari ini kamu memiliki ${aiPayload.totalEvents} event dengan total durasi ${aiPayload.totalDurationMinutes} menit. Aktivitas sosialmu berada pada level ${aiPayload.batteryStatus}.`;

  const aiScoreExplanation = `Score ${aiPayload.batteryScore.toFixed(
    2,
  )} dihitung berdasarkan jumlah event, total durasi, jumlah attendee, dan event berdurasi panjang. Semakin padat jadwal dan semakin tinggi intensitas sosial, semakin rendah battery score.`;

  const recoverySuggestion =
    aiPayload.batteryScore >= 80
      ? "Energi sosialmu masih cukup baik. Tetap jaga jeda antar aktivitas agar tidak cepat terkuras."
      : aiPayload.batteryScore >= 50
        ? "Ambil jeda singkat 15-30 menit setelah aktivitas sosial yang padat."
        : "Prioritaskan waktu tenang, kurangi aktivitas sosial tambahan, dan coba istirahat tanpa notifikasi.";

  const aiModelName = "dummy-ai-v1";

  return {
    aiInsight,
    aiScoreExplanation,
    recoverySuggestion,
    aiModelName,
  };
}

module.exports = {
  generateSocialBatteryInsight,
};
