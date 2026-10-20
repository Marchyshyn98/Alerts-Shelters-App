import type { Request, Response, NextFunction } from "express";
import { getAllSheltersService, getShelterDetailsService, getSheltersNearbyService } from "../services/shelterModel";
import { str } from "../utils/query";
import { NearbySheltersQuerySchema } from "@alerts-shelters/shared";

export const getAllShelters = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const allShelters = await getAllSheltersService({
            city: str(req.query.city),
            address: str(req.query.address)
        });
        // console.log("Total shelters: ", allShelters.length)
        res.status(200).json(allShelters)
    } catch (error) {
        next(error);
    }
}

export const getShelterDetails = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
        const shelterDetails = await getShelterDetailsService(id);

        res.status(200).json({ data: shelterDetails });
    } catch (error) {
        next(error);
    }
}

export const getSheltersNearby = async (req: Request, res: Response, next: NextFunction) => {
    const parsed = NearbySheltersQuerySchema.safeParse(req.query);
    
    if(!parsed.success) {
        return res.status(400).json({ title: "Invalid query", detail: parsed.error.message })
    }

    try {
        const sheltersNearby = await getSheltersNearbyService(parsed.data);
        res.status(200).json(sheltersNearby);
    } catch (error) {
        next(error);
    }
}