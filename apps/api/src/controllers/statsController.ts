import type { Request, Response, NextFunction } from "express";
import { getStatsSummaryService } from "../services/statsModel";
import { StatsQuerySchema } from "@alerts-shelters/shared";

export const getStatsSummary = async (req: Request, res: Response, next: NextFunction) => {
    const parsed = StatsQuerySchema.safeParse(req.query);

    if(!parsed.success) {
        return res.status(400).json({ title: "Invalid query", detail: parsed.error.message })
    }
    
    try {
        const statsSummary = await getStatsSummaryService(parsed.data);

        res.status(200).json(statsSummary);
    } catch (error) {
        next(error);
    }
}