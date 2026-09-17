import express from "express";
import { getOutbox } from "../controllers/outbox.controller.js";

const router = express.Router();

router.get("/", getOutbox);

export default router;
