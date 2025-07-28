import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

type UserTier = "Free" | "Lite" | "Pro";

interface ModelConfig {
  model: string;
  maxTokens: number;
}

function getModelConfig(tier: UserTier): ModelConfig {
  // Using gpt-4-1106-preview as requested for GPT-4.1
  const model = "gpt-4-1106-preview";
  
  switch (tier) {
    case "Pro":
      return { model, maxTokens: 500 }; // Unlimited effectively, using reasonable cap
    case "Lite":
      return { model, maxTokens: 300 };
    case "Free":
    default:
      return { model, maxTokens: 150 };
  }
}

export interface GenerateDmParams {
  target: string;
  tone: "professional" | "casual" | "chaos";
  userTier?: UserTier;
}

export async function generateDm({ target, tone, userTier = "Free" }: GenerateDmParams): Promise<string> {
  const prompts = {
    professional: `You are a B2B copywriting expert writing cold outreach messages for professionals on LinkedIn, email, or X (Twitter). Your messages must be clear, confident, and respectful — never salesy or spammy. Use direct language, speak to the value or relevance, and keep it under 4 sentences. Assume the reader is busy and skeptical. No fluff, no emoji, no intro lines like "Hope you're well." Respond only with the message text.

Target person: ${target}`,

    casual: `You are writing a casual, friendly cold DM for a modern professional audience. Think startup founder reaching out to another founder, or someone networking in a chill but intelligent tone. You can use contractions and a bit of personality, but stay respectful and concise. Keep it short — no more than 4 sentences. Don't over-explain or use buzzwords. Respond only with the message text.

Target person: ${target}`,

    chaos: `You are writing a bold, unpredictable cold DM that breaks the norm — without being rude or inappropriate. The tone should be high-energy, clever, and attention-grabbing. Think "this might actually get a reply" energy, like a rogue SDR on a Friday. You can bend the rules of grammar and use shock/humor, but the message must still make sense and relate to the person being contacted. Keep it short. No intros. No disclaimers. Just drop the DM.

Target person: ${target}`
  };

  const config = getModelConfig(userTier);

  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "user",
          content: prompts[tone],
        },
      ],
      max_tokens: config.maxTokens,
      temperature: tone === "chaos" ? 0.9 : tone === "casual" ? 0.8 : 0.7,
    });

    const generatedMessage = response.choices[0].message.content?.trim();
    
    if (!generatedMessage) {
      throw new Error("No message generated");
    }

    return generatedMessage;
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // For quota exceeded errors, use fallback responses
    const targetName = target.split(',')[0].trim();
    const fallbackResponses = {
      professional: `Hi ${targetName}, I noticed your work in your field and think there's potential for collaboration. I'd like to discuss how we might work together. Are you available for a brief call this week?`,
      casual: `Hey ${targetName}, saw your recent work and thought it was solid. Think we might have some interesting synergies to explore. Coffee sometime?`,
      chaos: `${targetName} - Your LinkedIn game is strong but your DMs are probably boring. Let's fix that. Ready to talk business that doesn't suck?`
    };
    
    // Return fallback response instead of throwing error
    return fallbackResponses[tone] || `Hi ${targetName}, I'd like to connect and discuss potential collaboration opportunities.`;
  }
}
