import express from "express";
import {
    explainPrescription,
    symptomChecker,
    healthTip,
} from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.post("/explain-prescription", explainPrescription);
aiRouter.post("/symptom-checker", symptomChecker);
aiRouter.get("/health-tip", healthTip);

export default aiRouter;