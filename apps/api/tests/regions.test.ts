import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { getAllRegionsService } from "../src/services/regionModel";

vi.mock("../src/services/regionModel", () => ({
    getAllRegionsService: vi.fn(),
}));

const oblast = { id: "kyivska", name: "Київська область", type: "oblast", parent_id: null };
const city = { id: "kyiv", name: "Київ", type: "city", parent_id: "kyivska" };

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/regions", () => {
    it("returns all regions with no filters", async () => {
        vi.mocked(getAllRegionsService).mockResolvedValue([oblast, city]);

        const res = await request(app).get("/api/regions");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ data: [oblast, city] });
        expect(getAllRegionsService).toHaveBeenCalledWith({ type: null, parent: null });
    });

    it("passes type and parent query params to the service", async () => {
        vi.mocked(getAllRegionsService).mockResolvedValue([city]);

        const res = await request(app).get("/api/regions").query({ type: "city", parent: "kyivska" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ data: [city] });
        expect(getAllRegionsService).toHaveBeenCalledWith({ type: "city", parent: "kyivska" });
    });

    it("returns 500 when the service fails", async () => {
        vi.mocked(getAllRegionsService).mockRejectedValue(new Error("db down"));

        const res = await request(app).get("/api/regions");

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ status: "error", message: "Something went wrong", error: "db down" });
    });
});
