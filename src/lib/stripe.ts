import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24-preview' as never, // Use never to bypass strict version check if needed, or update to a supported one
  appInfo: {
    name: 'OUTSIDE App',
    version: '0.1.0',
  },
});
