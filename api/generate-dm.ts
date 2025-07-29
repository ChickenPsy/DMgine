import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generatePersonalizedDM, buildPersonalizedPrompt } from './services/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("Smart personalization DM request received:", req.body);
    
    const { 
      recipientName, 
      recipientRole, 
      companyName, 
      reason, 
      customHook, 
      tone, 
      scenario, 
      platform,
      isPremium = false 
    } = req.body;
    
    if (!recipientName || !tone) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        required: ["recipientName", "tone"],
        success: false
      });
    }

    // Check if off the rails mode is requested and user is not premium
    if (tone === "chaos" && !isPremium) {
      return res.status(402).json({
        message: "Off the Rails Mode is a premium feature. Upgrade to unlock wildly creative DMs!",
        requiresPremium: true,
        success: false
      });
    }

    // Determine user tier for model configuration
    const userTier: "Free" | "Lite" | "Pro" = isPremium ? "Pro" : "Free";
    console.log(`Using ${userTier} tier config for smart personalization`);

    // Build dynamic prompt
    const prompt = buildPersonalizedPrompt({
      recipientName,
      recipientRole,
      companyName,
      reason,
      customHook,
      tone,
      scenario,
      platform
    });

    const generatedMessage = await generatePersonalizedDM(prompt, userTier);
    
    res.json({ 
      message: generatedMessage,
      success: true 
    });
  } catch (error: any) {
    console.error("Error in /api/generate-dm endpoint:", error);
    res.status(500).json({ 
      error: "Failed to generate DM", 
      message: error.message,
      success: false 
    });
  }
}