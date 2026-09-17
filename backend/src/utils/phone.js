const DEFAULT_COUNTRY_CODE =
    process.env.DEFAULT_COUNTRY_CODE || "91";

export const normalizePhone = (phone) => {
    if (typeof phone !== "string") {
        throw new Error("Phone number must be a string");
    }

    const digits = phone.trim().replace(/\D/g, "");

    if (!digits) {
        throw new Error("Invalid phone number");
    }

    // Local 10-digit number
    if (digits.length === 10) {
        return `+${DEFAULT_COUNTRY_CODE}${digits}`;
    }

    // Already has country code
    if (
        digits.length === 12 &&
        digits.startsWith(DEFAULT_COUNTRY_CODE)
    ) {
        return `+${digits}`;
    }

    throw new Error("Invalid phone number");
};
