export interface AllRounder {
  id: string;
  name: string;
  photo: string;
  achievement: string;
  description: string;
  gallery: string[];
  galleryDir?: string | null;
}

export interface MonthHighlight {
  id: string;
  month: string;
  year: string;
  monthIndex?: number;
  allRounders: AllRounder[];
  createdAt?: unknown;
  updatedAt?: unknown;
}
