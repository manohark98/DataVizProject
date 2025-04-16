import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const surveyData = pgTable("survey_data", {
  id: serial("id").primaryKey(),
  familyHistory: text("family_history"),
  companySize: text("company_size"),
  year: text("year"),
  age: integer("age"),
  ageGroup: text("age_group"),
  gender: text("gender"),
  soughtTreatment: boolean("sought_treatment"),
  preferAnonymity: boolean("prefer_anonymity"),
  rateReactionToProblems: text("rate_reaction_to_problems"),
  negativeConsequences: text("negative_consequences"),
  location: text("location"),
  accessToInformation: boolean("access_to_information"),
  insurance: boolean("insurance"),
  diagnosis: text("diagnosis"),
  discussMentalHealthProblems: text("discuss_mental_health_problems"),
  responsibleEmployer: text("responsible_employer"),
  disorder: boolean("disorder"),
  primarilyTechEmployer: boolean("primarily_tech_employer"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSurveyDataSchema = createInsertSchema(surveyData);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSurveyData = z.infer<typeof insertSurveyDataSchema>;
export type SurveyData = typeof surveyData.$inferSelect;
