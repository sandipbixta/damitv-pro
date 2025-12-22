import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Favorite {
  id: string;
  favorite_type: 'team' | 'league' | 'match';
  favorite_id: string;
  favorite_name: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getSessionId = () => {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const sessionId = getSessionId();
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;
      setFavorites((data || []) as Favorite[]);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (
    type: 'team' | 'league' | 'match',
    id: string,
    name: string
  ) => {
    try {
      const sessionId = getSessionId();
      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          session_id: sessionId,
          favorite_type: type,
          favorite_id: id,
          favorite_name: name
        })
        .select()
        .single();

      if (error) throw error;

      setFavorites([...favorites, data as Favorite]);
      toast({
        title: 'Added to favorites!',
        description: `${name} has been added to your favorites.`
      });
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Already in favorites',
          description: 'This item is already in your favorites.',
          variant: 'destructive'
        });
      } else {
        console.error('Error adding favorite:', error);
        toast({
          title: 'Error',
          description: 'Failed to add favorite.',
          variant: 'destructive'
        });
      }
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter(f => f.id !== favoriteId));
      toast({
        title: 'Removed from favorites',
        description: 'Item has been removed from your favorites.'
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove favorite.',
        variant: 'destructive'
      });
    }
  };

  const isFavorite = (type: string, id: string) => {
    return favorites.some(f => f.favorite_type === type && f.favorite_id === id);
  };

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite
  };
};
