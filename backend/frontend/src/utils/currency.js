// Currency formatting utilities
export function formatCurrency(amount, currency = 'NGN') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₦0';
  }
  
  // Format as Nigerian Naira
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-NG').format(amount);
}
