import { users, type User, type InsertUser, surveyData, type SurveyData, type InsertSurveyData } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Survey Data Operations
  getAllSurveyData(): Promise<SurveyData[]>;
  insertSurveyData(data: InsertSurveyData): Promise<SurveyData>;
  insertBulkSurveyData(data: InsertSurveyData[]): Promise<SurveyData[]>;
  clearSurveyData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private surveysData: Map<number, SurveyData>;
  currentUserId: number;
  currentSurveyId: number;

  constructor() {
    this.users = new Map();
    this.surveysData = new Map();
    this.currentUserId = 1;
    this.currentSurveyId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllSurveyData(): Promise<SurveyData[]> {
    return Array.from(this.surveysData.values());
  }

  async insertSurveyData(data: InsertSurveyData): Promise<SurveyData> {
    const id = this.currentSurveyId++;
    const surveyRecord: SurveyData = { ...data, id };
    this.surveysData.set(id, surveyRecord);
    return surveyRecord;
  }

  async insertBulkSurveyData(data: InsertSurveyData[]): Promise<SurveyData[]> {
    const result: SurveyData[] = [];
    for (const item of data) {
      const id = this.currentSurveyId++;
      const surveyRecord: SurveyData = { ...item, id };
      this.surveysData.set(id, surveyRecord);
      result.push(surveyRecord);
    }
    return result;
  }

  async clearSurveyData(): Promise<void> {
    this.surveysData.clear();
    this.currentSurveyId = 1;
  }
}

export const storage = new MemStorage();
