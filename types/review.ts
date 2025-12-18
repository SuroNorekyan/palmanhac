export type ProductReviewSummary = {
  average: number;
  count: number;
};

export type ProductReview = {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: string;
};
