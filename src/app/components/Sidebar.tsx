"use client";
import React, { useEffect, useState } from "react";
import { ListGroup, Form, Button, Accordion, Badge, Dropdown } from "react-bootstrap";
import api from "../lib/api";
import CollectionModal from "./CollectionModal";

interface Collection {
  id: number;
  name: string;
  description: string | null;
  color: string;
  pages?: Document[];
}

interface Document {
  id: number;
  title: string;
  content: string;
  published: boolean;
  collectionId: number | null;
  collection?: Collection;
  createdAt: string;
  updatedAt: string;
}

interface SidebarProps {
  selectedDocumentId: number | null;
  setSelectedDocumentId: (id: number | null) => void;
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  documents: Document[];
}

const Sidebar: React.FC<SidebarProps> = ({
  documents,
  selectedDocumentId,
  setSelectedDocumentId,
  setDocuments,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "collections">("all");

  // Fetch documents and collections
  useEffect(() => {
    fetchDocuments();
    fetchCollections();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/api/pages");
      setDocuments(res.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await api.get("/api/collections");
      setCollections(res.data);
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  // Delete document
  const handleDelete = async (id: number) => {
    const confirm = window.confirm("Are you sure you want to delete this document?");
    if (!confirm) return;

    try {
      await api.delete(`/api/pages/${id}`);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      if (selectedDocumentId === id) {
        setSelectedDocumentId(null);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document");
    }
  };

  // Rename document
  const handleRename = async (id: number) => {
    const newTitle = window.prompt("Enter new title:");
    if (!newTitle || newTitle.trim() === "") return;

    const docToUpdate = documents.find((d) => d.id === id);
    if (!docToUpdate) return;

    try {
      const updated = await api.put(`/api/pages/${id}`, {
        title: newTitle,
        content: docToUpdate.content,
      });

      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? updated.data : doc))
      );
    } catch (error) {
      console.error("Error renaming document:", error);
      alert("Failed to rename document");
    }
  };

  // Delete collection
  const handleDeleteCollection = async (collectionId: number) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this collection? Documents will not be deleted, just moved out of the collection."
    );
    if (!confirm) return;

    try {
      await api.delete(`/api/collections/${collectionId}`);
      setCollections((prev) => prev.filter((col) => col.id !== collectionId));
      // Refresh documents to update their collection references
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting collection:", error);
      alert("Failed to delete collection");
    }
  };

  // Handle collection creation/update
  const handleCollectionSaved = (collection: Collection) => {
    if (editingCollection) {
      setCollections((prev) =>
        prev.map((col) => (col.id === collection.id ? collection : col))
      );
    } else {
      setCollections((prev) => [collection, ...prev]);
    }
    setEditingCollection(null);
    fetchCollections(); // Refresh to get pages
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group documents by collection
  const uncategorizedDocs = filteredDocs.filter((doc) => !doc.collectionId);
  const collectionGroups = collections.map((collection) => ({
    ...collection,
    pages: filteredDocs.filter((doc) => doc.collectionId === collection.id),
  }));

  const renderDocument = (doc: Document) => (
    <ListGroup.Item
      key={doc.id}
      action
      active={doc.id === selectedDocumentId}
      className="d-flex justify-content-between align-items-center"
      onClick={() => setSelectedDocumentId(doc.id)}
    >
      <div className="text-truncate">
        <span>{doc.title}</span>
        {doc.published && <Badge bg="success" className="ms-2">Published</Badge>}
        {doc.collection && viewMode === "all" && (
          <Badge 
            bg="secondary" 
            className="ms-2"
            style={{ backgroundColor: doc.collection.color }}
          >
            {doc.collection.name}
          </Badge>
        )}
      </div>
      <div className="d-flex gap-1">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRename(doc.id);
          }}
        >
          ✏️
        </Button>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(doc.id);
          }}
        >
          🗑️
        </Button>
      </div>
    </ListGroup.Item>
  );

  return (
    <div className="border-end bg-light p-2 d-flex flex-column" style={{ width: "280px" }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="text-muted mb-0">Documents</h6>
        <Dropdown>
          <Dropdown.Toggle variant="outline-primary" size="sm">
            ⚙️
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => setShowCollectionModal(true)}>
              Create Collection
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item 
              onClick={() => setViewMode("all")}
              active={viewMode === "all"}
            >
              View All
            </Dropdown.Item>
            <Dropdown.Item 
              onClick={() => setViewMode("collections")}
              active={viewMode === "collections"}
            >
              View by Collections
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <Form.Control
        type="text"
        size="sm"
        placeholder="Search..."
        className="mb-2"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="flex-grow-1 overflow-auto">
        {viewMode === "all" ? (
          <ListGroup variant="flush">
            {filteredDocs.map(renderDocument)}
          </ListGroup>
        ) : (
          <Accordion defaultActiveKey="0">
            {/* Uncategorized documents */}
            {uncategorizedDocs.length > 0 && (
              <Accordion.Item eventKey="uncategorized">
                <Accordion.Header>
                  <span className="text-muted">Uncategorized ({uncategorizedDocs.length})</span>
                </Accordion.Header>
                <Accordion.Body className="p-0">
                  <ListGroup variant="flush">
                    {uncategorizedDocs.map(renderDocument)}
                  </ListGroup>
                </Accordion.Body>
              </Accordion.Item>
            )}

            {/* Collection groups */}
            {collectionGroups.map((collection, index) => (
              <Accordion.Item key={collection.id} eventKey={index.toString()}>
                <Accordion.Header>
                  <div className="d-flex align-items-center gap-2 w-100">
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor: collection.color,
                        borderRadius: "50%",
                      }}
                    />
                    <span>{collection.name}</span>
                    <Badge bg="secondary" className="ms-auto me-3">
                      {collection.pages?.length || 0}
                    </Badge>
                  </div>
                </Accordion.Header>
                <Accordion.Body className="p-0">
                  <div className="p-2 border-bottom bg-light">
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          setEditingCollection(collection);
                          setShowCollectionModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteCollection(collection.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <ListGroup variant="flush">
                    {collection.pages?.map(renderDocument)}
                    {(!collection.pages || collection.pages.length === 0) && (
                      <ListGroup.Item className="text-muted text-center">
                        No documents in this collection
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </div>

      <CollectionModal
        show={showCollectionModal}
        onHide={() => {
          setShowCollectionModal(false);
          setEditingCollection(null);
        }}
        onCollectionCreated={handleCollectionSaved}
        editingCollection={editingCollection}
      />
    </div>
  );
};

export default Sidebar;