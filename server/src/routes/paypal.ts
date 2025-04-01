import express from 'express';
const paypal = require('@paypal/checkout-server-sdk');
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// PayPal client configuration
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error('PayPal credentials are not configured');
}

const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(clientId, clientSecret)
  : new paypal.core.SandboxEnvironment(clientId, clientSecret);

const client = new paypal.core.PayPalHttpClient(environment);

router.post('/create-order', async (req, res) => {
  try {
    const { purchase_units } = req.body;

    const request = {
      intent: 'CAPTURE',
      purchase_units,
    };

    const order = await client.execute({
      path: '/v2/checkout/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: request,
    });

    res.json({
      id: order.result.id,
      status: order.result.status,
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({
      message: 'Failed to create PayPal order',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router; 