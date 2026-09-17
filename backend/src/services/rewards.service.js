import mongoose from "mongoose";

import Outbox from "../models/outbox.model.js";
import Member from "../models/member.model.js";
import PointsTransaction from "../models/pointsTransaction.model.js";
import { getTierRules } from "../utils/tier.js";
import { normalizePhone } from "../utils/phone.js";
import { AppError } from "../utils/appError.js";

const EXPIRY_DAYS = 90;

const getExpiryDate = (date = new Date()) => {
    const expiry = new Date(date);
    expiry.setDate(expiry.getDate() + EXPIRY_DAYS);
    return expiry;
};

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

    if (!referenceId?.trim()) {
        throw new AppError(
            "Reference ID is required",
            400
        );
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const ref = referenceId.trim();

            const existing =
                await PointsTransaction.findOne({
                    referenceId: ref
                }).session(session);

            if (existing) {
                result = {
                    idempotent: true,
                    transaction: existing
                };
                return;
            }

            const member =
                await Member.findOne({
                    phone: normalizedPhone
                }).session(session);

            if (!member) {
                throw new AppError(
                    "Member not found",
                    404
                );
            }

            // Tier at the START of the purchase
            const { tier, earnRate } =
                getTierRules(member.lifetimePoints);

            const pointsEarned =
                purchaseAmount * earnRate;

            // Tier AFTER this purchase
            const newLifetimePoints =
                member.lifetimePoints + pointsEarned;

            const { tier: newTier } =
                getTierRules(newLifetimePoints);

            // Atomic member update
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

            if (!updatedMember) {
                throw new AppError(
                    "Member update failed",
                    409
                );
            }

            // Ledger entry
            const [transaction] =
                await PointsTransaction.create(
                    [
                        {
                            memberId: member._id,
                            type: "EARN",
                            pointsAmount: pointsEarned,
                            remainingPoints: pointsEarned,
                            purchaseAmount,
                            referenceId: ref,
                            expiresAt: getExpiryDate()
                        }
                    ],
                    { session }
                );

            // Tier-crossing notification
            if (newTier !== tier) {
                await Outbox.create(
                    [
                        {
                            eventType:
                                "MEMBER_TIER_CHANGED",

                            memberId: member._id,

                            payload: {
                                phone: member.phone,
                                previousTier: tier,
                                newTier,
                                lifetimePoints:
                                    newLifetimePoints
                            },

                            processed: false
                        }
                    ],
                    { session }
                );
            }

            result = {
                idempotent: false,
                transaction,
                member: updatedMember,
                tierUsed: tier,
                earnRate,
                newTier
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
    const normalizedPhone =
        normalizePhone(phone);

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

    if (!referenceId?.trim()) {
        throw new AppError(
            "Reference ID is required",
            400
        );
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const ref = referenceId.trim();

            const existing =
                await PointsTransaction.findOne({
                    referenceId: ref
                }).session(session);

            if (existing) {
                result = {
                    idempotent: true,
                    transaction: existing
                };
                return;
            }

            const member =
                await Member.findOne({
                    phone: normalizedPhone
                }).session(session);

            if (!member) {
                throw new AppError(
                    "Member not found",
                    404
                );
            }

            if (
                member.currentBalance <
                pointsToRedeem
            ) {
                throw new AppError(
                    "Insufficient points",
                    422
                );
            }

            // Atomic balance protection
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
                            currentBalance:
                                -pointsToRedeem
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

            /*
             * Consume oldest unused earned points first.
             * This allows unused points to expire correctly.
             */
            let remaining =
                pointsToRedeem;

            const earns =
                await PointsTransaction.find({
                    memberId: member._id,
                    type: "EARN",
                    remainingPoints: {
                        $gt: 0
                    }
                })
                    .sort({
                        createdAt: 1
                    })
                    .session(session);

            for (const earn of earns) {
                if (remaining <= 0) {
                    break;
                }

                const used = Math.min(
                    earn.remainingPoints,
                    remaining
                );

                earn.remainingPoints -= used;

                remaining -= used;

                await earn.save({
                    session
                });
            }

            if (remaining > 0) {
                throw new AppError(
                    "Points ledger is inconsistent",
                    409
                );
            }

            const [transaction] =
                await PointsTransaction.create(
                    [
                        {
                            memberId: member._id,
                            type: "REDEEM",
                            pointsAmount:
                                -pointsToRedeem,
                            remainingPoints: 0,
                            purchaseAmount: 0,
                            referenceId: ref,
                            expiresAt: null
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

export const expirePoints = async (
    asOf = new Date()
) => {
    const session =
        await mongoose.startSession();

    let expiredTotal = 0;
    let membersAffected = 0;

    try {
        await session.withTransaction(
            async () => {
                const earns =
                    await PointsTransaction.find({
                        type: "EARN",
                        remainingPoints: {
                            $gt: 0
                        },
                        expiresAt: {
                            $lte: asOf
                        },
                        expired: false
                    }).session(session);

                for (const earn of earns) {
                    const points =
                        earn.remainingPoints;

                    const member =
                        await Member.findOneAndUpdate(
                            {
                                _id: earn.memberId,
                                currentBalance: {
                                    $gte: points
                                }
                            },
                            {
                                $inc: {
                                    currentBalance:
                                        -points
                                }
                            },
                            {
                                new: true,
                                session
                            }
                        );

                    if (!member) {
                        throw new AppError(
                            "Balance changed during expiry",
                            409
                        );
                    }

                    earn.remainingPoints = 0;
                    earn.expired = true;

                    await earn.save({
                        session
                    });

                    await PointsTransaction.create(
                        [
                            {
                                memberId:
                                    earn.memberId,

                                type: "EXPIRE",

                                pointsAmount:
                                    -points,

                                remainingPoints: 0,

                                purchaseAmount: 0,

                                referenceId:
                                    `EXPIRY-${earn._id}`,

                                expiresAt: null,

                                expired: true
                            }
                        ],
                        { session }
                    );

                    expiredTotal += points;
                    membersAffected++;
                }
            }
        );

        return {
            expiredPoints:
                expiredTotal,

            membersAffected,

            asOf
        };
    } finally {
        await session.endSession();
    }
};

export const getMemberByPhone = async (
    phone
) => {
    const normalizedPhone =
        normalizePhone(phone);

    const member =
        await Member.findOne({
            phone: normalizedPhone
        }).lean();

    if (!member) {
        throw new AppError(
            "Member not found",
            404
        );
    }

    const { tier, earnRate } =
        getTierRules(
            member.lifetimePoints
        );

    return {
        ...member,
        tier,
        earnRate
    };
};
