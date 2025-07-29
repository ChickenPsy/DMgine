import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tier } = req.query;
  
  if (!tier || !["Free", "Lite", "Pro"].includes(tier as string)) {
    return res.status(400).json({ error: "Invalid tier. Must be Free, Lite, or Pro" });
  }
  
  // Import the function to test configuration
  const getModelConfig = (tier: "Free" | "Lite" | "Pro") => {
    const model = "gpt-4-1106-preview";
    
    switch (tier) {
      case "Pro":
        return { model, maxTokens: 500 };
      case "Lite":
        return { model, maxTokens: 300 };
      case "Free":
      default:
        return { model, maxTokens: 150 };
    }
  };
  
  const config = getModelConfig(tier as "Free" | "Lite" | "Pro");
  res.json({
    tier,
    model: config.model,
    maxTokens: config.maxTokens,
    description: `${tier} tier users get ${config.maxTokens} max tokens with ${config.model}`
  });
}