const analyzeMood = async ({ moodLabel, feelingText }) => {
  return {
    moodScore: 42,
    predictedLabel: moodLabel,
    supportMessage:
      "Terima kasih sudah berbagi. Kamu sudah berusaha dengan baik hari ini, pelan-pelan juga tetap progress.",
    confidenceScore: 0.91,
    modelName: "mock-model-v1",
  };
};

module.exports = {
  analyzeMood,
};