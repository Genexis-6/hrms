import Staff from '../models/Staff.js';
import AuditLog from '../models/AuditLog.js';
import { createAuditEntry } from '../middleware/audit.js';

interface ReconciliationReport {
    generatedAt: Date;
    activeStaffCount: number;
    payrollHeadcount: number;
    discrepancy: number;
    ghostWorkerCandidates: { staffId: string; name: string; department: string; lastActive: string }[];
    missingFromPayroll: { staffId: string; name: string; department: string }[];
    salaryGradeChanges: { staffId: string; name: string; oldGrade: string; newGrade: string; date: string }[];
    summary: string;
}

const SALARY_STRUCTURE: Record<string, number> = {
    'CONUASS 1': 180000,
    'CONUASS 2': 200000,
    'CONUASS 3': 230000,
    'CONUASS 4': 270000,
    'CONUASS 5': 320000,
    'CONUASS 6': 380000,
    'CONUASS 7': 450000,
    'CONTISS 6': 80000,
    'CONTISS 7': 95000,
    'CONTISS 8': 110000,
    'CONTISS 9': 130000,
    'CONTISS 10': 150000,
    'CONTISS 11': 175000,
    'CONTISS 12': 200000,
    'CONTISS 13': 230000,
    'CONTISS 14': 260000,
    'CONTISS 15': 300000,
};

// Helper to safely format a date to YYYY-MM-DD string
const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function getSalaryAmount(gradeLevel: string): number {
    return SALARY_STRUCTURE[gradeLevel] || 0;
}

export function calculateMonthlyPayroll(): {
    totalStaff: number;
    totalPayroll: number;
    breakdown: { grade: string; count: number; total: number }[];
} {
    return {
        totalStaff: 0,
        totalPayroll: 0,
        breakdown: [],
    };
}

export async function generateReconciliationReport(
    payrollHeadcount: number,
    systemUserId: string
): Promise<ReconciliationReport> {
    const activeStaff = await Staff.find({ isActive: true })
        .select('staffId firstName lastName department salaryGradeLevel createdAt')
        .lean();

    const inactiveStaff = await Staff.find({ isActive: false })
        .select('staffId firstName lastName department createdAt')
        .lean();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const ghostWorkerCandidates: { staffId: string; name: string; department: string; lastActive: string }[] =
        inactiveStaff
            .filter(s => {
                const lastActive = s.createdAt ? new Date(s.createdAt) : new Date();
                return lastActive < thirtyDaysAgo;
            })
            .map(s => {
                const lastActiveDate = s.createdAt ? new Date(s.createdAt) : new Date();
                return {
                    staffId: s.staffId,
                    name: `${s.firstName} ${s.lastName}`,
                    department: s.department || 'Unknown',
                    lastActive: formatDateString(lastActiveDate),
                };
            });

    const discrepancy = payrollHeadcount - activeStaff.length;

    const recentGradeChanges = await AuditLog.find({
        entity: 'Staff' as const,
        action: 'UPDATE' as const,
        'changes.after.salaryGradeLevel': { $exists: true },
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })
        .sort('-timestamp')
        .limit(20)
        .lean();

    const salaryGradeChanges: { staffId: string; name: string; oldGrade: string; newGrade: string; date: string }[] =
        recentGradeChanges.map(log => {
            const changes = log.changes as Record<string, unknown> | undefined;
            const before = (changes?.before as Record<string, unknown>) || {};
            const after = (changes?.after as Record<string, unknown>) || {};
            const logDate = log.timestamp ? new Date(log.timestamp as unknown as string) : new Date();

            return {
                staffId: String(after?.staffId || ''),
                name: '',
                oldGrade: String(before?.salaryGradeLevel || 'Unknown'),
                newGrade: String(after?.salaryGradeLevel || 'Unknown'),
                date: formatDateString(logDate),
            };
        });

    const summary =
        discrepancy > 0
            ? `⚠️ DISCREPANCY: Payroll has ${discrepancy} more staff than active records. ${ghostWorkerCandidates.length} potential ghost workers detected.`
            : discrepancy < 0
                ? `⚠️ DISCREPANCY: ${Math.abs(discrepancy)} active staff missing from payroll.`
                : '✅ RECONCILED: Staff count matches payroll.';

    const report: ReconciliationReport = {
        generatedAt: new Date(),
        activeStaffCount: activeStaff.length,
        payrollHeadcount,
        discrepancy,
        ghostWorkerCandidates,
        missingFromPayroll: [],
        salaryGradeChanges,
        summary,
    };

    await createAuditEntry(
        'UPDATE',
        'Payroll',
        `reconciliation-${new Date().toISOString()}`,
        systemUserId,
        `Payroll reconciliation: ${summary}`,
        { after: { activeStaffCount: activeStaff.length, payrollHeadcount, discrepancy } }
    );

    return report;
}