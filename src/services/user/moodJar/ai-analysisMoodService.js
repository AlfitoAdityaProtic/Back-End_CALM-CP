const axios = require("axios");

const analyzeMood = async ({ feelingText }) => {
  try {
    const response = await axios.post(
      process.env.MOOD_ANALYSIS_AI_URL,
      {
        text: feelingText,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );
    const result = response.data;
    return {
      predictedLabel: result.predictedLabel,
      supportMessage: result.supportMessage,
      confidenceScore: result.confidenceScore,
      // modelName: result.modelName,
      modelName:
        typeof result.modelName === "string"
          ? result.modelName
          : `${result.modelName?.classification || "-"}; ${result.modelName?.generation || "-"}`,
    };
  } catch (error) {
    const status = error.response?.status;

    console.error("AI Mood Analysis Error Status:", status);
    console.error("AI Mood Analysis Error Data:", error.response?.data);
    console.error("AI Mood Analysis Error Message:", error.message);
    if (status === 503) {
      throw new Error(
        "Layanan AI sedang sibuk atau Tidak Tersedia. Silakan coba lagi nanti.",
      );
    }

    if (status === 422 || status === 400) {
      throw new Error(
        "Input tidak valid untuk analisis mood. Silakan periksa kembali inputmu.",
      );
    }

    if (error.code === "ECONNABORTED") {
      throw new Error(
        "Permintaan analisis mood memakan waktu terlalu lama. Silakan coba lagi nanti.",
      );
    }

    throw new Error("Gagal Menganalisis Mood. Silakan coba lagi nanti.");
  }
};

// const analyzeMood = async ({ feelingText }) => {
//   return {
//     predictedLabel: "neutral", //ini bukan diambil dari moodLabel
//     supportMessage:
//       "Terima kasih sudah berbagi. Kamu sudah berusaha dengan baik hari ini, pelan-pelan juga tetap progress.",
//     confidenceScore: 0.91,
//     modelName: "mock-model-v1",
//   };
// };

module.exports = {
  analyzeMood,
};
