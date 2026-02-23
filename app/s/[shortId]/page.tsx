
import React from 'react';
import Gallery from '@/components/Gallery';

interface PageProps {
  params: Promise<{ shortId: string }>;
}

/**
 * GalleryPage là một Server Component trong Next.js 15.
 * Params là một Promise và cần được awaited.
 */
export default async function GalleryPage({ params }: PageProps) {
  // Await params để đảm bảo route được resolve chính xác trước khi render Client Component
  const resolvedParams = await params;
  
  // Gallery là một Client Component và nó tự sử dụng useParams() để lấy shortId,
  // nên chúng ta không cần truyền props vào đây.
  return <Gallery />;
}
