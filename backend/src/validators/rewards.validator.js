import { z } from "zod";

export const earnSchema = z.object({
    phone: z
        .string()
        .trim()
        .min(1, "Phone is required"),

    purchaseAmount: z
        .number()
        .finite()
        .positive("Purchase amount must be greater than 0"),

    referenceId: z
        .string()
        .trim()
        .min(1, "Reference ID is required")
});

export const redeemSchema = z.object({
    phone: z
        .string()
        .trim()
        .min(1, "Phone is required"),

    pointsToRedeem: z
        .number()
        .finite()
        .positive("Points to redeem must be greater than 0"),

    referenceId: z
        .string()
        .trim()
        .min(1, "Reference ID is required")
});
