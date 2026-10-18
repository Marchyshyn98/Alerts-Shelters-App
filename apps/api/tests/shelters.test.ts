import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { getAllSheltersService, getShelterDetailsService } from "../src/services/shelterModel";

vi.mock("../src/services/shelterModel", () => ({
    getAllSheltersService: vi.fn(),
    getShelterDetailsService: vi.fn(),
}));

const shelter = { id: "1", city: "Київ", type: "bunker", address: "вул. Хрещатик, 1" };

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/shelters", () => {
    it("returns all shelters with no filters", async () => {
        vi.mocked(getAllSheltersService).mockResolvedValue([shelter]);

        const res = await request(app).get("/api/shelters");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ data: [shelter] });
        expect(getAllSheltersService).toHaveBeenCalledWith({ city: null, type: null });
    });

    it("passes city and type query params to the service", async () => {
        vi.mocked(getAllSheltersService).mockResolvedValue([shelter]);

        await request(app).get("/api/shelters").query({ city: "Київ", type: "bunker" });

        expect(getAllSheltersService).toHaveBeenCalledWith({ city: "Київ", type: "bunker" });
    });

    it("returns 500 when the service fails", async () => {
        vi.mocked(getAllSheltersService).mockRejectedValue(new Error("db down"));

        const res = await request(app).get("/api/shelters");

        expect(res.status).toBe(500);
        expect(res.body.error).toBe("db down");
    });
});

describe("GET /api/shelters/:id", () => {
    it("returns shelter details", async () => {
        vi.mocked(getShelterDetailsService).mockResolvedValue([shelter]);

        const res = await request(app).get("/api/shelters/1");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ data: [shelter] });
        expect(getShelterDetailsService).toHaveBeenCalledWith("1");
    });

    it("returns an empty list when the shelter is not found", async () => {
        vi.mocked(getShelterDetailsService).mockResolvedValue([]);

        const res = await request(app).get("/api/shelters/999");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ data: [] });
    });

    it("returns 500 when the service fails", async () => {
        vi.mocked(getShelterDetailsService).mockRejectedValue(new Error("db down"));

        const res = await request(app).get("/api/shelters/1");

        expect(res.status).toBe(500);
        expect(res.body.error).toBe("db down");
    });
});

describe("unknown routes", () => {
    it("returns 404 for an unknown endpoint", async () => {
        const res = await request(app).get("/api/unknown");

        expect(res.status).toBe(404);
    });
});
