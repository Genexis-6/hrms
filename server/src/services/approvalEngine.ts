import ApprovalChain from '../models/ApprovalChain.js';
import { createAuditEntry } from '../middleware/audit.js';

interface ApprovalChainConfig {
  steps: { role: string; title: string }[];
}

const APPROVAL_CONFIGS: Record<string, ApprovalChainConfig> = {
  LEAVE: {
    steps: [
      { role: 'hod', title: 'Head of Department' },
      { role: 'dean', title: 'Dean of Faculty' },
      { role: 'registrar', title: 'Registrar' },
    ],
  },
  PROMOTION: {
    steps: [
      { role: 'hod', title: 'Head of Department' },
      { role: 'dean', title: 'Dean of Faculty' },
      { role: 'registrar', title: 'Registrar' },
      { role: 'vc', title: 'Vice Chancellor' },
    ],
  },
  SALARY_ADJUSTMENT: {
    steps: [
      { role: 'registrar', title: 'Registrar' },
      { role: 'bursar', title: 'Bursar' },
    ],
  },
};

export async function createApprovalChain(
  requestType: 'LEAVE' | 'PROMOTION' | 'SALARY_ADJUSTMENT',
  requestId: string,
  requestModel: 'Leave' | 'Promotion',
  staffId: string,
  initiatedBy: string
) {
  const config = APPROVAL_CONFIGS[requestType];
  if (!config) throw new Error(`Unknown request type: ${requestType}`);

  const steps = config.steps.map((step, index) => ({
    step: index + 1,
    role: step.role,
    title: step.title,
    status: 'PENDING' as const,
  }));

  const chain = await ApprovalChain.create({
    requestType,
    requestId,
    requestModel,
    staffId,
    steps,
    currentStep: 1,
    overallStatus: 'IN_PROGRESS',
    initiatedBy,
  });

  return chain;
}

export async function approveStep(
  chainId: string,
  userId: string,
  userRole: string,
  comment?: string
) {
  const chain = await ApprovalChain.findById(chainId);
  if (!chain) throw new Error('Approval chain not found');
  if (chain.overallStatus !== 'IN_PROGRESS') throw new Error('Request is already resolved');

  const currentStep = chain.steps.find(s => s.step === chain.currentStep);
  if (!currentStep) throw new Error('Invalid step');
  if (currentStep.role !== userRole) throw new Error(`This step requires ${currentStep.role} approval`);

  currentStep.status = 'APPROVED';
  currentStep.approvedBy = userId as any;
  currentStep.approvedAt = new Date();
  currentStep.comment = comment || 'Approved';

  const nextStep = chain.steps.find(s => s.step === chain.currentStep + 1);
  if (nextStep) {
    chain.currentStep = chain.currentStep + 1;
  } else {
    chain.overallStatus = 'APPROVED';
    chain.completedAt = new Date();
  }

  await chain.save();

  await createAuditEntry(
    'APPROVE',
    'Leave',
    chain.requestId.toString(),
    userId,
    `Approved step ${currentStep.step} (${currentStep.title}) for ${chain.requestType}`,
    { after: { status: currentStep.status, comment } }
  );

  return chain;
}

export async function rejectStep(
  chainId: string,
  userId: string,
  userRole: string,
  comment: string
) {
  const chain = await ApprovalChain.findById(chainId);
  if (!chain) throw new Error('Approval chain not found');
  if (chain.overallStatus !== 'IN_PROGRESS') throw new Error('Request is already resolved');

  const currentStep = chain.steps.find(s => s.step === chain.currentStep);
  if (!currentStep) throw new Error('Invalid step');
  if (currentStep.role !== userRole) throw new Error(`This step requires ${currentStep.role} approval`);

  currentStep.status = 'REJECTED';
  currentStep.approvedBy = userId as any;
  currentStep.approvedAt = new Date();
  currentStep.comment = comment;

  chain.overallStatus = 'REJECTED';
  chain.completedAt = new Date();

  await chain.save();

  await createAuditEntry(
    'REJECT',
    'Leave',
    chain.requestId.toString(),
    userId,
    `Rejected at step ${currentStep.step} (${currentStep.title}): ${comment}`,
    { after: { status: 'REJECTED', comment } }
  );

  return chain;
}

export async function getPendingApprovals(userRole: string) {
  // Find chains where there's a pending step matching the user's role
  // AND that step number equals the chain's currentStep
  const chains = await ApprovalChain.find({
    overallStatus: 'IN_PROGRESS',
  })
    .populate('staffId', 'firstName lastName department faculty')
    .populate('initiatedBy', 'name email')
    .sort('-initiatedAt')
    .lean();

  // Filter in JS: chains where the current step's role matches userRole and is PENDING
  return chains.filter(chain => {
    const currentStep = chain.steps?.find(s => s.step === chain.currentStep);
    return currentStep && currentStep.role === userRole && currentStep.status === 'PENDING';
  });
}