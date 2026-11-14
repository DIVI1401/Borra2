import type { Metadata } from "next";
import { ReviewsAdmin } from "./reviews-admin";

export const metadata: Metadata = { title: "Reseñas" };

export default function ReviewsPage() {
  return <ReviewsAdmin />;
}
