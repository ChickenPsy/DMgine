import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { generateDmRequestSchema } from "@shared/schema";
import { generateDm, generateDmStream, buildPersonalizedPrompt, generatePersonalizedDM } from "./services/openai";
import { sanitizeErrorForClient } from "./security-check";

// Input validation schemas
const personalizedDmRequestSchema = z.object({
  recipientName: z.string().min(1).max(100).trim(),
  recipientRole: z.string().max(100).trim().optional(),
  companyName: z.string().max(100).trim().optional(),
  reason: z.string().max(500).trim().optional(),
  customHook: z.string().max(300).trim().optional(),
  tone: z.enum([
    "professional", 
    "friendly", 
    "direct", 
    "empathetic", 
    "assertive",
    "funny-weird",
    "bold-cocky", 
    "flirty-playful",
    "curious-intrigued",
    "fanboy-mode",
    "apologetic",
    "chaotic-evil",
    "whisper-mode"
  ]),
  scenario: z.string().max(200).trim().optional(),
  platform: z.string().max(50).trim().optional(),
  language: z.enum(["English", "Portuguese", "Spanish", "Japanese", "French", "German", "Italian", "Korean", "Chinese"]).default("English"),
  isPremium: z.boolean().default(false)
});

// Input sanitization helper
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Legacy generate endpoint for backward compatibility with optional streaming
  app.post("/generate", async (req, res) => {
    try {
      const validatedData = generateDmRequestSchema.parse(req.body);
      const isPremium = req.body.isPremium || false;
      const isStreamingRequested = req.headers.accept?.includes('text/stream') || req.query.stream === 'true';
      
      // Determine user tier - default to "Free" if no user object present
      const userTier = (req as any).user?.tier || "Free";
      
      // Check if premium tones are requested
      const premiumTones = ["chaotic-evil", "bold-cocky", "flirty-playful", "whisper-mode"];
      if (premiumTones.includes(validatedData.tone) && !isPremium) {
        return res.status(402).json({ 
          message: "Premium tones are exclusive features. Upgrade to unlock all advanced personality modes!",
          requiresPremium: true 
        });
      }

      if (isStreamingRequested) {
        // Set up streaming response for real-time generation
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        try {
          const stream = await generateDmStream({
            ...validatedData,
            userTier
          });

          for await (const chunk of stream) {
            res.write(chunk); // Stream each chunk to client in real-time
          }
          
          res.end(); // Close the stream
        } catch (streamError) {
          console.error("Streaming error:", streamError);
          res.write(`\n\nError: ${sanitizeErrorForClient(streamError)}`);
          res.end();
        }
      } else {
        // Standard non-streaming response
        const generatedMessage = await generateDm({ 
          ...validatedData, 
          userTier 
        });
        
        // Return in the exact format specified: { message: string }
        res.json({ 
          message: generatedMessage
        });
      }
    } catch (error) {
      console.error("DM generation error:", error);
      
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Invalid input data",
          errors: (error as any).errors 
        });
      }
      
      res.status(500).json({ 
        message: sanitizeErrorForClient(error)
      });
    }
  });

  // Smart personalization endpoint for generate DM
  app.post("/api/generate-dm", async (req, res) => {
    try {
      console.log("Smart personalization DM request received:", req.body);
      
      // Validate and sanitize input using Zod
      const validatedData = personalizedDmRequestSchema.parse(req.body);
      
      // Additional sanitization for text fields
      const sanitizedData = {
        ...validatedData,
        recipientName: sanitizeInput(validatedData.recipientName),
        recipientRole: validatedData.recipientRole ? sanitizeInput(validatedData.recipientRole) : undefined,
        companyName: validatedData.companyName ? sanitizeInput(validatedData.companyName) : undefined,
        reason: validatedData.reason ? sanitizeInput(validatedData.reason) : undefined,
        customHook: validatedData.customHook ? sanitizeInput(validatedData.customHook) : undefined,
        scenario: validatedData.scenario ? sanitizeInput(validatedData.scenario) : undefined,
        platform: validatedData.platform ? sanitizeInput(validatedData.platform) : undefined,
        language: validatedData.language, // Language is enum, no need to sanitize
      };

      // Check if premium tones are requested and user is not premium
      const premiumTones = ["chaotic-evil", "bold-cocky", "flirty-playful", "whisper-mode"];
      if (premiumTones.includes(sanitizedData.tone) && !sanitizedData.isPremium) {
        return res.status(402).json({
          message: "Premium tones are exclusive features. Upgrade to unlock all advanced personality modes!",
          requiresPremium: true,
          success: false
        });
      }

      // Determine user tier for model configuration
      const userTier: "Free" | "Lite" | "Pro" = sanitizedData.isPremium ? "Pro" : "Free";
      console.log(`Using ${userTier} tier config for smart personalization`);

      // Build dynamic prompt using sanitized data
      const prompt = buildPersonalizedPrompt({
        recipientName: sanitizedData.recipientName,
        recipientRole: sanitizedData.recipientRole,
        companyName: sanitizedData.companyName,
        reason: sanitizedData.reason,
        customHook: sanitizedData.customHook,
        tone: sanitizedData.tone,
        scenario: sanitizedData.scenario,
        platform: sanitizedData.platform,
        language: sanitizedData.language
      });

      const generatedMessage = await generatePersonalizedDM(prompt, userTier);
      
      res.json({ 
        message: generatedMessage,
        success: true 
      });
    } catch (error: any) {
      console.error("Error in /api/generate-dm endpoint:", error);
      
      // Handle Zod validation errors
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          error: "Invalid input data",
          message: "Please check your input and try again.",
          details: error.errors,
          success: false 
        });
      }
      
      res.status(500).json({ 
        error: "Failed to generate DM", 
        message: sanitizeErrorForClient(error),
        success: false 
      });
    }
  });

  // Stripe checkout session endpoint
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { priceId, successUrl, cancelUrl } = req.body;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe secret key not configured');
      }
      
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-06-20'
      });
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'DMgine Pro',
                description: 'Unlimited DM generation with all features',
              },
              unit_amount: 499, // $4.99 in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          tier: 'pro'
        }
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Stripe checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Test endpoint to verify tier configuration (for development/testing)
  app.get("/api/tier-config/:tier", (req, res) => {
    const tier = req.params.tier as "Free" | "Lite" | "Pro";
    
    if (!["Free", "Lite", "Pro"].includes(tier)) {
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
    
    const config = getModelConfig(tier);
    res.json({
      tier,
      model: config.model,
      maxTokens: config.maxTokens,
      description: `${tier} tier users get ${config.maxTokens} max tokens with ${config.model}`
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
