import {
    earnPoints,
    redeemPoints,
    getMemberByPhone
} from "../services/rewards.service.js";

export const earn = async (req, res, next) => {
    try {
        const result = await earnPoints(req.body);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const redeem = async (req, res, next) => {
    try {
        const result = await redeemPoints(req.body);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getMember = async (req, res, next) => {
    try {
        const member = await getMemberByPhone(
            req.params.phone
        );

        return res.status(200).json({
            success: true,
            data: member
        });
    } catch (error) {
        next(error);
    }
};
