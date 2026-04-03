import { Star, Quote } from 'lucide-react';
import { Review } from '../types';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start gap-4">
        <img
          src={review.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=8B1A2F&color=fff`}
          alt={review.userName}
          className="w-11 h-11 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=8B1A2F&color=fff`;
          }}
        />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p style={{ fontWeight: 600 }} className="text-card-foreground">{review.userName}</p>
              <p className="text-muted-foreground text-sm">{review.projectType}</p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-gold text-gold' : 'fill-transparent text-muted-foreground'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(review.date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="mt-2 relative">
            <Quote className="absolute -top-1 -left-1 w-4 h-4 text-maroon/20 fill-maroon/20" />
            <p className="text-card-foreground text-sm pl-4 leading-relaxed">{review.comment}</p>
          </div>
        </div>
      </div>
    </div>
  );
}