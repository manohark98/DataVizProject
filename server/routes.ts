import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSurveyDataSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all survey data
  app.get("/api/survey-data", async (req: Request, res: Response) => {
    try {
      const data = await storage.getAllSurveyData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching survey data:", error);
      res.status(500).json({ message: "Failed to fetch survey data" });
    }
  });

  // Upload survey data (single record)
  app.post("/api/survey-data", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSurveyDataSchema.parse(req.body);
      const result = await storage.insertSurveyData(validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid data format", errors: error.errors });
      } else {
        console.error("Error uploading survey data:", error);
        res.status(500).json({ message: "Failed to upload survey data" });
      }
    }
  });

  // Upload bulk survey data
  app.post("/api/survey-data/bulk", async (req: Request, res: Response) => {
    try {
      // If no data is provided, return error
      if (!req.body || !Array.isArray(req.body) || req.body.length === 0) {
        return res.status(400).json({ message: "No data provided or invalid format" });
      }

      // Clear existing data if the 'clear' query parameter is set to true
      if (req.query.clear === 'true') {
        await storage.clearSurveyData();
      }

      const results = await storage.insertBulkSurveyData(req.body);
      res.status(201).json({ 
        message: "Bulk upload successful", 
        count: results.length 
      });
    } catch (error) {
      console.error("Error uploading bulk survey data:", error);
      res.status(500).json({ message: "Failed to upload bulk survey data" });
    }
  });

  // Clear all survey data
  app.delete("/api/survey-data", async (req: Request, res: Response) => {
    try {
      await storage.clearSurveyData();
      res.status(200).json({ message: "All survey data cleared successfully" });
    } catch (error) {
      console.error("Error clearing survey data:", error);
      res.status(500).json({ message: "Failed to clear survey data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
