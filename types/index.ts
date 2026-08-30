// types/index.ts
export interface UserProfile {
  name: string;
  email: string;
  currentCGPA: number;
  totalCredits: number;
  semestersLogged: number;
}

export interface GradeRecord {
  id: string;
  subject: string;
  grade: string;
  credits: number;
  semester: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'exam' | 'submission' | 'study';
}