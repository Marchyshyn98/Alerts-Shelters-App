import type { Request, Response, NextFunction } from "express";
import { getActiveAlertsService, getAllAlertsService } from "../services/alertModel";
import { str } from "../utils/query";

export const getActiveAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activeAlerts = await getActiveAlertsService();
        console.log("Active alerts: ", activeAlerts.length)

        res.status(200).json(activeAlerts);
    } catch (error) {
        next(error);
    }
}

export const getAllAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const allAlerts = await getAllAlertsService({
            region: str(req.query.region),
            type: str(req.query.type),
            limit: Math.min(Number(req.query.limit) || 1000, 10000)
        });
        // console.log("Total alerts: ", allAlerts.length)
        res.status(200).json({
            data: allAlerts
        });
    } catch (error) {
        next(error);
    }
}


