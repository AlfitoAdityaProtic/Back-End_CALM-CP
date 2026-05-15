const analyzeMood = async ({ moodLabel, feelingText }) => {
  return {
    predictedLabel: "neutral", //ini bukan diambil dari moodLabel
    supportMessage:
      "Terima kasih sudah berbagi. Kamu sudah berusaha dengan baik hari ini, pelan-pelan juga tetap progress.",
    confidenceScore: 0.91, 
    modelName: "mock-model-v1",
  };
};

module.exports = {
  analyzeMood,
};