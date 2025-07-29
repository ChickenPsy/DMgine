import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generatePersonalizedDM, buildPersonalizedPrompt } from './services/openai.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    if (tone === "chaos" && !isPremium) {
      return res.status(402).json({
        message: "Off the Rails Mode is a premium feature. Upgrade to unlock wildly creative DMs!",
        requiresPremium: true,
        success: false
      });
    }

    const userTier: "Free" | "Lite" | "Pro" = isPremium ? "Pro" : "Free";

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
    res.status(500).json({
      error: "Failed to generate DM",
      message: error.message,
      success: false
    });
  }
}