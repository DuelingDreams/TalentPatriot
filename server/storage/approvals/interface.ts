import type { ApprovalRequest, InsertApprovalRequest } from "@shared/schema";

export interface IApprovalRepository {
  getApprovalRequest(id: string): Promise<ApprovalRequest | undefined>;
  getApprovalRequestsByOrg(orgId: string, status?: string): Promise<ApprovalRequest[]>;
  getPendingApprovalCount(orgId: string): Promise<number>;
  createApprovalRequest(data: InsertApprovalRequest): Promise<ApprovalRequest>;
  updateApprovalRequest(id: string, data: Partial<InsertApprovalRequest>): Promise<ApprovalRequest>;
  resolveApprovalRequest(id: string, resolvedBy: string, status: 'approved' | 'rejected', notes?: string): Promise<ApprovalRequest>;
}
