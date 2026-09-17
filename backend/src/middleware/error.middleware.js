import { AppError } from "../utils/appError.js";

export const errorHandler = (error, req, res, next) => {
    console.error(error);

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message
        });
    }

    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "Duplicate reference ID"
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
};
