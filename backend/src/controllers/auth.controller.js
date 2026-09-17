import {
    registerUser,
    loginUser
} from "../services/auth.service.js";

export const register = async (req, res, next) => {
    try {
        const result = await registerUser(req.body);

        return res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const result = await loginUser(req.body);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};
