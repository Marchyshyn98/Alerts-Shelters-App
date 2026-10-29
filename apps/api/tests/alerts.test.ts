import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { getActiveAlertsService, getAllAlertsService } from "../src/services/alertModel";

vi.mock("../src/services/alertModel", () => ({
    getActiveAlertsService: vi.fn(),
    getAllAlertsService: vi.fn(),
}));

const activeAlert = { id: 1, regionId: "kyiv", regionName: "м. Київ", type: "air_raid", source: "alerts-in-ua", startedAt: "2026-10-15T08:00:00Z", endedAt: null };
const endedAlert = { ...activeAlert, id: 2, endedAt: "2026-10-15T09:00:00Z" };

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/alerts/active", () => {
    it("returns active alerts", async () => {
        vi.mocked(getActiveAlertsService).mockResolvedValue([activeAlert]);

        const res = await request(app).get("/api/alerts/active");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([activeAlert]);
        expect(getActiveAlertsService).toHaveBeenCalledOnce();
    });

    it("returns an empty list when there are no active alerts", async () => {
        vi.mocked(getActiveAlertsService).mockResolvedValue([]);

        const res = await request(app).get("/api/alerts/active");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it("returns 500 when the service fails", async () => {
        vi.mocked(getActiveAlertsService).mockRejectedValue(new Error("db down"));

        const res = await request(app).get("/api/alerts/active");

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ status: "error", message: "Something went wrong", error: "db down" });
    });
});

describe("GET /api/alerts", () => {
    it("returns all alerts with default filters", async () => {
        vi.mocked(getAllAlertsService).mockResolvedValue([activeAlert, endedAlert]);

        const res = await request(app).get("/api/alerts");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([activeAlert, endedAlert]);
        expect(getAllAlertsService).toHaveBeenCalledWith({ region: null, type: null, limit: 1000 });
    });

    it("passes region, type and limit query params to the service", async () => {
        vi.mocked(getAllAlertsService).mockResolvedValue([activeAlert]);

        const res = await request(app).get("/api/alerts").query({ region: "kyiv", type: "air_raid", limit: 10 });

        expect(res.status).toBe(200);
        expect(getAllAlertsService).toHaveBeenCalledWith({ region: "kyiv", type: "air_raid", limit: 10 });
    });

    it("caps limit at 10000", async () => {
        vi.mocked(getAllAlertsService).mockResolvedValue([]);

        await request(app).get("/api/alerts").query({ limit: 50000 });

        expect(getAllAlertsService).toHaveBeenCalledWith(expect.objectContaining({ limit: 10000 }));
    });

    it("falls back to the default limit when limit is not a number", async () => {
        vi.mocked(getAllAlertsService).mockResolvedValue([]);

        await request(app).get("/api/alerts").query({ limit: "abc" });

        expect(getAllAlertsService).toHaveBeenCalledWith(expect.objectContaining({ limit: 1000 }));
    });

    it("ignores repeated (array) query params", async () => {
        vi.mocked(getAllAlertsService).mockResolvedValue([]);

        await request(app).get("/api/alerts?region=kyiv&region=lviv");

        expect(getAllAlertsService).toHaveBeenCalledWith(expect.objectContaining({ region: null }));
    });

    it("returns 500 when the service fails", async () => {
        vi.mocked(getAllAlertsService).mockRejectedValue(new Error("db down"));

        const res = await request(app).get("/api/alerts");

        expect(res.status).toBe(500);
        expect(res.body.error).toBe("db down");
    });
});
