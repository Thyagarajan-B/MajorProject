import { generateAIResponse } from "../utils/gemini.js";

// AI Prescription Summary
export const explainPrescription = async (req, res) => {
  try {
    const { prescriptionText } = req.body;
    const prompt = `You are a medical assistant. Explain this prescription in simple words for a patient.

Tell what each medicine/tablet/syrup is used for (its purpose) in a very simple way.
Do NOT give dosage or duration (no "take twice a day" or "for 5 days" type instructions).
Provide helpful recovery tips based on the illness — include safe home remedies, foods to eat, foods to avoid, and lifestyle advice.
Keep the tone friendly, supportive, and easy to understand.
Avoid medical jargon — explain like talking to a normal person.
Do not add extra medicines or medical advice outside the prescription.
Prescription: ${prescriptionText}
`;


    const explanation = await generateAIResponse(prompt);
    res.json({ explanation });
  } catch (error) {
    console.error("AI Prescription Error:", error);
    res.status(500).json({ explanation: "⚠️ Sorry, AI couldn't generate a response right now." });
  }
};

// AI Symptom Checker
export const symptomChecker = async (req, res) => {
  try {
    const { symptoms } = req.body;
    const prompt = `The patient reports these symptoms: ${symptoms}. 
Suggest 2-3 possible common causes and which type of doctor they should consult.
Keep it short and educational (not diagnostic).`;

    const suggestion = await generateAIResponse(prompt);
    res.json({ suggestion });
  } catch (error) {
    console.error("AI Symptom Checker Error:", error);
    res.status(500).json({ suggestion: "⚠️ Sorry, AI couldn't generate a response right now." });
  }
};

// AI Health Tip Generator
export const healthTip = async (req, res) => {
  try {
    const prompt = `Generate one short daily health tip related to diet, exercise, or medication care.
Keep it under 25 words, positive, and easy to read.`;

    const tip = await generateAIResponse(prompt);
    res.json({ tip });
  } catch (error) {
    console.error("AI Health Tip Error:", error);
    res.status(500).json({ tip: "⚠️ Sorry, AI couldn't generate a response right now." });
  }
};
