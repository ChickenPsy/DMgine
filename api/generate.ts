import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateDm } from './services/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { target, tone } = req.body;
    const isPremium = req.body.isPremium || false;
    
    if (!target || !tone) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["target", "tone"]
      });
    }
    
    if (!["professional", "casual", "chaos"].includes(tone)) {
      return res.status(400).json({
        error: "Invalid tone. Must be professional, casual, or chaos"
      });
    }
    
    // Determine user tier - default to "Free" if no user object present
    const userTier = "Free";
    
    // Check if off the rails mode is requested (mock premium feature)
    if (tone === "chaos" && !isPremium) {
      return res.status(402).json({ 
        message: "Off the Rails Mode is a premium feature. Upgrade to unlock wildly creative DMs!",
        requiresPremium: true 
      });
    }

    const generatedMessage = await generateDm({ 
      target, 
      tone, 
      userTier 
    });
    
    // Return in the exact format specified: { message: string }
    res.json({ 
      message: generatedMessage
    });
  } catch (error) {
    console.error("DM generation error:", error);
    
    // Handle validation errors gracefully
    
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate DM. Please try again."
    });
  }
}