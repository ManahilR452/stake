import { Router, type IRouter } from "express";
import { ListTacticsResponse } from "@workspace/api-zod";
import { TACTICS } from "../lib/taxonomy.js";

const router: IRouter = Router();

router.get("/tactics", async (_req, res): Promise<void> => {
  const tactics = Object.values(TACTICS).map((t) => ({
    id: t.id,
    label: t.label,
    description: t.description,
    technicalExplanation: t.technicalExplanation,
    plainExplanation: t.plainExplanation,
    examples: t.examples,
  }));

  res.json(ListTacticsResponse.parse(tactics));
});

export default router;
