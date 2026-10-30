import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { getHealthService } from "../src/services/healthModel";

// app.ts читає CORS_ORIGIN під час імпорту, тому змінну треба задати раніше за нього
vi.hoisted(() => {
    process.env.CORS_ORIGIN = "https://one.example,https://two.example";
});

vi.mock("../src/services/healthModel", () => ({
    getHealthService: vi.fn(),
}));

beforeEach(() => {
    vi.mocked(getHealthService).mockResolvedValue({
        alertsLastSuccess: null,
        alertsAgeSeconds: null,
        sheltersLastSuccess: null,
    });
});

describe("CORS", () => {
    it.each(["https://one.example", "https://two.example"])("allows %s", async (origin) => {
        const res = await request(app).get("/v1/health").set("Origin", origin);

        expect(res.headers["access-control-allow-origin"]).toBe(origin);
    });

    it("does not allow an unknown origin", async () => {
        const res = await request(app).get("/v1/health").set("Origin", "https://evil.example");

        expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });
});
