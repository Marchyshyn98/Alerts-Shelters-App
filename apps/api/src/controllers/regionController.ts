import type { Request, Response, NextFunction } from "express";
import { getAllRegionsService } from "../services/regionModel";
import { str } from "../utils/query";

export const getAllRegions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const allRegions = await getAllRegionsService({
            type: str(req.query.type),
            parent: str(req.query.parent)
        });
        // console.log("Total regions: ", allRegions.length)
        res.status(200).json(allRegions);
    } catch (error) {
        next(error);
    }
}


