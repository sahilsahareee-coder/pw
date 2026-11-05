export type EntitlementStatus =
  | "NOT_ENROLLED"
  | "PENDING"
  | "CONFIRMED"
  | "AUTHENTICATION_REQUIRED"
  | "ACCESS_RESTRICTED";

export interface UserProfile {
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
}

export interface LoginCredentials {
  phone?: string;
  mobile?: string;
  username?: string;
  password?: string;
  otp?: string;
  token?: string;
}

export interface AuthSession {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
}

export interface BatchItem {
  _id: string;
  batchId: string;
  batchName: string;
  batchImage: string;
  language?: string;
  template?: string;
  startDate?: string;
  endDate?: string;
  batchPrice?: number;
  byName?: string;
  isExternal?: boolean;
}

export interface BatchesResponse {
  success: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  data: BatchItem[];
}

export interface EnrolledBatch {
  batchId: string;
  name: string;
  enrolledAt?: string;
  isBookmarkedOnly?: boolean;
}

export interface TeacherInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  qualification?: string;
  subject?: string;
  imageId?: {
    baseUrl?: string;
    key?: string;
  };
}

export interface BatchDetailSubject {
  _id: string;
  subject: string;
  subjectId: string;
  description?: string;
  slug?: string;
  lectureCount?: number;
  tagCount?: number;
  imageId?: {
    baseUrl?: string;
    key?: string;
  } | null;
  teacherIds?: TeacherInfo[];
}

export interface BatchDetailData {
  _id: string;
  name?: string;
  batchCode?: string;
  byName?: string;
  class?: string;
  description?: string;
  shortDescription?: string;
  slug?: string;
  startDate?: string;
  status?: string;
  language?: string;
  isPurchased?: boolean;
  batchPrice?: number;
  fee?: {
    amount?: number;
    discount?: number;
    total?: number;
  };
  subjects?: BatchDetailSubject[];
  program?: {
    name?: string;
    exam?: string[];
    language?: string;
  };
}

export interface TopicItem {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  videos?: number;
  videosCount?: number;
  notes?: number;
  notesCount?: number;
  exercises?: number;
  dppsCount?: number;
}

export interface LectureItem {
  _id: string;
  topic?: string;
  name?: string;
  date?: string;
  duration?: string | number;
  isFree?: boolean;
  type?: string;
  questionsCount?: number;
  homeworkIds?: any[];
  urlType?: string;
  embedCode?: string;
  videoDetails?: {
    videoUrl?: string;
    duration?: number;
    name?: string;
    image?: string;
    embedCode?: string;
  };
  url?: string;
}
