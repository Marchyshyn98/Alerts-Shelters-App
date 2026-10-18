import express from "express";
import cors from "cors";
import routes from "./routes/routes";
import errorHandling from "./middleware/errorHandler";

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
app.use("/api", routes);

// Error handling middleware
app.use(errorHandling);

export default app;
