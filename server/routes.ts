import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateDmRequestSchema } from "@shared/schema";
import { generateDm } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate DM endpoint
  app.post("/api/generate-dm", async (req, res) => {
    try {
      const validatedData = generateDmRequestSchema.parse(req.body);
      const isPremium = req.body.isPremium || false;
      
      // Check if chaos mode is requested (mock premium feature)
      if (validatedData.tone === "chaos" && !isPremium) {
        return res.status(402).json({ 
          message: "Chaos Mode is a premium feature. Upgrade to unlock wildly creative DMs!",
          requiresPremium: true 
        });
      }

      const generatedMessage = await generateDm(validatedData);
      
      // Store the generation in memory (optional)
      // await storage.storeDmGeneration({
      //   target: validatedData.target,
      //   tone: validatedData.tone,
      //   generatedMessage,
      // });

      res.json({ 
        message: generatedMessage,
        success: true 
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
        message: error instanceof Error ? error.message : "Failed to generate DM. Please try again.",
        success: false 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
