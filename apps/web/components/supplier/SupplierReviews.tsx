"use client";

import { Star, MessageSquare, ThumbsUp, MoreHorizontal, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Progress } from "@repo/ui/components/ui/progress";
import { format } from "date-fns";

interface SupplierReviewsProps {
  reviews: any[];
}

export function SupplierReviews({ reviews }: SupplierReviewsProps) {
  const ratings = [
    { stars: 5, count: 85, percentage: 70 },
    { stars: 4, count: 20, percentage: 16 },
    { stars: 3, count: 10, percentage: 8 },
    { stars: 2, count: 3, percentage: 3 },
    { stars: 1, count: 2, percentage: 3 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="p-6 bg-background border rounded-2xl shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <div className="text-5xl font-black">4.5</div>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={20}
                  className={i <= 4 ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground fill-muted-foreground/20"}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground font-medium pt-1">Based on 120 reviews</p>
          </div>

          <div className="space-y-3">
            {ratings.map((rating) => (
              <div key={rating.stars} className="flex items-center gap-3">
                <span className="text-xs font-bold w-4">{rating.stars}</span>
                <Star size={12} className="text-muted-foreground fill-muted-foreground" />
                <Progress value={rating.percentage} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-8 text-right">{rating.count}</span>
              </div>
            ))}
          </div>

          <Button className="w-full mt-2" variant="outline">
            Write a Review
          </Button>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl text-muted-foreground">
            <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p>No reviews yet for this supplier</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-6 bg-background border rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.member.user.image} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {review.member.user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold">{review.member.user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(review.createdAt), "MMMM dd, yyyy")}
                    </div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}
                    />
                  ))}
                </div>
              </div>

              <p className="text-sm leading-relaxed text-foreground/80">
                {review.comment}
              </p>

              <div className="flex gap-4 pt-2">
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-2 text-muted-foreground">
                  <ThumbsUp size={14} />
                  Helpful
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
                  Reply
                </Button>
              </div>
            </div>
          ))
        )}

        {reviews.length > 0 && (
          <Button variant="ghost" className="w-full text-primary font-bold">
            View All Reviews
          </Button>
        )}
      </div>
    </div>
  );
}
