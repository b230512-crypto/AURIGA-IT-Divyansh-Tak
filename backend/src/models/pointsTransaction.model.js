import mongoose from "mongoose";

const pointsTransactionSchema = new mongoose.Schema(
    {
        memberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member",
            required: true
        },

        type: {
            type: String,
            enum: ["EARN", "REDEEM"],
            required: true
        },

        pointsAmount: {
            type: Number,
            required: true
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
