import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import SectionHeader from './SectionHeader';

const BlogPreviewSection: React.FC = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, featured_image, published_at, author_name')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <SectionHeader title="Latest Articles" seeAllLink="/blog" seeAllText="VIEW ALL" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <SectionHeader title="Latest Articles" seeAllLink="/blog" seeAllText="VIEW ALL" />
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {posts.map((post) => (
          <Link key={post.id} to={`/blog/${post.slug}`}>
            <Card className="h-full overflow-hidden group hover:border-primary/50 transition-all duration-300 bg-card border-border">
              {post.featured_image && (
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardContent className="p-2.5">
                <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
                  {post.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.published_at && format(new Date(post.published_at), 'MMM d')}
                  </span>
                  <ArrowRight className="w-3 h-3 text-primary" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      <div className="text-center mt-4">
        <Link to="/blog">
          <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            View All Articles <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default BlogPreviewSection;
