// src/types/subject.ts
export type Subject = {
  id: number;
  name: string;
  subject_id?: number;
  subjects?: {
    name: string;
  };
};
