import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  type: 'team' | 'league' | 'match';
  id: string;
  name: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  type,
  id,
  name,
  className,
  variant = 'ghost',
  size = 'sm'
}) => {
  const { favorites, addFavorite, removeFavorite, isFavorite: checkIsFavorite } = useFavorites();
  const isFav = checkIsFavorite(type, id);
  const favorite = favorites.find(f => f.favorite_type === type && f.favorite_id === id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFav && favorite) {
      removeFavorite(favorite.id);
    } else {
      addFavorite(type, id, name);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        'transition-all',
        isFav && 'text-red-500 hover:text-red-600',
        className
      )}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={cn(
          'h-4 w-4',
          isFav && 'fill-current'
        )}
      />
    </Button>
  );
};

export default FavoriteButton;
