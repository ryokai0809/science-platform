export type Video = {
  id: string;
  title: string;
  url: string;
  grade_id: number; // ✅ 이 줄 추가
  grades: {
    name: string;
    subjects?: {
      name: string;
    };
  };
};
