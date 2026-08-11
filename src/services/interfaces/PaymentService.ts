import { Payment, PaymentCreateInput } from '@/types/payment';
import { FilterParams, PaginatedResult } from '@/types/common';

export interface PaymentSummaryMetrics {
  totalReceived: number;
  thisMonth: number;
  today: number;
  pendingAllocation: number;
  partiallyPaidInvoicesCount: number;
}

export interface IPaymentService {
  getPayments(params?: FilterParams & { paymentMethod?: string; customerId?: string; status?: string }): Promise<PaginatedResult<Payment>>;
  getPaymentById(id: string): Promise<Payment | null>;
  getRecentPayments(limit?: number): Promise<Payment[]>;
  getPaymentSummary(): Promise<PaymentSummaryMetrics>;
  createPayment(data: PaymentCreateInput): Promise<Payment>;
  updatePayment(id: string, data: Partial<PaymentCreateInput>): Promise<Payment>;
  deletePayment(id: string): Promise<boolean>;
  allocatePayment(id: string, allocationData: { invoiceId: string; amount: number }): Promise<Payment>;
}
