import api from "./api";

export type SurveyLevel = "LV1" | "LV2";
export type SurveyMenu = "main" | "sidebar";

export interface SurveyForm {
  id: number;
  source?: "standard" | "dashboard";
  sourceId?: number;
  year: string;
  code: string;
  title: string;
  description: string;
  isCdr: boolean;
  link: string;
  level: SurveyLevel;
  enabled: boolean;
  legacyLink: string;
  menu: SurveyMenu;
  classes: string;
  createdAt: string;
  updatedAt: string;
  questionCount?: number;
  responseCount?: number;
}

export type SurveyFormInput = Omit<SurveyForm, "id" | "createdAt" | "updatedAt">;
export type SurveyFormUpdate = Partial<SurveyFormInput>;

export interface DashboardSurveyForm {
  id: number;
  code: string;
  title: string;
  description: string;
  isCdr: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  questionCount?: number;
  responseCount?: number;
}

export type DashboardSurveyFormInput = Pick<
  DashboardSurveyForm,
  "code" | "title" | "description" | "isCdr" | "enabled"
>;
export type DashboardSurveyFormUpdate = Partial<DashboardSurveyFormInput>;

export interface SurveyQuestion {
  id?: number;
  questionText: string;
  type: "single" | "multiple" | "text" | "rating";
  required: boolean;
  options: string[];
  groupNo: number;
  groupTitle: string;
  sortOrder: number;
}

export interface SurveyDashboard {
  totalForms: number;
  activeForms: number;
  responseCount: number;
  questionCount: number;
  cdrConversion: boolean;
  recentForms: DashboardSurveyForm[];
}

const surveysService = {
  async findAll(): Promise<SurveyForm[]> {
    const response = await api.get<SurveyForm[]>("/surveys");
    return response.data;
  },

  async create(input: SurveyFormInput): Promise<SurveyForm> {
    const response = await api.post<SurveyForm>("/surveys", input);
    return response.data;
  },

  async update(id: number, input: SurveyFormUpdate): Promise<SurveyForm> {
    const response = await api.patch<SurveyForm>(`/surveys/${id}`, input);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/surveys/${id}`);
  },

  async removeDashboardForm(id: number): Promise<void> {
    await api.delete(`/surveys/dashboard/forms/${id}`);
  },

  async getDashboard(): Promise<SurveyDashboard> {
    const response = await api.get<SurveyDashboard>("/surveys/dashboard");
    return response.data;
  },

  async updateDashboardSettings(
    cdrConversion: boolean,
  ): Promise<{ id: number; cdrConversion: boolean }> {
    const response = await api.patch<{ id: number; cdrConversion: boolean }>(
      "/surveys/dashboard/settings",
      { cdrConversion },
    );
    return response.data;
  },

  async findDashboardForms(): Promise<DashboardSurveyForm[]> {
    const response = await api.get<DashboardSurveyForm[]>(
      "/surveys/dashboard/forms",
    );
    return response.data;
  },

  async createDashboardForm(
    input: DashboardSurveyFormInput,
  ): Promise<DashboardSurveyForm> {
    const response = await api.post<DashboardSurveyForm>(
      "/surveys/dashboard/forms",
      input,
    );
    return response.data;
  },

  async updateDashboardForm(
    id: number,
    input: DashboardSurveyFormUpdate,
  ): Promise<DashboardSurveyForm> {
    const response = await api.patch<DashboardSurveyForm>(
      `/surveys/dashboard/forms/${id}`,
      input,
    );
    return response.data;
  },

  async getDashboardQuestions(id: number): Promise<SurveyQuestion[]> {
    const response = await api.get<SurveyQuestion[]>(
      `/surveys/dashboard/forms/${id}/questions`,
    );
    return response.data;
  },

  async saveDashboardQuestions(
    id: number,
    questions: SurveyQuestion[],
  ): Promise<SurveyQuestion[]> {
    const response = await api.put<SurveyQuestion[]>(
      `/surveys/dashboard/forms/${id}/questions`,
      { questions },
    );
    return response.data;
  },

  async getQuestions(surveyId: number): Promise<SurveyQuestion[]> {
    const response = await api.get<SurveyQuestion[]>(
      `/surveys/${surveyId}/questions`,
    );
    return response.data;
  },

  async saveQuestions(
    surveyId: number,
    questions: SurveyQuestion[],
  ): Promise<SurveyQuestion[]> {
    const response = await api.put<SurveyQuestion[]>(
      `/surveys/${surveyId}/questions`,
      { questions },
    );
    return response.data;
  },
};

export default surveysService;
