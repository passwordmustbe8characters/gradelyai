// lib/payment.js

/**
 * Initializes the Monnify payment SDK.
 * @param {Object} user - The user object from your AuthContext.
 * @param {number} amount - The amount to charge in NGN.
 * @param {string} planName - Description of the plan (e.g., 'Standard Plan').
 */
export const initMonnifyPayment = (user, amount, planName) => {
  return new Promise((resolve, reject) => {
    // 1. Ensure the SDK is loaded (it must be in index.html)
    if (!window.MonnifySDK) {
      alert('Payment system is loading. Please try again in a moment.');
      return reject('Monnify SDK not loaded');
    }

    // 2. Initialize the payment
    window.MonnifySDK.initialize({
      amount: amount,
      currency: "NGN",
      reference: "gradely_" + Math.floor(Math.random() * 1000000000),
      customerName: user.name,
      customerEmail: user.email,
      apiKey: import.meta.env.VITE_MONNIFY_API_KEY,
      contractCode: import.meta.env.VITE_MONNIFY_CONTRACT_CODE,
      paymentDescription: `GradelyAI ${planName}`,
      // This is crucial: we pass the user ID so your backend knows who paid!
      metaData: {
        userId: user.id
      },
      onComplete: (response) => {
        // response.status will be 'SUCCESSFUL' if the transaction went through
        if (response.status === 'SUCCESSFUL') {
          resolve(response);
        } else {
          reject(response);
        }
      },
      onClose: () => {
        reject("Payment closed by user");
      }
    });
  });
};

// 2. Add the exports your Results.jsx and Paywall.jsx are looking for
export const initiatePayment = (user, amount, planName) => {
    return initMonnifyPayment(user, amount, planName);
};

export const isPaid = (user) => {
    // Basic logic: return true if status is 'active'
    // Ensure 'user' object has this property
    return user?.subscription_status === 'active';
};