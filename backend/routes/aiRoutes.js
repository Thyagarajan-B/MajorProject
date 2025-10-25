import express from "express";
import {
    explainPrescription,
    symptomChecker,
    healthTip,
} from "../controllers/aiController.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const aiRouter = express.Router();

aiRouter.get("/list-models", async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models =  genAI.listModels()
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
aiRouter.post("/explain-prescription", explainPrescription);
aiRouter.post("/symptom-checker", symptomChecker);
aiRouter.get("/health-tip", healthTip);

export default aiRouter;