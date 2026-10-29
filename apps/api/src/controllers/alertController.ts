import type { Request, Response, NextFunction } from "express";
import { getActiveAlertsService, getAllAlertsService } from "../services/alertModel";
import { addClient, formatEvent, removeClient } from "../services/alertsStream";
import { str } from "../utils/query";

export const getActiveAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activeAlerts = await getActiveAlertsService();
        // console.log("Active alerts: ", activeAlerts.length)

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
        res.status(200).json(allAlerts);
    } catch (error) {
        next(error);
    }
}

export const getAlertsStream = async (req: Request, res: Response) => {
    // ставить статус і заголовки та відразу їх відправляє. Окремий flushHeaders не потрібен.
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no" // якщо колись буде nginx перед API
    });

    // інтервал перепідключення EventSource після обриву
    res.write("retry: 5000\n\n");

    addClient(res);

    // Підписатися на req.on("close") і прибирати клієнта з набору, коли вкладку закрили. Інакше буде витік пам'яті й запис у закриті сокети.
    req.on("close", () => removeClient(res));

    try {
        // початковий стан, щоб клієнт не чекав наступної зміни
        const alerts = await getActiveAlertsService();
        res.write(formatEvent("alerts", alerts));
    } catch (error) {
        // заголовки вже надіслані, тому errorHandler тут не допоможе
        console.error("alerts stream initial load failed:", error);
        removeClient(res);
        res.end();
    }
}


