import type { ErrorRequestHandler } from "express";

// Express recognizes error middleware only by its 4-argument signature
const errorHandling: ErrorRequestHandler = (err: Error, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
        status: "error",
        message: "Something went wrong",
        error: err.message
    });
}

export default errorHandling;
