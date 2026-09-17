import express from "express";

import {
    earn,
    redeem,
    getMember
} from "../controllers/rewards.controller.js";

import {
    earnSchema,
    redeemSchema
} from "../validators/rewards.validator.js";

import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.get(
    "/member/:phone",
    getMember
);

router.post(
    "/earn",
    validate(earnSchema),
    earn
);

router.post(
    "/redeem",
    validate(redeemSchema),
    redeem
);

export default router;
