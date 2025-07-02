"use client";
import React, { useState, useEffect } from "react";
import { Dropdown, Badge } from "react-bootstrap";
import api from "../lib/api";

interface Collection {
  id: number;
  name: string;
  description: string | null;
  color: string;
}

interface CollectionSelectorProps {
  pageId: number;
  currentCollectionId: number | null;
  onCollectionChange: (collectionId: number | null) => void;
}

const CollectionSelector: React.FC<CollectionSelectorProps> = ({
  pageId,
  currentCollectionId,
  onCollectionChange,
}) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await api.get("/api/collections");
      setCollections(response.data);
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const handleCollectionSelect = async (collectionId: number | null) => {
    setLoading(true);
    try {
      if (collectionId === null) {
        await api.delete(`/api/collections/remove-page/${pageId}`);
      } else {
        await api.post("/api/collections/add-page", {
          pageId,
          collectionId,
        });
      }
      onCollectionChange(collectionId);
    } catch (error) {
      console.error("Error updating page collection:", error);
      alert("Failed to update collection");
    } finally {
      setLoading(false);
    }
  };

  const currentCollection = collections.find(c => c.id === currentCollectionId);

  return (
    <Dropdown>
      <Dropdown.Toggle 
        variant="outline-secondary" 
        size="sm" 
        disabled={loading}
        className="d-flex align-items-center gap-2"
      >
        {currentCollection ? (
          <>
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: currentCollection.color,
                borderRadius: "50%",
              }}
            />
            {currentCollection.name}
          </>
        ) : (
          "No Collection"
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item
          onClick={() => handleCollectionSelect(null)}
          active={currentCollectionId === null}
        >
          <span className="text-muted">No Collection</span>
        </Dropdown.Item>
        <Dropdown.Divider />
        {collections.map((collection) => (
          <Dropdown.Item
            key={collection.id}
            onClick={() => handleCollectionSelect(collection.id)}
            active={currentCollectionId === collection.id}
            className="d-flex align-items-center gap-2"
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: collection.color,
                borderRadius: "50%",
              }}
            />
            {collection.name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default CollectionSelector;
