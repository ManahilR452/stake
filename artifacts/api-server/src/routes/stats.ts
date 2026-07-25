import { Router, type IRouter } from "express";
import { GetStatsResponse } from "@workspace/api-zod";
import { getAggregateStats } from "../lib/db.js";

const router: IRouter = Router();

router.get("/stats", async (req, res): Promise<void> => {
  const stats = await getAggregateStats();
  const validated = GetStatsResponse.safeParse(stats);
  if (!validated.success) {
    req.log.error({ error: validated.error.message }, "Stats shape invalid");
    res.status(500).json({ error: "Failed to load stats" });
    return;
  }
  res.json(validated.data);
});

export default router;
