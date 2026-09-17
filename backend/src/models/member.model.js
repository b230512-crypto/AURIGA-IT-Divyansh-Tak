import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        lifetimePoints: {
            type: Number,
            default: 0,
            min: 0
        },

        currentBalance: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

const Member = mongoose.model("Member", memberSchema);

export default Member;
