import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { getHealthService } from "../src/services/healthModel";

vi.mock("../src/services/healthModel", () => ({
    getHealthService: vi.fn(),
}));

const alertsLastSuccess = new Date("2026-10-28T13:34:50Z");
const sheltersLastSuccess = new Date("2026-10-20T10:00:00Z");

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /v1/health", () => {
    it("returns ok when alerts are fresh", async () => {
        vi.mocked(getHealthService).mockResolvedValue({ alertsLastSuccess, alertsAgeSeconds: 42, sheltersLastSuccess });

        const res = await request(app).get("/v1/health");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            status: "ok",
            database: "ok",
            sources: {
                alerts: { lastSuccess: "2026-10-28T13:34:50.000Z", ageSeconds: 42 },
                shelters: { lastSuccess: "2026-10-20T10:00:00.000Z" },
            },
        });
    });

    it("returns degraded when alerts are stale", async () => {
        vi.mocked(getHealthService).mockResolvedValue({ alertsLastSuccess, alertsAgeSeconds: 600, sheltersLastSuccess });

        const res = await request(app).get("/v1/health");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("degraded");
        expect(res.body.database).toBe("ok");
    });

    it("returns degraded when alerts were never synced", async () => {
        vi.mocked(getHealthService).mockResolvedValue({ alertsLastSuccess: null, alertsAgeSeconds: null, sheltersLastSuccess: null });

        const res = await request(app).get("/v1/health");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("degraded");
    });

    it("returns 503 down when the database fails", async () => {
        vi.mocked(getHealthService).mockRejectedValue(new Error("db down"));

        const res = await request(app).get("/v1/health");

        expect(res.status).toBe(503);
        expect(res.body.status).toBe("down");
        expect(res.body.database).toBe("down");
    });
});
