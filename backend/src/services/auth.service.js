import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import { AppError } from "../utils/appError.js";

const createToken = (user) => {
    return jwt.sign(
        {
            userId: user._id.toString(),
            username: user.username,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "8h"
        }
    );
};

export const registerUser = async ({
    username,
    password,
    role = "STAFF"
}) => {
    const existingUser = await User.findOne({
        username: username.trim()
    });

    if (existingUser) {
        throw new AppError("Username already exists", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
        username: username.trim(),
        passwordHash,
        role
    });

    return {
        user: {
            id: user._id,
            username: user.username,
            role: user.role
        },
        token: createToken(user)
    };
};

export const loginUser = async ({
    username,
    password
}) => {
    const user = await User.findOne({
        username: username.trim()
    });

    if (!user) {
        throw new AppError("Invalid credentials", 401);
    }

    const passwordMatches = await bcrypt.compare(
        password,
        user.passwordHash
    );

    if (!passwordMatches) {
        throw new AppError("Invalid credentials", 401);
    }

    return {
        user: {
            id: user._id,
            username: user.username,
            role: user.role
        },
        token: createToken(user)
    };
};
