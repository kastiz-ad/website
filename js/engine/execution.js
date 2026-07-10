import { requireApproval } from "./approval.js";

export async function executeAction({ action, approval, perform }) {
  requireApproval(action, approval);
  if (typeof perform !== "function") throw new TypeError("perform must be a function");
  return perform();
}

export function createExecutionPlan(steps = []) {
  return steps.map((step, index) => ({
    id: step.id || `step-${index + 1}`,
    ...step,
    status: "pending"
  }));
}


