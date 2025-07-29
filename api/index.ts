import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.json({ 
    message: 'DMgine API is running on Vercel',
    version: '1.0.0',
    endpoints: [
      '/api/generate-dm',
      '/api/generate', 
      '/api/create-checkout-session',
      '/api/tier-config/[tier]'
    ]
  });
}