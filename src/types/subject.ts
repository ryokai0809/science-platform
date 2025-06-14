// Subject 타입 정의를 이렇게 수정
export type Subject = {
  id: number;
  name: string;
  subject_id?: number;
  subjects?: {
    name: string;
  }[]; // <- 배열로 변경
};
