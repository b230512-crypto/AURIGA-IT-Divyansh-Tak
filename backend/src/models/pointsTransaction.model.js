import mongoose from "mongoose";

const pointsTransactionSchema = new mongoose.Schema(
    {
        memberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member",
            required: true,
            index: true
        },

        type: {
            type: String,
            enum: ["EARN", "REDEEM", "EXPIRE"],
            required: true
        },

        pointsAmount: {
            type: Number,
            required: true
        },

        remainingPoints: {
            type: Number,
            default: 0,
            min: 0
        },

        purchaseAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        referenceId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        expiresAt: {
            type: Date,
            default: null,
            index: true
        },

        expired: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const PointsTransaction = mongoose.model(
    "PointsTransaction",
    pointsTransactionSchema
);

export default PointsTransaction;
