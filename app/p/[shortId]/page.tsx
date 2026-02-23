
import React from 'react';
import Gallery from '@/components/Gallery';

interface PageProps {
  params: Promise<{ shortId: string }>;
}

export default async function PickingPage({ params }: PageProps) {
  await params;
  return <Gallery isPickingMode={true} />;
}
