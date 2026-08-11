import { IPaymentService, PaymentSummaryMetrics } from '../interfaces/PaymentService';
import { Payment, PaymentCreateInput } from '@/types/payment';
import { FilterParams, PaginatedResult } from '@/types/common';
import { mockPayments } from '@/data/mockPayments';
import { invoiceService } from '@/services';

export class MockPaymentService implements IPaymentService {
  private payments: Payment[] = [...mockPayments];

  async getPayments(
    params?: FilterParams & { paymentMethod?: string; customerId?: string; status?: string }
  ): Promise<PaginatedResult<Payment>> {
    let result = [...this.payments];

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.paymentNumber.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.invoiceNumber.toLowerCase().includes(q) ||
          (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q))
      );
    }

    if (params?.customerId && params.customerId !== 'all') {
      result = result.filter((p) => p.customerId === params.customerId);
    }

    if (params?.paymentMethod && params.paymentMethod !== 'all') {
      result = result.filter((p) => p.paymentMethod === params.paymentMethod);
    }

    if (params?.status && params.status !== 'all') {
      result = result.filter((p) => p.status === params.status);
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

  async getRecentPayments(limit = 5): Promise<Payment[]> {
    return this.payments.slice(0, limit);
  }

  async getPaymentSummary(): Promise<PaymentSummaryMetrics> {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const today = now.toISOString().slice(0, 10);

    const totalReceived = this.payments.reduce((acc, p) => (p.status !== 'cancelled' ? acc + p.amount : acc), 0);
    const thisMonth = this.payments.reduce(
      (acc, p) => (p.status !== 'cancelled' && p.date.startsWith(currentMonth) ? acc + p.amount : acc),
      0
    );
    const todayAmount = this.payments.reduce(
      (acc, p) => (p.status !== 'cancelled' && p.date.startsWith(today) ? acc + p.amount : acc),
      0
    );
    const pendingAllocation = this.payments.reduce((acc, p) => (p.status !== 'cancelled' ? acc + p.unallocatedAmount : acc), 0);

    return {
      totalReceived,
      thisMonth,
      today: todayAmount,
      pendingAllocation,
      partiallyPaidInvoicesCount: 1,
    };
  }

  async createPayment(data: PaymentCreateInput): Promise<Payment> {
    const newId = `pmt-${Date.now()}`;
    const pmtNum = `PMT-2026-${String(this.payments.length + 1).padStart(3, '0')}`;

    const newPayment: Payment = {
      ...data,
      id: newId,
      paymentNumber: pmtNum,
      status: 'received',
      allocatedAmount: data.amount,
      unallocatedAmount: 0,
      allocations: [
        {
          id: `alloc-${Date.now()}`,
          paymentId: newId,
          invoiceId: data.invoiceId,
          invoiceNumber: data.invoiceNumber,
          amount: data.amount,
          date: data.date,
        },
      ],
      activities: [
        {
          id: `act-${Date.now()}`,
          type: 'created',
          title: 'Payment Recorded',
          timestamp: new Date().toISOString(),
          user: 'Current Admin User',
          details: `Recorded ${data.paymentMethod} payment of ₹${data.amount.toLocaleString('en-IN')}`,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    this.payments.unshift(newPayment);

    // Update invoice status if matching invoice exists
    try {
      const inv = await invoiceService.getInvoiceById(data.invoiceId);
      if (inv) {
        const newPaid = inv.amountPaid + data.amount;
        const newDue = Math.max(0, inv.total - newPaid);
        const newStatus = newDue === 0 ? 'paid' : 'partially_paid';
        await invoiceService.updateInvoice(inv.id, { status: newStatus as any });
      }
    } catch {
      // Mock fallback
    }

    return newPayment;
  }

  async updatePayment(id: string, data: Partial<PaymentCreateInput>): Promise<Payment> {
    const idx = this.payments.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Payment record not found');

    const updated = {
      ...this.payments[idx],
      ...data,
    };
    this.payments[idx] = updated;
    return updated;
  }

  async deletePayment(id: string): Promise<boolean> {
    const initialLen = this.payments.length;
    this.payments = this.payments.filter((p) => p.id !== id);
    return this.payments.length < initialLen;
  }

  async allocatePayment(id: string, allocationData: { invoiceId: string; amount: number }): Promise<Payment> {
    const target = await this.getPaymentById(id);
    if (!target) throw new Error('Payment not found');

    const newAlloc = {
      id: `alloc-${Date.now()}`,
      paymentId: id,
      invoiceId: allocationData.invoiceId,
      invoiceNumber: `INV-${allocationData.invoiceId}`,
      amount: allocationData.amount,
      date: new Date().toISOString().split('T')[0],
    };

    target.allocations.push(newAlloc);
    target.allocatedAmount += allocationData.amount;
    target.unallocatedAmount = Math.max(0, target.amount - target.allocatedAmount);
    target.status = target.unallocatedAmount === 0 ? 'received' : 'partially_allocated';

    return target;
  }
}
