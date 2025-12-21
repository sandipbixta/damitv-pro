import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, User } from 'lucide-react';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  author_name: string | null;
  published_at: string | null;
  views: number;
  tags: string[] | null;
}

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, featured_image, author_name, published_at, views, tags')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  return (
    <>
      <Helmet>
        <title>Blog - Sports News & Updates | DamiTV</title>
        <meta name="description" content="Latest sports news, streaming guides, match previews and more from DamiTV blog." />
        <link rel="canonical" href="https://damitv.pro/blog" />
      </Helmet>

      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <header className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              DamiTV Blog
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Latest sports news, streaming guides, match previews and expert analysis
            </p>
          </header>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading posts...</span>
              </div>
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="h-full hover:border-primary transition-colors overflow-hidden group">
                    {post.featured_image && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {post.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                      {post.excerpt && (
                        <CardDescription className="line-clamp-2">
                          {post.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {post.author_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {post.author_name}
                          </span>
                        )}
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(post.published_at), 'MMM d, yyyy')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.views}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No blog posts yet. Check back soon!</p>
            </div>
          )}
        </div>
      </PageLayout>
    </>
  );
};

export default Blog;
