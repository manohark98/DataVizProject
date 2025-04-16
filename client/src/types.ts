export interface SurveyRecord {
  id: number;
  familyHistory: string;
  companySize: string;
  year: string;
  age: number;
  ageGroup: string;
  gender: string;
  soughtTreatment: boolean;
  preferAnonymity: boolean;
  rateReactionToProblems: string;
  negativeConsequences: string;
  location: string;
  accessToInformation: boolean;
  insurance: boolean;
  diagnosis: string;
  discussMentalHealthProblems: string;
  responsibleEmployer: string;
  disorder: boolean;
  primarilyTechEmployer: boolean;
}

export interface SummaryStatistic {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

export interface FilterState {
  year: string | null;
  gender: string | null;
  companySize: string | null;
  ageGroup: string | null;
}

export interface ChartData {
  [key: string]: any;
}

export type ChartType = 'bar' | 'stacked' | 'line' | 'scatter' | 'pie' | 'donut' | 'map' | 'heatmap' | 'grouped';
