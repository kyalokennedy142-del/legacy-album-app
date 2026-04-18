// src/lib/paypal.ts
// ✅ FIX: Replaced 'axios' with native 'fetch' to remove dependency error.

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
}

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured in environment variables.');
  }

  // Encode credentials for Basic Auth
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(
    `${process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: 'grant_type=client_credentials',
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('PayPal Token Error:', errorData);
    throw new Error('Failed to fetch PayPal Access Token');
  }

  const data: PayPalTokenResponse = await response.json();
  return data.access_token;
}