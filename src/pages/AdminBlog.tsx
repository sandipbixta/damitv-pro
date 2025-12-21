import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Eye, EyeOff, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  published_at: string | null;
  views: number;
  created_at: string;
}

const AdminBlog = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, is_published, published_at, views, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success('Post deleted successfully');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to delete post');
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          is_published, 
          published_at: is_published ? new Date().toISOString() : null 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { is_published }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success(is_published ? 'Post published!' : 'Post unpublished');
    },
    onError: () => {
      toast.error('Failed to update post');
    },
  });

  return (
    <>
      <Helmet>
        <title>Blog Admin | DamiTV</title>
      </Helmet>

      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Blog Posts
              </CardTitle>
              <Button onClick={() => navigate('/admin/blog/new')}>
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading posts...</span>
                  </div>
                </div>
              ) : posts && posts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {post.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant={post.is_published ? 'default' : 'secondary'}>
                            {post.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>{post.views}</TableCell>
                        <TableCell>
                          {format(new Date(post.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => togglePublishMutation.mutate({ 
                                id: post.id, 
                                is_published: !post.is_published 
                              })}
                              title={post.is_published ? 'Unpublish' : 'Publish'}
                            >
                              {post.is_published ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(post.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No blog posts yet</p>
                  <Button onClick={() => navigate('/admin/blog/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminBlog;
