const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

export function initializePaystackPayment({ email, amount, onSuccess, onClose }) {
  // Load Paystack script dynamically if not already loaded
  if (window.PaystackPop) {
    openPaystack({ email, amount, onSuccess, onClose })
    return
  }

  const script = document.createElement('script')
  script.src = 'https://js.paystack.co/v1/inline.js'
  script.async = true
  script.onload = () => openPaystack({ email, amount, onSuccess, onClose })
  script.onerror = () => {
    console.error('Failed to load Paystack script')
    if (onClose) onClose()
  }
  document.head.appendChild(script)
}

function openPaystack({ email, amount, onSuccess, onClose }) {
  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: amount * 100, // Paystack uses kobo — ₦10,000 = 1,000,000 kobo
    currency: 'NGN',
    callback: (response) => {
      if (onSuccess) onSuccess(response.reference)
    },
    onClose: () => {
      if (onClose) onClose()
    }
  })
  handler.openIframe()
}

// Legacy export — kept so nothing else breaks if imported elsewhere
export const isPaid = (user) => {
  return user?.subscription_status === 'active'
}