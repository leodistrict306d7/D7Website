export type ProjectCategory =
  | 'meetings'
  | 'orientations'
  | 'youth'
  | 'religious'
  | 'service'
  | 'events'
  | 'upcoming';

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  image: string;
  date: string;
  venue: string;
  impact: string;
  gallery: string[];
}

export type ProjectInput = Omit<Project, 'id'>;
