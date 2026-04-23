// src/types/reviews.ts
export interface Review {
  id: string;
  entityId: string; // ID de la universidad o programa
  entityType: 'university' | 'program';
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  wouldRecommend: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: Date;
  updatedAt?: Date;
  isVerifiedStudent: boolean;
  status: 'pending' | 'approved' | 'rejected';
  universityReply?: string;
  replyDate?: Date;
  studyYear?: number; // Año de estudio (1, 2, 3, 4, 5+)
  graduationYear?: number; // Año de graduación
}

export interface ReviewStats {
  entityId: string;
  entityType: 'university' | 'program';
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  wouldRecommendPercentage: number;
  pros: string[]; // Pros más comunes
  cons: string[]; // Contras más comunes
}

export interface ReviewFormData {
  entityId: string;
  entityType: 'university' | 'program';
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  wouldRecommend: boolean;
  studyYear?: number;
  graduationYear?: number;
}