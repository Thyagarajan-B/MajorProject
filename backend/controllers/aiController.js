import { generateAIResponse } from "../utils/gemini.js";

// AI Prescription Summary
export const explainPrescription = async (req, res) => {
    const { prescriptionText } = req.body;
    const prompt = `Explain this prescription in simple terms for a patient: ${prescriptionText}. 
  Keep it short, friendly, and easy to understand.`;

    const explanation = await generateAIResponse(prompt);
    res.json({ explanation });
};

// AI Symptom Checker
export const symptomChecker = async (req, res) => {
    const { symptoms } = req.body;
    const prompt = `The patient reports these symptoms: ${symptoms}. 
  Suggest 2-3 possible common causes and which type of doctor they should consult.
  Keep it short and educational (not diagnostic).`;

    const suggestion = await generateAIResponse(prompt);
    res.json({ suggestion });
};

// AI Health Tip Generator
export const healthTip = async (req, res) => {
    const prompt = `Generate one short daily health tip related to diet, exercise, or medication care.
  Keep it under 25 words, positive, and easy to read.`;

    const tip = await generateAIResponse(prompt);
    res.json({ tip });
};