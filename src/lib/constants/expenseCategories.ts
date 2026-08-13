export const DEFAULT_EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Software & Subscriptions',
  'Rent & Utilities',
  'Travel & Entertainment',
  'Salaries & Payroll',
  'Marketing & Advertising',
  'Professional Services',
  'Maintenance & Repairs',
  'Miscellaneous',
] as const;

export type ExpenseCategory = typeof DEFAULT_EXPENSE_CATEGORIES[number] | string;
