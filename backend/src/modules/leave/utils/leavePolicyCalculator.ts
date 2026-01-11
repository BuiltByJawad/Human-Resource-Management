import { LeaveType } from '@prisma/client';

export interface LeaveTypePolicy {
    annualEntitlementDays: number;
    carryForwardMaxDays?: number;
    accrual?: {
        enabled: boolean;
        frequency: 'monthly';
    };
}

export interface LeavePolicySettings {
    policies: Partial<Record<LeaveType, LeaveTypePolicy>>;
    calendar?: {
        holidays?: string[];
    };
}

export interface LeaveUsageSummary {
    usedDaysByType: Partial<Record<LeaveType, number>>;
    usedDaysByTypePreviousYear?: Partial<Record<LeaveType, number>>;
}

export interface LeaveBalanceItem {
    total: number;
    used: number;
    remaining: number;
    carryForward: number;
    entitlement: number;
}

export type LeaveBalanceResult = Record<string, LeaveBalanceItem>;

const DEFAULT_POLICIES: Record<LeaveType, LeaveTypePolicy> = {
    annual: { annualEntitlementDays: 20, carryForwardMaxDays: 5, accrual: { enabled: true, frequency: 'monthly' } },
    sick: { annualEntitlementDays: 10, carryForwardMaxDays: 0, accrual: { enabled: false, frequency: 'monthly' } },
    personal: { annualEntitlementDays: 5, carryForwardMaxDays: 0, accrual: { enabled: false, frequency: 'monthly' } },
    maternity: { annualEntitlementDays: 90, carryForwardMaxDays: 0, accrual: { enabled: false, frequency: 'monthly' } },
    paternity: { annualEntitlementDays: 14, carryForwardMaxDays: 0, accrual: { enabled: false, frequency: 'monthly' } },
    unpaid: { annualEntitlementDays: 0, carryForwardMaxDays: 0, accrual: { enabled: false, frequency: 'monthly' } },
};

const toNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    return null;
};

export const getLeavePolicySettingsFromJson = (settingsJson: unknown): LeavePolicySettings => {
    const root = typeof settingsJson === 'object' && settingsJson !== null ? (settingsJson as Record<string, unknown>) : {};
    const leave = typeof root.leave === 'object' && root.leave !== null ? (root.leave as Record<string, unknown>) : {};

    const policiesRaw =
        typeof leave.policies === 'object' && leave.policies !== null ? (leave.policies as Record<string, unknown>) : {};

    const policies: Partial<Record<LeaveType, LeaveTypePolicy>> = {};

    (Object.keys(DEFAULT_POLICIES) as LeaveType[]).forEach((type) => {
        const policyCandidate =
            typeof policiesRaw[type] === 'object' && policiesRaw[type] !== null
                ? (policiesRaw[type] as Record<string, unknown>)
                : undefined;

        if (!policyCandidate) return;

        const annualEntitlementDays = toNumber(policyCandidate.annualEntitlementDays);
        if (annualEntitlementDays === null) return;

        const carryForwardMaxDays = toNumber(policyCandidate.carryForwardMaxDays);
        const accrualRaw =
            typeof policyCandidate.accrual === 'object' && policyCandidate.accrual !== null
                ? (policyCandidate.accrual as Record<string, unknown>)
                : undefined;

        const accrualEnabled = accrualRaw ? accrualRaw.enabled === true : false;
        const frequency = accrualRaw?.frequency === 'monthly' ? 'monthly' : 'monthly';

        policies[type] = {
            annualEntitlementDays,
            carryForwardMaxDays: carryForwardMaxDays ?? undefined,
            accrual: {
                enabled: accrualEnabled,
                frequency,
            },
        };
    });

    const calendarRaw =
        typeof leave.calendar === 'object' && leave.calendar !== null ? (leave.calendar as Record<string, unknown>) : undefined;
    const holidaysRaw = Array.isArray(calendarRaw?.holidays) ? calendarRaw?.holidays : undefined;
    const holidays =
        holidaysRaw?.filter((h): h is string => typeof h === 'string' && h.length > 0).map((h) => h.slice(0, 10)) ?? undefined;

    return {
        policies,
        calendar: holidays ? { holidays } : undefined,
    };
};

export const calculateBusinessDays = (startDate: Date, endDate: Date, holidays?: Set<string>): number => {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
        const dayOfWeek = current.getDay();
        const iso = current.toISOString().slice(0, 10);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidays ? holidays.has(iso) : false;
        if (!isWeekend && !isHoliday) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
};

const prorateEntitlement = (annualEntitlementDays: number, asOf: Date): number => {
    const monthIndex = asOf.getMonth();
    const monthsElapsed = Math.min(12, Math.max(0, monthIndex + 1));
    return Math.round((annualEntitlementDays * monthsElapsed) / 12);
};

const prorateEntitlementFromHireDate = (params: { annualEntitlementDays: number; asOf: Date; hireDate?: Date | null }): number => {
    const { annualEntitlementDays, asOf, hireDate } = params;

    if (!hireDate) {
        return prorateEntitlement(annualEntitlementDays, asOf);
    }

    const year = asOf.getFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const effectiveStart = hireDate > startOfYear ? hireDate : startOfYear;

    // If hired after the asOf date, no entitlement yet.
    if (effectiveStart > asOf) return 0;

    const startMonth = effectiveStart.getUTCMonth();
    const endMonth = asOf.getUTCMonth();
    const monthsEligible = Math.min(12, Math.max(0, endMonth - startMonth + 1));
    return Math.round((annualEntitlementDays * monthsEligible) / 12);
};

export const calculateLeaveBalances = (params: {
    asOf: Date;
    settings: LeavePolicySettings;
    usage: LeaveUsageSummary;
    hireDate?: Date | null;
}): LeaveBalanceResult => {
    const { asOf, settings, usage, hireDate } = params;

    const result: LeaveBalanceResult = {};

    (Object.keys(DEFAULT_POLICIES) as LeaveType[]).forEach((type) => {
        const basePolicy = DEFAULT_POLICIES[type];
        const policy = settings.policies[type] ?? basePolicy;

        const used = usage.usedDaysByType[type] ?? 0;
        const prevUsed = usage.usedDaysByTypePreviousYear?.[type] ?? 0;

        const carryForwardMax = policy.carryForwardMaxDays ?? 0;
        const prevRemaining = Math.max(0, policy.annualEntitlementDays - prevUsed);
        const carryForward = Math.min(carryForwardMax, prevRemaining);

        const entitlement = policy.accrual?.enabled
            ? prorateEntitlementFromHireDate({ annualEntitlementDays: policy.annualEntitlementDays, asOf, hireDate })
            : hireDate && hireDate.getFullYear() === asOf.getFullYear()
                ? prorateEntitlementFromHireDate({ annualEntitlementDays: policy.annualEntitlementDays, asOf, hireDate })
                : policy.annualEntitlementDays;

        const total = entitlement + carryForward;
        const remaining = Math.max(0, total - used);

        result[type] = {
            total,
            used,
            remaining,
            carryForward,
            entitlement,
        };
    });

    // Backward-compatible alias (older code used "casual", but Prisma enum uses "personal")
    result.casual = result.personal;

    return result;
};
