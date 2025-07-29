import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateDmRequestSchema } from '@shared/schema';
import { generateDm } from './services/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedData = generateDmRequestSchema.parse(req.body);
    const isPremium = req.body.isPremium || false;
    
    // Determine user tier - default to "Free" if no user object present
    const userTier = "Free";
    
    // Check if off the rails mode is requested (mock premium feature)
    if (validatedData.tone === "chaos" && !isPremium) {
      return res.status(402).json({ 
        message: "Off the Rails Mode is a premium feature. Upgrade to unlock wildly creative DMs!",
        requiresPremium: true 
      });
    }

    const generatedMessage = await generateDm({ 
      ...validatedData, 
      userTier 
    });
    
    // Return in the exact format specified: { message: string }
    res.json({ 
      message: generatedMessage
    });
  } catch (error) {
    console.error("DM generation error:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({ 
        message: "Invalid input data",
        errors: (error as any).errors 
      });
    }
    
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to generate DM. Please try again."
    });
  }
}