import Outbox from "../models/outbox.model.js";

export const getOutbox = async (req, res, next) => {
    try {
        const events = await Outbox.find()
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        next(error);
    }
};
