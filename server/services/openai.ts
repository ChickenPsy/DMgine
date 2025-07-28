import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface GenerateDmParams {
  target: string;
  tone: "professional" | "casual" | "chaos";
}

export async function generateDm({ target, tone }: GenerateDmParams): Promise<string> {
  const prompts = {
    professional: `You are an expert at writing professional networking messages. Generate a compelling, professional cold DM for LinkedIn or professional platforms.

Target person: ${target}

Requirements:
- Be professional but personable
- Reference something specific about their background or recent activity (you can infer this)
- Keep it concise (2-3 sentences max)
- Include a clear call to action
- Sound authentic, not robotic
- No excessive punctuation or emojis

Generate only the message text, no quotes or additional formatting.`,

    casual: `You are an expert at writing friendly, casual networking messages for professional and business platforms. Generate a warm, approachable cold DM for B2B networking or partnership outreach.

Target person: ${target}

Requirements:
- Be friendly and approachable, not overly formal
- Use a conversational tone that builds rapport
- Reference their work, company, or recent achievements (you can infer this)
- Keep it engaging and personable
- 2-3 sentences max
- Sound genuine and interested in collaboration
- Include a clear but casual call to action

Generate only the message text, no quotes or additional formatting.`,

    chaos: `You are a creative genius at writing wildly entertaining, viral-worthy messages that are so good they get screenshot and shared. Generate an absolutely hilarious, chaotic cold DM that breaks all the rules but somehow works.

Target person: ${target}

Requirements:
- Be completely unexpected and creative
- Use humor, wordplay, or absurd scenarios
- Reference pop culture, memes, or current trends
- Make it so entertaining they HAVE to respond
- Break traditional messaging rules in a funny way
- 2-4 sentences max
- Can use emojis strategically for comedic effect
- Stay appropriate but be wildly creative

Generate only the message text, no quotes or additional formatting.`
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompts[tone],
        },
      ],
      max_tokens: 200,
      temperature: tone === "chaos" ? 0.9 : tone === "casual" ? 0.8 : 0.7,
    });

    const generatedMessage = response.choices[0].message.content?.trim();
    
    if (!generatedMessage) {
      throw new Error("No message generated");
    }

    return generatedMessage;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate DM. Please try again.");
  }
}
