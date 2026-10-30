import express from "express";
import cors from "cors";
import routes from "./routes/routes";
import { getHealth } from "./controllers/healthController";
import errorHandling from "./middleware/errorHandler";

const app = express();

// Middlewares
app.use(express.json());
// CORS_ORIGIN — один origin або кілька через кому, без пробілів
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:3000" }));

// Routes
app.use("/api", routes);
app.get("/v1/health", getHealth);

// Error handling middleware
app.use(errorHandling);

export default app;
