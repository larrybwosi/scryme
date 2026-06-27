import { z } from "zod";

export const addFavoriteSchema = z
  .object({
    customerId: z.string().cuid(),
    productId: z.string().cuid().optional(),
    variantId: z.string().cuid().optional(),
  })
  .refine((data) => data.productId || data.variantId, {
    message: "Either productId or variantId must be provided.",
    path: ["productId", "variantId"],
  });

export const removeFavoriteSchema = z.object({
  favoriteId: z.string().cuid(),
});

export const getCustomerFavoritesSchema = z.object({
  customerId: z.string().cuid(),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  customerId: z.string().cuid(),
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
});

export const getProductReviewsSchema = z.object({
  productId: z.string().cuid(),
});

export const updateReviewSchema = z
  .object({
    reviewId: z.string().cuid(),
    data: z.object({
      rating: z.number().int().min(1).max(5).optional(),
      comment: z.string().optional(),
      variantId: z.string().cuid().optional(),
    }),
  })
  .refine((data) => Object.keys(data.data).length > 0, {
    message:
      "At least one field (rating, comment, or variantId) must be provided for update.",
    path: ["data"],
  });

export const deleteReviewSchema = z.object({
  reviewId: z.string().cuid(),
});
