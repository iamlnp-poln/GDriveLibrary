
import React from 'react';
import Gallery from '../../../components/Gallery';

interface PageProps {
  params: Promise<{ shortId: string }>;
}

export default async function GalleryPage({ params }: PageProps) {
  // In Next.js 15, params must be awaited even if not used directly in the server component
  // to ensure the route is correctly resolved before rendering client components.
  await params;
  
  return <Gallery />;
}
