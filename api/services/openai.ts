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

  // Map tone to appropriate style instruction
  const toneInstructions = {
    professional: "Write in a professional, respectful tone. Be direct and business-focused.",
    friendly: "Write in a warm, approachable tone while maintaining professionalism.",
    direct: "Write in a clear, straightforward tone. Get to the point quickly.",
    empathetic: "Write with understanding and emotional intelligence. Show genuine interest.",
    assertive: "Write with confidence and authority. Be persuasive but respectful.",
    chaos: "Write with bold creativity and humor. Break conventional rules while staying relevant. This is Off the Rails Mode - go completely wild with creativity while staying professional enough to work."
  };

  // Map platform to appropriate format
  const platformInstructions = {
    linkedin: "Format this as a LinkedIn message. Keep it professional and concise.",
    email: "Format this as a professional email. Include a clear subject line approach.",
    twitter: "Format this as a Twitter DM. Keep it very brief and engaging.", 
    instagram: "Format this as an Instagram DM. Keep it casual and visual-friendly."
  };

  // Map scenario to context
  const scenarioContext = {
    'b2b-sales': 'B2B sales introduction',
    'partnership': 'partnership inquiry', 
    'recruiting': 'recruiting pitch',
    'startup-collab': 'startup collaboration',
    'cold-intro': 'cold introduction'
  };

  // Build comprehensive prompt
  let prompt = `You are an expert at writing high-converting cold outreach messages. `;
  
  // Add tone instruction
  if (tone && toneInstructions[tone as keyof typeof toneInstructions]) {
    prompt += `${toneInstructions[tone as keyof typeof toneInstructions]} `;
  }

  // Add platform instruction  
  if (platform && platformInstructions[platform as keyof typeof platformInstructions]) {
    prompt += `${platformInstructions[platform as keyof typeof platformInstructions]} `;
  }

  prompt += `\n\nWrite a cold ${platform || 'message'} with the following details:\n`;
  prompt += `- Recipient: ${recipientName}`;
  
  if (recipientRole) {
    prompt += `, ${recipientRole}`;
  }
  
  if (companyName) {
    prompt += ` at ${companyName}`;
  }

  if (reason) {
    const reasonText = {
      job: 'job opportunity',
      partnership: 'partnership opportunity', 
      sales: 'sales pitch',
      intro: 'introduction',
      other: 'outreach'
    };
    prompt += `\n- Purpose: ${reasonText[reason as keyof typeof reasonText] || reason}`;
  }

  if (scenario) {
    prompt += `\n- Context: ${scenarioContext[scenario as keyof typeof scenarioContext] || scenario}`;
  }

  if (customHook) {
    prompt += `\n- Hook/Reference: ${customHook}`;
  }

  prompt += `\n\nRequirements:
- Keep it concise (2-4 sentences max)
- Make it personal and relevant
- Include a clear call-to-action
- No generic templates or clichés
- Don't use "Hope this finds you well" or similar
- Return only the message text, no subject line or formatting

Generate the message:`;

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
