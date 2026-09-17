import mongoose from "mongoose";

import Member from "../models/member.model.js";
import PointsTransaction from "../models/pointsTransaction.model.js";
import { getTierRules } from "../utils/tier.js";
import { normalizePhone } from "../utils/phone.js";
import { AppError } from "../utils/appError.js";

export const earnPoints = async ({
    phone,
    purchaseAmount,
    referenceId
}) => {
    const normalizedPhone = normalizePhone(phone);

    if (
        typeof purchaseAmount !== "number" ||
        !Number.isFinite(purchaseAmount) ||
        purchaseAmount <= 0
    ) {
        throw new AppError(
            "Purchase amount must be greater than 0",
            400
        );
    }

    if (
        typeof referenceId !== "string" ||
        !referenceId.trim()
    ) {
        throw new AppError(
            "Reference ID is required",
            400
        );
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const existingTransaction =
                await PointsTransaction.findOne({
                    referenceId: referenceId.trim()
                }).session(session);

            if (existingTransaction) {
                result = {
                    idempotent: true,
                    transaction: existingTransaction
                };
                return;
            }

            const member = await Member.findOne({
                phone: normalizedPhone
            }).session(session);

            if (!member) {
                throw new AppError(
                    "Member not found",
                    404
                );
            }

            // Tier is calculated BEFORE this purchase.
            const { tier, earnRate } =
                getTierRules(member.lifetimePoints);

            const pointsEarned =
                purchaseAmount * earnRate;

            const updatedMember =
                await Member.findOneAndUpdate(
                    {
                        _id: member._id
                    },
                    {
                        $inc: {
                            lifetimePoints: pointsEarned,
                            currentBalance: pointsEarned
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

            const [transaction] =
                await PointsTransaction.create(
                    [
                        {
                            memberId: member._id,
                            type: "EARN",
                            pointsAmount: pointsEarned,
                            purchaseAmount,
                            referenceId: referenceId.trim()
                        }
                    ],
                    { session }
                );

            result = {
                idempotent: false,
                transaction,
                member: updatedMember,
                tierUsed: tier,
                earnRate
            };
        });

        return result;
    } finally {
        await session.endSession();
    }
};

export const redeemPoints = async ({
    phone,
    pointsToRedeem,
    referenceId
}) => {
    const normalizedPhone = normalizePhone(phone);

    if (
        typeof pointsToRedeem !== "number" ||
        !Number.isFinite(pointsToRedeem) ||
        pointsToRedeem <= 0
    ) {
        throw new AppError(
            "Points to redeem must be greater than 0",
            400
        );
    }

    if (
        typeof referenceId !== "string" ||
        !referenceId.trim()
    ) {
        throw new AppError(
            "Reference ID is required",
            400
        );
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const existingTransaction =
                await PointsTransaction.findOne({
                    referenceId: referenceId.trim()
                }).session(session);

            if (existingTransaction) {
                result = {
                    idempotent: true,
                    transaction: existingTransaction
                };
                return;
            }

            const member = await Member.findOne({
                phone: normalizedPhone
            }).session(session);

            if (!member) {
                throw new AppError(
                    "Member not found",
                    404
                );
            }

            if (member.currentBalance < pointsToRedeem) {
                throw new AppError(
                    "Insufficient points",
                    422
                );
            }

            const updatedMember =
                await Member.findOneAndUpdate(
                    {
                        _id: member._id,
                        currentBalance: {
                            $gte: pointsToRedeem
                        }
                    },
                    {
                        $inc: {
                            currentBalance: -pointsToRedeem
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

            if (!updatedMember) {
                throw new AppError(
                    "Balance changed during redemption. Please retry.",
                    409
                );
            }

            const [transaction] =
                await PointsTransaction.create(
                    [
                        {
                            memberId: member._id,
                            type: "REDEEM",
                            pointsAmount: -pointsToRedeem,
                            purchaseAmount: 0,
                            referenceId: referenceId.trim()
                        }
                    ],
                    { session }
                );

            result = {
                idempotent: false,
                transaction,
                member: updatedMember
            };
        });

        return result;
    } finally {
        await session.endSession();
    }
};

export const getMemberByPhone = async (phone) => {
    const normalizedPhone = normalizePhone(phone);

    const member = await Member.findOne({
        phone: normalizedPhone
    }).lean();

    if (!member) {
        throw new AppError("Member not found", 404);
    }

    const { tier, earnRate } =
        getTierRules(member.lifetimePoints);

    return {
        ...member,
        tier,
        earnRate
    };
};
