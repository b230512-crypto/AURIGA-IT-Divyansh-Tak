export const getTierRules = (lifetimePoints) => {
    if (
        typeof lifetimePoints !== "number" ||
        !Number.isFinite(lifetimePoints) ||
        lifetimePoints < 0
    ) {
        throw new Error("Invalid lifetime points");
    }

    if (lifetimePoints < 500) {
        return {
            tier: "Bronze",
            earnRate: 1.0
        };
    }

    if (lifetimePoints < 1500) {
        return {
            tier: "Silver",
            earnRate: 1.25
        };
    }

    return {
        tier: "Gold",
        earnRate: 1.5
    };
};
