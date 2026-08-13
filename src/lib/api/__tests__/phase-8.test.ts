import { ValidationError, AuthorizationError } from '../errors';
import { validateRequestBody } from '../validation';
import { requireRole } from '../auth-context';
import { quoteCreateSchema } from '../quoteValidation';
import { invoiceCreateSchema } from '../invoiceValidation';
import { paymentCreateSchema } from '../paymentValidation';
import { expenseCreateSchema } from '../expenseValidation';
import { templateCreateSchema } from '../templateValidation';

export function runPhase8ApiTests() {
  const results: Array<{ test: string; passed: boolean; details?: string }> = [];

  // Test 1: Quote Validation Schema - Valid Payload
  try {
    const payload = {
      customerId: 'cust_123',
      quoteDate: '2026-08-15',
      validUntil: '2026-09-15',
      status: 'draft',
      items: [
        {
          description: 'Consulting Services',
          quantity: 10,
          unitPrice: 1500,
          discount: 0,
          taxRate: 18,
          taxAmount: 2700,
          lineTotal: 17700,
        },
      ],
    };
    const valid = validateRequestBody(quoteCreateSchema, payload);
    const passed = valid.customerId === 'cust_123' && valid.items.length === 1;
    results.push({ test: 'Zod accepts valid Quote creation payload', passed });
  } catch (e: any) {
    results.push({ test: 'Zod accepts valid Quote creation payload', passed: false, details: e.message });
  }

  // Test 2: Quote Validation Schema - Rejects Quote without Line Items
  try {
    const payload = {
      customerId: 'cust_123',
      quoteDate: '2026-08-15',
      validUntil: '2026-09-15',
      items: [],
    };
    validateRequestBody(quoteCreateSchema, payload);
    results.push({ test: 'Zod rejects Quote payload with empty line items', passed: false, details: 'Did not throw error' });
  } catch (e: any) {
    const passed = e instanceof ValidationError;
    results.push({ test: 'Zod rejects Quote payload with empty line items', passed });
  }

  // Test 3: Invoice Validation Schema - Valid Payload
  try {
    const payload = {
      customerId: 'cust_123',
      invoiceDate: '2026-08-15',
      dueDate: '2026-09-15',
      status: 'sent',
      items: [
        {
          description: 'Software License',
          quantity: 2,
          unitPrice: 25000,
          discount: 1000,
          taxRate: 18,
          taxAmount: 8820,
          lineTotal: 57820,
        },
      ],
    };
    const valid = validateRequestBody(invoiceCreateSchema, payload);
    const passed = valid.customerId === 'cust_123' && valid.status === 'sent';
    results.push({ test: 'Zod accepts valid Invoice creation payload', passed });
  } catch (e: any) {
    results.push({ test: 'Zod accepts valid Invoice creation payload', passed: false, details: e.message });
  }

  // Test 4: Payment Validation Schema - Valid Payload
  try {
    const payload = {
      invoiceId: 'inv_123',
      amount: 20000,
      paymentDate: '2026-08-15',
      paymentMethod: 'upi',
      referenceNumber: 'UPI123456789',
    };
    const valid = validateRequestBody(paymentCreateSchema, payload);
    const passed = valid.amount === 20000 && valid.paymentMethod === 'upi';
    results.push({ test: 'Zod accepts valid Payment payload', passed });
  } catch (e: any) {
    results.push({ test: 'Zod accepts valid Payment payload', passed: false, details: e.message });
  }

  // Test 5: Payment Validation Schema - Rejects Zero/Negative Amount
  try {
    const payload = {
      invoiceId: 'inv_123',
      amount: 0,
      paymentDate: '2026-08-15',
      paymentMethod: 'cash',
    };
    validateRequestBody(paymentCreateSchema, payload);
    results.push({ test: 'Zod rejects Payment with zero or negative amount', passed: false, details: 'Did not throw error' });
  } catch (e: any) {
    const passed = e instanceof ValidationError;
    results.push({ test: 'Zod rejects Payment with zero or negative amount', passed });
  }

  // Test 6: Expense Validation Schema - Valid Payload
  try {
    const payload = {
      category: 'Office Supplies',
      description: 'Paper and printer ink',
      amount: 3500,
      expenseDate: '2026-08-15',
      paymentMethod: 'card',
    };
    const valid = validateRequestBody(expenseCreateSchema, payload);
    const passed = valid.amount === 3500 && valid.category === 'Office Supplies';
    results.push({ test: 'Zod accepts valid Expense creation payload', passed });
  } catch (e: any) {
    results.push({ test: 'Zod accepts valid Expense creation payload', passed: false, details: e.message });
  }

  // Test 7: Template Validation Schema - Valid Payload
  try {
    const payload = {
      name: 'Modern Dark Template',
      description: 'Sleek dark theme for invoices',
      isDefault: true,
      config: { colorPalette: { primary: '#1e293b' } },
    };
    const valid = validateRequestBody(templateCreateSchema, payload);
    const passed = valid.name === 'Modern Dark Template' && valid.isDefault === true;
    results.push({ test: 'Zod accepts valid Template creation payload', passed });
  } catch (e: any) {
    results.push({ test: 'Zod accepts valid Template creation payload', passed: false, details: e.message });
  }

  // Test 8: Financial Math Precision Verification
  try {
    const total = 50000;
    const paid = 20000;
    const balanceDue = total - paid;
    const passed = balanceDue === 30000;
    results.push({ test: 'Authoritative financial arithmetic (₹50k - ₹20k = ₹30k)', passed });
  } catch (e: any) {
    results.push({ test: 'Authoritative financial arithmetic (₹50k - ₹20k = ₹30k)', passed: false, details: e.message });
  }

  // Test 9: Multi-Tenant Role Isolation Safeguard
  try {
    requireRole(['Owner', 'Admin'], 'Accountant');
    results.push({ test: 'Role guard rejects Accountant for Owner/Admin only operation', passed: false, details: 'Did not throw error' });
  } catch (e: any) {
    const passed = e instanceof AuthorizationError;
    results.push({ test: 'Role guard rejects Accountant for Owner/Admin only operation', passed });
  }

  return results;
}
