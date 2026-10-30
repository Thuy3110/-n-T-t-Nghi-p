import api from "./api";

export interface DirectDashboardStats {
  ploCount: number;
  programCount: number;
  matrixCount: number;
  majorCount: number;
  courseCount: number;
  criteria: {
    minAverageScore: number;
    maxScore: number;
    minPloPassRate: number;
  };
  calculationSteps: {
    step: number;
    title: string;
    description: string;
  }[];
}

export const statisticsService = {
  getDirectDashboardStats: async (): Promise<DirectDashboardStats> => {
    const res = await api.get("/statistics/direct-dashboard");
    return res.data;
  },
  getIndirectDashboardStats: async () => {
    const res = await api.get("/statistics/indirect-dashboard");
    return res.data;
  },
  getOverview: async () => {
    const res = await api.get("/statistics/overview");
    return res.data;
  },
};
