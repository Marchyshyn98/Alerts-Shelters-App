import dotenv from "dotenv";
import app from "./app";
import pool from "./config/db";
import { startAlertsListener, stopAlertsListener } from "./services/alertsStream";

dotenv.config();

const port = process.env.API_PORT;

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

void startAlertsListener();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    // спершу закриваємо SSE: інакше server.close() чекатиме їх вічно
    await stopAlertsListener();
    server.close();
    await pool.end();
    process.exit(0);
  });
}