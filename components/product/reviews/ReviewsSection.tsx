import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { ProductReview, ProductReviewSummary } from "@/types/review";
import { ReviewForm } from "./ReviewForm";
import { StarRating } from "./StarRating";

type ReviewsSectionProps = {
  productId: number;
  dictionary: Dictionary;
  locale: Locale;
};

const formatReviewDate = (locale: Locale, value: string) => {
  try {
    const formatter = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", {
      dateStyle: "medium",
    });
    return formatter.format(new Date(value));
  } catch {
    return value;
  }
};

export function ReviewsSection({ productId, dictionary, locale }: ReviewsSectionProps) {
  const { status } = useSession();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ProductReviewSummary>({ average: 0, count: 0 });
  const [loading, setLoading] = useState(false);
  const isAuthenticated = status === "authenticated";

  const loadReviews = () => {
    setLoading(true);
    fetch(`/api/products/${productId}/reviews`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load reviews");
        }
        const data = (await res.json()) as {
          summary: ProductReviewSummary;
          reviews: ProductReview[];
        };
        setSummary(data.summary);
        setReviews(data.reviews);
      })
      .catch((error) => {
        console.error("[Reviews] Failed to load reviews", error);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const averageDisplay = useMemo(() => {
    if (!summary.count) {
      return "—";
    }
    return summary.average.toFixed(1);
  }, [summary]);

  return (
    <section className="space-y-6 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">
            {dictionary.product.reviews.heading}
          </h2>
          <p className="text-sm text-neutral-500">
            {dictionary.product.reviews.countLabel.replace(
              "{count}",
              summary.count.toString(),
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold text-neutral-900">{averageDisplay}</p>
          <StarRating value={Math.round(summary.average)} readOnly size="sm" />
          <p className="text-xs text-neutral-500">
            {dictionary.product.reviews.averageLabel}
          </p>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          {loading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : reviews.length ? (
            <ul className="space-y-4">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {review.authorName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatReviewDate(locale, review.createdAt)}
                      </p>
                    </div>
                    <StarRating value={review.rating} readOnly size="sm" />
                  </div>
                  <p className="mt-3 text-sm text-neutral-700">{review.comment}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">{dictionary.product.reviews.empty}</p>
          )}
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-neutral-50/60 p-4">
          <h3 className="text-lg font-semibold text-neutral-900">
            {dictionary.product.reviews.writeReview}
          </h3>
          <ReviewForm
            productId={productId}
            dictionary={dictionary}
            isAuthenticated={isAuthenticated}
            onSubmitted={({ review, summary: nextSummary }) => {
              setSummary(nextSummary);
              setReviews((prev) => [review, ...prev].slice(0, 10));
            }}
          />
        </div>
      </div>
    </section>
  );
}
