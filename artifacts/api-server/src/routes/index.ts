import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import analyzeRouter from "./analyze.js";
import tacticsRouter from "./tactics.js";
import statsRouter from "./stats.js";
import rewriteRouter from "./rewrite.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(tacticsRouter);
router.use(statsRouter);
router.use(rewriteRouter);

export default router;
