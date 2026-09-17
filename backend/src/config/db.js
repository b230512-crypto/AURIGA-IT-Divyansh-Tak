import mongoose from "mongoose";

export const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not configured");
    }

    const connection = await mongoose.connect(process.env.MONGO_URI);

    console.log(
        `MongoDB connected: ${connection.connection.host}`
    );
};

export const disconnectDB = async () => {
    await mongoose.disconnect();
};
