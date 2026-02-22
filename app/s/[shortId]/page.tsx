
'use client';

import React from 'react';
import Gallery from '../../../components/Gallery';

interface PageProps {
  params: Promise<{ shortId: string }> | { shortId: string };
}

export default function GalleryPage({ params }: PageProps) {
  // The Gallery component already uses useParams() internally, 
  // so we don't strictly need to pass params here, but we fix the signature.
  return <Gallery />;
}
