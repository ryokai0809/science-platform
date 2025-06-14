// types/video.ts
export type Video = {
  id: string;
  title: string;
  grades: {
    name: string;
    subjects?: {
      name: string;
    };
  };
};
