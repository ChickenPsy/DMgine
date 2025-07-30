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
  tone: "professional" | "friendly" | "direct" | "empathetic" | "assertive" | "funny-weird" | "bold-cocky" | "flirty-playful" | "curious-intrigued" | "fanboy-mode" | "apologetic" | "chaotic-evil" | "whisper-mode";
  userTier?: UserTier;
}

export async function generateDm({ target, tone, userTier = "Free" }: GenerateDmParams): Promise<string> {
  // Use the new tone-specific prompt system for consistency
  const prompt = buildPersonalizedPrompt({
    recipientName: target,
    tone: tone,
    scenario: "cold outreach",
    platform: "LinkedIn"
  });

  const config = getModelConfig(userTier);

  // Map some legacy tone names to new system equivalents
  const temperatureMap: Record<string, number> = {
    "chaotic-evil": 0.9,
    "funny-weird": 0.9,
    "bold-cocky": 0.8,
    "flirty-playful": 0.8,
    "whisper-mode": 0.7,
    "curious-intrigued": 0.7,
    "fanboy-mode": 0.8,
    "assertive": 0.7,
    "direct": 0.6,
    "professional": 0.6,
    "empathetic": 0.7,
    "friendly": 0.7,
    "apologetic": 0.6
  };

  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: config.maxTokens,
      temperature: temperatureMap[tone] || 0.7,
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

// New streaming function for real-time generation experience
export async function generateDmStream({ target, tone, userTier = "Free" }: GenerateDmParams): Promise<AsyncIterable<string>> {
  // Use the new tone-specific prompt system for consistency
  const prompt = buildPersonalizedPrompt({
    recipientName: target,
    tone: tone,
    scenario: "cold outreach",
    platform: "LinkedIn"
  });

  const config = getModelConfig(userTier);

  // Map tone names to appropriate temperature values
  const temperatureMap: Record<string, number> = {
    "chaotic-evil": 0.9,
    "funny-weird": 0.9,
    "bold-cocky": 0.8,
    "flirty-playful": 0.8,
    "whisper-mode": 0.7,
    "curious-intrigued": 0.7,
    "fanboy-mode": 0.8,
    "assertive": 0.7,
    "direct": 0.6,
    "professional": 0.6,
    "empathetic": 0.7,
    "friendly": 0.7,
    "apologetic": 0.6
  };

  try {
    const stream = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: config.maxTokens,
      temperature: temperatureMap[tone] || 0.7,
      stream: true, // Enable streaming
    });

    // Return an async generator that yields chunks
    return (async function* () {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }
    })();
  } catch (error) {
    console.error("OpenAI streaming API error:", error);
    throw new Error("Failed to generate streaming DM using OpenAI");
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
  language?: string;
}

// Tone-specific prompt templates
const getTonePromptTemplate = (tone: string): string => {
  const templates: Record<string, string> = {
    "professional": "You are a corporate communication expert. Write concise, polished cold DMs for professionals. Prioritize clarity, brevity, and value. Sound trustworthy and smart, but avoid sounding robotic. Show you've done research. Mention shared context if available.",
    
    "friendly": "You are a warm, approachable communicator. Write friendly cold DMs that feel genuine and personable. Be conversational without being too casual. Focus on building rapport and finding common ground.",
    
    "direct": "You are a straight-talking, no-nonsense communicator. Write direct cold DMs that get to the point quickly. Be clear, concise, and confident. No small talk or fluff - just value and purpose.",
    
    "empathetic": "You are a thoughtful, understanding communicator. Write empathetic cold DMs that show you understand their challenges and pain points. Be supportive and solution-oriented while remaining professional.",
    
    "assertive": "You are a confident, decisive communicator. Write assertive cold DMs that demonstrate expertise and leadership. Be bold in your value proposition while remaining respectful and professional.",
    
    "funny-weird": "You are an eccentric, brilliant DM writer with an odd sense of humor. The goal is to grab attention and make them laugh or smile, while sneakily pitching or opening a convo. Think 'meme brain meets sales pitch.' Be playful, be unpredictable. Never be boring.",
    
    "bold-cocky": "You're a confident, high-performing badass. Your DMs ooze charisma and confidence. You don't ask — you state. You don't beg — you tease. Sound like you already know you're the best option on the table, and they're lucky you're messaging.",
    
    "flirty-playful": "You write DMs like someone with a crush and a pitch. Be cheeky, charming, and clever — like flirting without desperation. Create emotional engagement while still sliding your message in smoothly.",
    
    "curious-intrigued": "You are genuinely fascinated and curious about their work. Write DMs that show authentic interest and intrigue. Ask thoughtful questions and express genuine curiosity about their expertise or recent accomplishments.",
    
    "fanboy-mode": "You are a genuine admirer of their work. Write DMs that express authentic appreciation and enthusiasm for what they do. Be specific about what impresses you, but avoid being creepy or over-the-top.",
    
    "apologetic": "You are polite and slightly apologetic for reaching out. Write DMs that acknowledge you're interrupting their day but have something valuable to offer. Be humble but confident in your value proposition.",
    
    "chaotic-evil": "You are unfiltered, chaotic, and utterly unpredictable. Your job is to write cold DMs that break every norm — weird analogies, dark humor, whispered cult phrases, poetic nonsense — anything that makes it impossible to ignore. Every DM should feel like 'wtf did I just read… I need to respond.'",
    
    "whisper-mode": "You are mysterious and cryptic. Write DMs that hint at secrets or exclusive information. Be intriguing and slightly mysterious, like you know something they don't. Create curiosity through what you don't say rather than what you do."
  };
  
  return templates[tone] || templates["professional"];
};

export function buildPersonalizedPrompt(data: PersonalizationData): string {
  const {
    recipientName,
    recipientRole,
    companyName,
    reason,
    customHook,
    tone,
    scenario,
    platform,
    language = "English"
  } = data;

  // Get the tone-specific prompt template
  const toneTemplate = getTonePromptTemplate(tone);

  // Map scenario to scenario type
  const scenarioType = scenario || "cold outreach";

  // Build language instruction
  const languageInstruction = language === "English" ? "" : 
    `\n\nIMPORTANT: Write the entire message in ${language}. Use natural, native-level ${language} with appropriate cultural context and communication style for that language.`;

  // Build the personalized prompt with tone injection
  const prompt = `${toneTemplate}

Your task: Write 3 short, punchy DMs for ${platform || 'LinkedIn'} based on these inputs:
- Recipient: ${recipientName}${recipientRole ? `, ${recipientRole}` : ''}${companyName ? ` at ${companyName}` : ''}
- Scenario: ${scenarioType}
- Context/Hook: ${customHook || reason || 'General outreach'}

Requirements:
1. Stay true to your assigned tone and personality
2. Keep each DM under 280 characters (platform limits)
3. Make them sound natural and human, not AI-generated
4. Include specific details about the recipient when possible
5. Create curiosity or prompt a response
6. Avoid generic phrases like "Hope this finds you well"${languageInstruction}

Respond with ONLY the 3 message variations, no headings or explanations.`;

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
