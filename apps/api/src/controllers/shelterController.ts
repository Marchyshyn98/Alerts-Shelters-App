import type { Request, Response, NextFunction } from "express";
import { getAllSheltersService, getShelterDetailsService } from "../services/shelterModel";
import { str } from "../utils/query";

export const getAllShelters = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const allShelters = await getAllSheltersService({
            city: str(req.query.city),
            address: str(req.query.address)
        });
        console.log("Total shelters: ", allShelters.length)
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