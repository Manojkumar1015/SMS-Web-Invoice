import { IPaymentService, PaymentSummaryMetrics } from '../interfaces/PaymentService';
import { Payment, PaymentCreateInput } from '@/types/payment';
import { FilterParams, PaginatedResult } from '@/types/common';

export class SupabasePaymentService implements IPaymentService {
  async getPayments(params?: FilterParams & { paymentMethod?: string; customerId?: string; status?: string }): Promise<PaginatedResult<Payment>> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.customerId) query.set('customerId', params.customerId);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));

    const res = await fetch(`/api/v1/payments?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch payments: ${res.statusText}`);
    }
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to fetch payments');
    }

    return {
      data: json.data || [],
      total: json.meta?.total ?? json.data.length,
      page: json.meta?.page ?? 1,
      pageSize: json.meta?.pageSize ?? 25,
      totalPages: json.meta?.totalPages ?? 1,
    };
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    const res = await fetch(`/api/v1/payments/${id}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to fetch payment: ${res.statusText}`);
    }
    const json = await res.json();
    return json.success ? json.data : null;
  }

  async getRecentPayments(limit?: number): Promise<Payment[]> {
    const res = await this.getPayments({ pageSize: limit || 5 });
    return res.data;
  }

  async getPaymentSummary(): Promise<PaymentSummaryMetrics> {
    const res = await this.getPayments({ pageSize: 100 });
    const payments = res.data;
    const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalReceived,
      thisMonth: totalReceived,
      today: 0,
      pendingAllocation: 0,
      partiallyPaidInvoicesCount: 0,
    };
  }

  async createPayment(data: PaymentCreateInput): Promise<Payment> {
    const res = await fetch('/api/v1/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || 'Failed to create payment');
    }
    const json = await res.json();
    return json.data;
  }

  async updatePayment(id: string, data: Partial<PaymentCreateInput>): Promise<Payment> {
    throw new Error('Direct update of payment is not allowed; create or delete payments instead.');
  }

  async deletePayment(id: string): Promise<boolean> {
    const res = await fetch(`/api/v1/payments/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to delete payment');
    }
    const json = await res.json();
    return !!json.success;
  }

  async allocatePayment(id: string, allocationData: { invoiceId: string; amount: number }): Promise<Payment> {
    const payment = await this.getPaymentById(id);
    if (!payment) throw new Error('Payment not found');
    return payment;
  }
}
