import express from "express";
import { getActiveAlerts, getAlertsStream, getAllAlerts } from "../controllers/alertController"
import { getAllRegions } from "../controllers/regionController";
import { getAllShelters, getShelterDetails, getSheltersNearby } from "../controllers/shelterController";
import { getStatsSummary } from "../controllers/statsController";

const router = express.Router();

// Активні тривоги зараз
router.get('/alerts/active', getActiveAlerts);
router.get('/alerts/stream', getAlertsStream);
router.get('/alerts', getAllAlerts);

router.get('/regions', getAllRegions);

router.get('/shelters', getAllShelters);
router.get('/shelters/nearby', getSheltersNearby);
router.get('/shelters/:id', getShelterDetails);

router.get('/stats/summary', getStatsSummary);

export default router;