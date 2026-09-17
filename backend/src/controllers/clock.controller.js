import { expirePoints } from "../services/rewards.service.js";

export const runClock = async (req, res, next) => {
    try {
        const asOf = req.body?.asOf
            ? new Date(req.body.asOf)
            : new Date();

        if (Number.isNaN(asOf.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid asOf date"
            });
        }

        const result = await expirePoints(asOf);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};
