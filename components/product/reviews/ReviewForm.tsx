import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { ProductReview, ProductReviewSummary } from "@/types/review";
import { StarRating } from "./StarRating";

type ReviewFormProps = {
  productId: number;
  dictionary: Dictionary;
  isAuthenticated: boolean;
  onSubmitted: (data: { review: ProductReview; summary: ProductReviewSummary }) => void;
};

export function ReviewForm({
  productId,
  dictionary,
  isAuthenticated,
  onSubmitted,
}: ReviewFormProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!rating) {
      setError(dictionary.form.required);
      return;
    }
    if (comment.trim().length < 5) {
      setError(dictionary.form.required);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment,
          ...(isAuthenticated
            ? {}
            : {
                guestName: guestName.trim() || undefined,
                guestEmail: guestEmail.trim() || undefined,
              }),
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? dictionary.product.reviews.error);
      }
      const json = (await response.json()) as {
        review: ProductReview;
        summary: ProductReviewSummary;
      };
      toast({ title: dictionary.product.reviews.success, variant: "success" });
      setComment("");
      setGuestName("");
      setGuestEmail("");
      setRating(5);
      onSubmitted(json);
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : dictionary.product.reviews.error,
      );
      toast({ title: dictionary.product.reviews.error, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-sm font-semibold text-neutral-800">
          {dictionary.product.reviews.ratingLabel}
        </Label>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <div>
        <Label className="text-sm font-semibold text-neutral-800">
          {dictionary.product.reviews.commentLabel}
        </Label>
        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          placeholder={dictionary.product.reviews.commentLabel}
        />
      </div>
      {!isAuthenticated ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-sm font-semibold text-neutral-800">
              {dictionary.product.reviews.guestNameLabel}
            </Label>
            <Input
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-neutral-800">
              {dictionary.product.reviews.guestEmailLabel}
            </Label>
            <Input
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.target.value)}
              type="email"
            />
          </div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? `${dictionary.product.reviews.submit}…`
          : dictionary.product.reviews.submit}
      </Button>
    </form>
  );
}
