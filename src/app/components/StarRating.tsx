import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onRate,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= Math.floor(rating);
        const isHalf = !isFilled && starValue === Math.ceil(rating) && rating % 1 !== 0;

        return (
          <button
            key={i}
            type="button"
            onClick={() => interactive && onRate?.(starValue)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                isFilled
                  ? 'fill-gold text-gold'
                  : isHalf
                  ? 'fill-gold/50 text-gold'
                  : 'fill-transparent text-muted-foreground'
              }`}
            />
          </button>
        );
      })}
      {showValue && (
        <span className={`${textClasses[size]} text-muted-foreground ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
