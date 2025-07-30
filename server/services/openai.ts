import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
// SECURITY: Ensure OpenAI API key is available and never exposed to client
if (!process.env.OPENAI_API_KEY) {
  console.error("SECURITY WARNING: OPENAI_API_KEY environment variable is missing!");
  throw new Error("OpenAI API key is required for server operation");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
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
    throw new Error("Failed to generate DM using OpenAI");
  }
}

// Smart personalization interfaces and functions
export interface PersonalizationData {
  recipientName: string;
  recipientRole?: string;
  companyName?: string;
  reason?: string;
  customHook?: string;
  tone: string;
  scenario?: string;
  platform?: string;
}

export function buildPersonalizedPrompt(data: PersonalizationData): string {
  const {
    recipientName,
    recipientRole,
    companyName,
    reason,
    customHook,
    tone,
    scenario,
    platform
  } = data;

  // Map tone to message tone values
  const messageTone = tone === "chaos" ? "Off the Rails" : 
                     tone === "professional" ? "Professional" :
                     tone === "casual" ? "Casual" : tone;

  // Map scenario to scenario type
  const scenarioType = scenario || "cold outreach";

  // Use the improved prompt structure
  const prompt = `You're a world-class cold outreach copywriter. 

Your job is to craft short, punchy DMs for ${platform || 'LinkedIn'}, based on these inputs:
- Recipient: ${recipientName}${recipientRole ? `, ${recipientRole}` : ''}${companyName ? ` at ${companyName}` : ''}
- Scenario: ${scenarioType}
- Tone: ${messageTone}
- Hook: ${customHook || 'N/A'}

Write 3 variations that:
1. Sound natural, confident, and human (no robotic or AI-sounding text)
2. Include a unique insight or hook related to the scenario
3. Stay within the platform's message limits (e.g. Twitter/LinkedIn DMs = ~280 characters)
4. Avoid fluff like "Hope this finds you well"
5. Spark curiosity, tease value, or prompt a response — don't explain everything
6. Respect the tone. If tone is "Off the Rails", get weird, bold, or chaotic. If it's "Professional", stay crisp but not boring.

Respond with ONLY the message variations, no headings or explanations.`;

  return prompt;
}

export async function generatePersonalizedDM(prompt: string, userTier: UserTier): Promise<string> {
  // Use GPT-3.5 for now as requested, GPT-4 for Pro later
  const model = userTier === "Pro" ? "gpt-4-1106-preview" : "gpt-3.5-turbo";
  const maxTokens = userTier === "Pro" ? 500 : userTier === "Lite" ? 300 : 150;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.8,
    });

    const generatedMessage = response.choices[0].message.content?.trim();
    
    if (!generatedMessage) {
      throw new Error("No message generated");
    }

    return generatedMessage;
  } catch (error) {
    console.error("OpenAI API error for personalized DM:", error);
    throw new Error("Failed to generate personalized DM using OpenAI");
  }
}
