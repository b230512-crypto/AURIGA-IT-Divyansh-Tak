import mongoose from "mongoose";

const outboxSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            required: true,
            index: true
        },

        memberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member",
            required: true,
            index: true
        },

        payload: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

        processed: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    {
        timestamps: true
    }
);

const Outbox = mongoose.model("Outbox", outboxSchema);

export default Outbox;
