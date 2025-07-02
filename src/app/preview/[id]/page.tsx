'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Button } from 'react-bootstrap';
import api from '../../lib/api';

interface Document {
  id: number;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

const PreviewPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;
      
      try {
        const res = await api.get(`/api/pages/${id}`);
        const doc = res.data;
        
        
        if (!doc.published) {
          setError('This document is not published yet.');
          return;
        }
        
        setDocument(doc);
      } catch (error) {
        console.error('Error fetching document:', error);
        setError('Document not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  if (loading) {
    return <Container className="p-4"><p>Loading...</p></Container>;
  }

  if (error || !document) {
    return (
      <Container className="p-4">
        <p className="text-muted">{error || 'Document not found.'}</p>
        <Button variant="secondary" onClick={() => router.push('/')}>
          Back to Editor
        </Button>
      </Container>
    );
  }

  return (
    <Container className="p-4">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <h2>{document.title}</h2>
        <Button variant="outline-secondary" onClick={() => router.push('/')}>
          Back to Editor
        </Button>
      </div>
      <hr />
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
        {document.content}
      </div>
      <hr className="mt-4" />
      <small className="text-muted">
        Published on: {new Date(document.updatedAt).toLocaleDateString()}
      </small>
    </Container>
  );
};

export default PreviewPage;