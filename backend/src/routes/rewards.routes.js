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
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
    "/member/:phone",
    getMember
);

router.post(
    "/earn",
    authenticate,
    validate(earnSchema),
    earn
);

router.post(
    "/redeem",
    authenticate,
    validate(redeemSchema),
    redeem
);

export default router;
