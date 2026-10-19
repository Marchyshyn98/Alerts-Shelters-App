import type { Response } from "express";
import pkg from "pg"; // import package from postgreclient
import { dbConfig } from "../config/db";
import { getActiveAlertsService } from "./alertModel";

const { Client } = pkg;
type PgClient = InstanceType<typeof Client>;

const CHANNEL = "alerts_changed";
const HEARTBEAT_MS = 20_000;
const RECONNECT_MS = 5_000;

// Відкриті SSE-з'єднання
const clients = new Set<Response>();

// Формат SSE: рядки "поле: значення" + порожній рядок у кінці
export const formatEvent = (event: string, data: unknown) =>
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

export const addClient = (res: Response) => clients.add(res);
export const removeClient = (res: Response) => clients.delete(res);

const send = (res: Response, chunk: string) => {
    try {
        res.write(chunk);
    } catch {
        clients.delete(res); // сокет уже закритий
    }
};

// Один запит до БД на зміну, а не на кожного клієнта
export const broadcastActiveAlerts = async () => {
    if (clients.size === 0) return;
    const alerts = await getActiveAlertsService();
    const chunk = formatEvent("alerts", alerts);
    for (const res of clients) send(res, chunk);
};

let listener: PgClient | null = null;
let heartbeat: NodeJS.Timeout | null = null;
let stopped = false;

const scheduleReconnect = () => {
    if (stopped) return;
    listener = null;
    setTimeout(() => void connect(), RECONNECT_MS);
};

async function connect() {
    const client = new Client(dbConfig);

    client.on("notification", () => {
        broadcastActiveAlerts().catch((err) => console.error("alerts broadcast failed:", err));
    });

    client.on("error", (err) => {
        console.error("alerts listener error:", err.message);
        client.end().catch(() => {});
        scheduleReconnect();
    });

    try {
        await client.connect();
        await client.query(`LISTEN ${CHANNEL}`);
        listener = client;
        console.log(`Listening for "${CHANNEL}"`);
        // поки не було з'єднання, могли пропустити зміни
        await broadcastActiveAlerts();
    } catch (err) {
        console.error("alerts listener connect failed:", (err as Error).message);
        scheduleReconnect();
    }
}

export const startAlertsListener = async () => {
    stopped = false;
    // коментар ": ..." браузер ігнорує, а проксі не закривають «мовчазне» з'єднання
    heartbeat = setInterval(() => {
        for (const res of clients) send(res, ": ping\n\n");
    }, HEARTBEAT_MS);
    await connect();
};

export const stopAlertsListener = async () => {
    stopped = true;
    if (heartbeat) clearInterval(heartbeat);
    for (const res of clients) res.end();
    clients.clear();
    await listener?.end();
};