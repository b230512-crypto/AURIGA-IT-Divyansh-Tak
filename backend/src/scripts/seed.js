import "dotenv/config";

import mongoose from "mongoose";

import Member from "../models/member.model.js";

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        await Member.deleteMany({
            phone: {
                $in: [
                    "+919876543210",
                    "+919999999999"
                ]
            }
        });

        const members = await Member.insertMany([
            {
                phone: "+919876543210",
                name: "Rahul Sharma",
                lifetimePoints: 0,
                currentBalance: 0
            },
            {
                phone: "+919999999999",
                name: "Amit Kumar",
                lifetimePoints: 600,
                currentBalance: 600
            }
        ]);

        console.log("Members created:");

        members.forEach((member) => {
            console.log({
                id: member._id.toString(),
                name: member.name,
                phone: member.phone,
                lifetimePoints: member.lifetimePoints,
                currentBalance: member.currentBalance
            });
        });

        await mongoose.disconnect();

        console.log("Seed completed");
    } catch (error) {
        console.error("Seed failed:", error);
        process.exit(1);
    }
};

seed();
