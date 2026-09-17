import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError.js";

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError("Authentication required", 401));
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch (error) {
        next(new AppError("Invalid or expired token", 401));
    }
};
