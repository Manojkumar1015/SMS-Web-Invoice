import { IPaymentService } from '../interfaces/PaymentService';
import { Payment, PaymentCreateInput } from '@/types/payment';
import { FilterParams, PaginatedResult } from '@/types/common';
import { mockPayments } from '@/data/mockPayments';

export class MockPaymentService implements IPaymentService {
  private payments: Payment[] = [...mockPayments];

  async getPayments(params?: FilterParams): Promise<PaginatedResult<Payment>> {
    let result = [...this.payments];

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.paymentNumber.toLowerCase().includes(q) ||
          p.invoiceNumber.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q)
      );
    }

    if (params?.customerId) {
      result = result.filter((p) => p.customerId === params.customerId);
    }

    return {
      data: result,
      total: result.length,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    };
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    return this.payments.find((p) => p.id === id) || null;
  }

  async createPayment(data: PaymentCreateInput): Promise<Payment> {
    const newPayment: Payment = {
      ...data,
      id: `pay-${Date.now()}`,
      paymentNumber: `PAY-2026-00${Math.floor(10 + Math.random() * 90)}`,
      createdAt: new Date().toISOString(),
    };
    this.payments.unshift(newPayment);
    return newPayment;
  }

  async getRecentPayments(limit = 5): Promise<Payment[]> {
    return [...this.payments].slice(0, limit);
  }

  async getPaymentsByCustomer(customerId: string): Promise<Payment[]> {
    return this.payments.filter((p) => p.customerId === customerId);
  }
}
