export interface Major {
  id: number;
  majorCode: string;
  majorName: string;
  subjectCount: number;
  plo: number;
  clo: number;
  kg: number;
  createdAt?: string;
  years?: number[];
}

export interface AnalysisConfig {
  majorCode: string;
  ploThreshold: number;
  cloThreshold: number;
  enableContribution: boolean;
  enableSelfAssessment: boolean;
  updatedAt?: string;
}