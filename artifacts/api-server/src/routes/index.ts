import { Router, type IRouter } from "express";
import healthRouter from "./health";
import providersRouter from "./providers";
import appointmentsRouter from "./appointments";
import specialtiesRouter from "./specialties";
import testimonialsRouter from "./testimonials";
import statsRouter from "./stats";
import ratingsRouter from "./ratings";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/providers", providersRouter);
router.use("/appointments", appointmentsRouter);
router.use("/specialties", specialtiesRouter);
router.use("/testimonials", testimonialsRouter);
router.use("/stats", statsRouter);
router.use("/ratings", ratingsRouter);
router.use("/admin", adminRouter);

export default router;
