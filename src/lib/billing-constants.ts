export const PRO_PRICING = {
  NGN: {
    monthly: { amountMajor: 4000, amountMinor: 400000, label: '₦4,000 / month' },
    annual: { amountMajor: 30000, amountMinor: 3000000, label: '₦30,000 / year (Save 37%)' },
  },
  USD: {
    monthly: { amountMajor: 9, amountMinor: 900, label: '$9 / month' },
    annual: { amountMajor: 69, amountMinor: 6900, label: '$69 / year (Save 36%)' },
  },
} as const;

export const FREE_PLAN_SERVICE_LIMIT = 4;
