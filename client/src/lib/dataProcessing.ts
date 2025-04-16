import { SurveyRecord } from "@/types";

/**
 * Count occurrences of each value for a given property in the dataset
 */
export function countByProperty(data: SurveyRecord[], property: keyof SurveyRecord): { [key: string]: number } {
  const counts: { [key: string]: number } = {};
  
  data.forEach(record => {
    const value = record[property];
    
    // Skip null/undefined values and handle different types
    if (value === null || value === undefined) {
      return;
    }
    
    const stringValue = String(value);
    counts[stringValue] = (counts[stringValue] || 0) + 1;
  });
  
  return counts;
}

/**
 * Calculate percentage of a given condition in the dataset
 */
export function calculatePercentage(data: SurveyRecord[], conditionFn: (record: SurveyRecord) => boolean): number {
  if (!data || data.length === 0) {
    return 0;
  }
  
  const matchingRecords = data.filter(conditionFn);
  return (matchingRecords.length / data.length) * 100;
}

/**
 * Get unique values for a property in the dataset
 */
export function getUniqueValues(data: SurveyRecord[], property: keyof SurveyRecord): any[] {
  if (!data || data.length === 0) {
    return [];
  }
  
  const uniqueValues = new Set();
  
  data.forEach(record => {
    const value = record[property];
    if (value !== null && value !== undefined) {
      uniqueValues.add(value);
    }
  });
  
  return Array.from(uniqueValues);
}

/**
 * Convert CSV row to SurveyRecord object
 */
export function convertCsvRowToRecord(row: any): Partial<SurveyRecord> {
  return {
    familyHistory: row["Family History of Mental Illness"],
    companySize: row["Company Size"],
    year: row["year"]?.toString(),
    age: typeof row["Age"] === 'number' ? row["Age"] : null,
    ageGroup: row["Age-Group"],
    gender: row["Gender"],
    soughtTreatment: row["Sought Treatment"] === 1,
    preferAnonymity: row["Prefer Anonymity"] === 1,
    rateReactionToProblems: row["Rate Reaction to Problems"],
    negativeConsequences: row["Negative Consequences"],
    location: row["Location"],
    accessToInformation: row["Access to information"] === 1,
    insurance: row["Insurance"] === 1,
    diagnosis: row["Diagnosis"],
    discussMentalHealthProblems: row["Discuss Mental Health Problems"],
    responsibleEmployer: row["Responsible Employer"],
    disorder: row["Disorder"] === 1,
    primarilyTechEmployer: row["Primarily a Tech Employer"] === 1
  };
}
