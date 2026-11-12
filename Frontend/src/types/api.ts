export interface Role {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  roleId: number;
  userName: string;
  email: string;
  phone?: string | null;
  status: 'active' | 'blocked' | string;
  role?: Role | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GuestSessionInfo {
  status: 'active' | 'transferred' | string;
  recognitionCount: number;
  limit: number;
  remaining: number;
  expiresAt: string;
}

export interface GuestSessionResponse extends GuestSessionInfo {
  token?: string;
}

export interface TypeItem {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Rock {
  id: number;
  typeId: number;
  categoryId: number;
  index: number;
  name: string;
  scientificName: string;
  description: string;
  composition: string;
  formula: string;
  molarWeight?: number | null;
  environment: string;
  commonUses: string;
  hardness: number;
  streak: string;
  color: string;
  texture: string;
  density: number;
  transparency: number;
  tenacity: number;
  imgUrl: string;
  mindatUrl: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  type?: TypeItem | null;
  category?: CategoryItem | null;
}

export interface Achievement {
  id: number;
  name: string;
  slug: string;
  description: string;
  experience: number;
  conditionType?: 'distinct_rocks' | 'total_recognitions' | null;
  conditionValue?: number | null;
  isActive: boolean;
  unlocked?: boolean;
  unlockedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Analysis {
  id: number;
  userId?: number | null;
  guestSessionId?: number | null;
  rockId: number;
  image_url?: string | null;
  confidence: number;
  result: string;
  note?: string | null;
  createdAt: string;
  updatedAt?: string;
  rock?: Rock | null;
}

export interface CollectionEntry {
  id: number;
  userId?: number | null;
  guestSessionId?: number | null;
  rockId: number;
  firstDiscoveredAt: string;
  recognitionCount: number;
  rock?: Rock | null;
}

export interface Feedback {
  id: number;
  analysisId: number;
  userId: number;
  isCorrect: boolean;
  comment?: string | null;
  createdAt: string;
  updatedAt?: string;
  analysis?: Analysis | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ListResult<T> {
  items: T[];
  total: number;
}

export interface TypePayload {
  name: string;
}

export interface CategoryPayload {
  name: string;
  description?: string | null;
}

export interface AchievementPayload {
  name: string;
  slug: string;
  description: string;
  experience: number;
  conditionType?: 'distinct_rocks' | 'total_recognitions' | null;
  conditionValue?: number | null;
  isActive?: boolean;
}

export interface RegisterPayload {
  userName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface ProfilePayload {
  userName?: string;
  phone?: string;
}

export interface UserUpdatePayload {
  roleId?: number;
  status?: 'active' | 'blocked';
}

export interface FeedbackPayload {
  isCorrect: boolean;
  comment?: string | null;
}

export interface UnlockedAchievement {
  id: number;
  slug: string;
  name: string;
  experience: number;
  unlockedAt: string;
}

export interface RecognitionResult {
  analysis: Analysis;
  collection: {
    rockId: number;
    recognitionCount: number;
    firstDiscoveredAt: string;
  };
  newDiscovery: boolean;
  unlockedAchievements: UnlockedAchievement[];
  guest?: GuestSessionInfo;
}

export interface ProgressStats {
  totalRecognitions: number;
  distinctRocks: number;
  unlockedAchievements: number;
  discoveryPercentage: number;
}

export interface MigrationResult {
  status: string;
  discoveries: number;
  recognitions: number;
  achievements: number;
  unlockedAchievements: UnlockedAchievement[];
}

export interface AdminStats {
  registeredUsers: number;
  totalRecognitions: number;
  mostRecognizedRocks: {
    rockId: number;
    name: string | null;
    count: number;
  }[];
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
  migration?: MigrationResult;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  searchBy?: string;
  typeId?: number;
  categoryId?: number;
  userId?: number;
  rockId?: number;
  analysisId?: number;
}

export interface RockPayload {
  index: number;
  name: string;
  scientificName: string;
  description: string;
  composition: string;
  formula: string;
  molarWeight?: number | null;
  environment: string;
  commonUses: string;
  hardness: number;
  streak: string;
  color: string;
  texture: string;
  density: number;
  transparency: number;
  tenacity: number;
  imgUrl: string;
  mindatUrl: string;
  typeId: number;
  categoryId: number;
}

export interface RecognitionPayload {
  image: {
    base64: string;
    mime_type: 'image/jpeg' | 'image/png' | 'image/webp';
  };
  note?: string;
}
