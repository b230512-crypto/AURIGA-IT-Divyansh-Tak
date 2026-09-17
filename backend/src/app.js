import express from "express";
import cors from "cors";

import rewardsRoutes from "./routes/rewards.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Rewards Engine is healthy"
    });
});

app.use("/api/rewards", rewardsRoutes);

app.use(errorHandler);

export default app;
