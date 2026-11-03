export interface Major {
  id: number;
  code: string;
  name: string;
  majorCode?: string;
  majorName?: string;
  description?: string;
  programId?: number | null;
  createdAt: string;
}
