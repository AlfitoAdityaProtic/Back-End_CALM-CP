const axios = require("axios");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const analyzeMoodWithRetry = async (
  { feelingText },
  retries = 2,
  delayMs = 1500,
) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Debugging 6 juli 2026 :
      // console.log("AI URL:", process.env.MOOD_ANALYSIS_AI_URL);
      // console.log("Payload:", { text: feelingText });
      // Debugging End

      const response = await axios.post(
        process.env.MOOD_ANALYSIS_AI_URL,
        { text: feelingText },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 120000,
        },
      );

      const result = response.data;
      return {
        predictedLabel: result.predictedLabel,
        supportMessage: result.supportMessage,
        confidenceScore: result.confidenceScore,
        modelName:
          typeof result.modelName === "string"
            ? result.modelName
            : `${result.modelName?.classification || "-"}; ${result.modelName?.generation || "-"}`,
      };
    } catch (error) {
      const status = error.response?.status;
      const isRetryable =
        status === 503 ||
        status === 502 ||
        status === 504 ||
        error.code === "ECONNABORTED" ||
        error.code === "ECONNRESET";

      console.warn(
        `Attempt ${attempt} failed — status: ${status}, code: ${error.code}`,
      );
      // Debugging 6 juli 2026 :
      // console.error("=== AI ERROR ===");
      // console.error("status :", error.response?.status);
      // console.error("headers:", error.response?.headers);
      // console.error("data   :", error.response?.data);
      // console.error("code   :", error.code);
      // console.error("msg    :", error.message);
      // console.error("================");
      // Debugging End

      if (isRetryable && attempt < retries) {
        const wait = delayMs * attempt; // 3s, 6s, 9s
        console.log(`Retrying in ${wait}ms...`);
        await sleep(wait);
        continue;
      }

      // Error tidak bisa di-retry atau sudah habis kesempatan
      if (status === 503 || status === 502 || status === 504)
        throw new Error("Layanan AI sedang sibuk. Silakan coba lagi nanti.");
      if (status === 422 || status === 400)
        throw new Error("Input tidak valid untuk analisis mood.");
      if (error.code === "ECONNABORTED")
        throw new Error("Analisis mood timeout. Silakan coba lagi.");
      throw new Error("Gagal menganalisis mood. Silakan coba lagi nanti.");
    }
  }
};

const analyzeMood = (params) => analyzeMoodWithRetry(params);

module.exports = { analyzeMood };
