// GradelyAI — Paystack Payment Integration

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

export function initiatePayment({ email, name, onSuccess, onClose }) {
  if (!window.PaystackPop) {
    alert('Payment system is loading. Please wait a moment and try again.')
    onClose && onClose()
    return
  }

  try {
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: 500000,
      currency: 'NGN',
      ref: `gradely_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      metadata: {
        custom_fields: [
          { display_name: 'Customer Name', variable_name: 'customer_name', value: name },
          { display_name: 'Product', variable_name: 'product', value: 'GradelyAI Pro' }
        ]
      },
      callback: function(response) {
        if (response.status === 'success') {
          sessionStorage.setItem('gradelyPaid', JSON.stringify({
            paid: true,
            reference: response.reference,
            timestamp: Date.now()
          }))
          onSuccess(response)
        }
      },
      onClose: function() {
        onClose && onClose()
      }
    })

    handler.openIframe()
  } catch (err) {
    console.error('Paystack error:', err)
    alert('Payment failed to open. Please refresh and try again.')
    onClose && onClose()
  }
}

export function isPaid() {
  const saved = sessionStorage.getItem('gradelyPaid')
  if (!saved) return false
  const data = JSON.parse(saved)
  return data.paid === true
}

export function markAsPaid(reference) {
  sessionStorage.setItem('gradelyPaid', JSON.stringify({
    paid: true,
    reference,
    timestamp: Date.now()
  }))
}

export function clearPayment() {
  sessionStorage.removeItem('gradelyPaid')
}