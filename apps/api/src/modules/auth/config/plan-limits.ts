export const PLAN_LIMITS = {
    FREE: {
        maxStaff: 999, // Temp Beta Limits
        maxServices: 999,
        maxClients: 99999,
        modules: ['ALL']
    },
    STARTER: {
        maxStaff: 999,
        maxServices: 999,
        maxClients: 99999,
        modules: ['ALL']
    },
    PRO: {
        maxStaff: 999, // Ilimitado
        maxServices: 999,
        maxClients: 99999,
        modules: ['ALL']
    },
    BUSINESS: {
        maxStaff: 999,
        maxServices: 999,
        maxClients: 99999,
        modules: ['ALL']
    }
};

// Hierarchy definition to allow higher plans access to lower plan features
export const PLAN_HIERARCHY: Record<string, number> = {
    FREE: 0,
    STARTER: 1,
    PRO: 2,
    BUSINESS: 3
};
