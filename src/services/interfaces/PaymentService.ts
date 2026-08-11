import { Payment, PaymentCreateInput } from '@/types/payment';
import { FilterParams, PaginatedResult } from '@/types/common';

export interface IPaymentService {
  getPayments(params?: FilterParams): Promise<PaginatedResult<Payment>>;
  getPaymentById(id: string): Promise<Payment | null>;
  createPayment(data: PaymentCreateInput): Promise<Payment>;
  getRecentPayments(limit?: number): Promise<Payment[]>;
  getPaymentsByCustomer(customerId: string): Promise<Payment[]>;
}
