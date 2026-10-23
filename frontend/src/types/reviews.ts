export interface Review {
  id: string;
  entityId: string;
  entityType: 'university' | 'program';
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
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
  status: 'pending' | 'approved' | 'rejected' | 'reported';
  universityReply?: string;
  replyDate?: Date;
  studyYear?: number;
  graduationYear?: number;
  referenciaNombre?: string | null;
  programId?: string;
  universityId?: string;
  reports?: Array<{ reason: string; userId?: string; createdAt?: Date; date?: Date }>;
  rejectionReason?: string;
}

export interface ReviewStats {
  entityId: string;
  entityType: 'university' | 'program';
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  wouldRecommendPercentage: number;
  pros: string[];
  cons: string[];
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
  isVerifiedStudent?: boolean;
  studyYear?: number;
  graduationYear?: number;
}

export interface ReviewFilters {
  minRating?: number;
  verifiedOnly?: boolean;
  withContentOnly?: boolean;
  hasReply?: boolean;
  withReplies?: boolean;
  helpfulOnly?: boolean;
  sortBy?: 'recent' | 'helpful' | 'rating' | 'highest' | 'lowest' | 'oldest';
}
