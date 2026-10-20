import express from "express";
import { getActiveAlerts, getAlertsStream, getAllAlerts } from "../controllers/alertController"
import { getAllRegions } from "../controllers/regionController";
import { getAllShelters, getShelterDetails } from "../controllers/shelterController";

const router = express.Router();

// Активні тривоги зараз
router.get('/alerts/active', getActiveAlerts);
router.get('/alerts/stream', getAlertsStream);
router.get('/alerts', getAllAlerts);

router.get('/regions', getAllRegions);

router.get('/shelters', getAllShelters);
router.get('/shelters/:id', getShelterDetails);


export default router;