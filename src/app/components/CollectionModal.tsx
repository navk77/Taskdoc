"use client";
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import api from "../lib/api";

interface Collection {
  id: number;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface CollectionModalProps {
  show: boolean;
  onHide: () => void;
  onCollectionCreated: (collection: Collection) => void;
  editingCollection?: Collection | null;
}

const CollectionModal: React.FC<CollectionModalProps> = ({
  show,
  onHide,
  onCollectionCreated,
  editingCollection,
}) => {
  const [name, setName] = useState(editingCollection?.name || "");
  const [description, setDescription] = useState(editingCollection?.description || "");
  const [color, setColor] = useState(editingCollection?.color || "#007bff");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      let response;
      if (editingCollection) {
        response = await api.put(`/api/collections/${editingCollection.id}`, {
          name: name.trim(),
          description: description.trim() || null,
          color,
        });
      } else {
        response = await api.post("/api/collections", {
          name: name.trim(),
          description: description.trim() || null,
          color,
        });
      }

      onCollectionCreated(response.data);
      handleClose();
    } catch (error) {
      console.error("Error saving collection:", error);
      alert("Failed to save collection");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setColor("#007bff");
    onHide();
  };

  // Reset form when editing collection changes
  React.useEffect(() => {
    if (editingCollection) {
      setName(editingCollection.name);
      setDescription(editingCollection.description || "");
      setColor(editingCollection.color);
    } else {
      setName("");
      setDescription("");
      setColor("#007bff");
    }
  }, [editingCollection]);

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {editingCollection ? "Edit Collection" : "Create New Collection"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Collection Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter collection name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Description (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter collection description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Color</Form.Label>
            <div className="d-flex align-items-center gap-2">
              <Form.Control
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: "50px", height: "38px" }}
              />
              <Form.Control
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#007bff"
              />
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : editingCollection ? "Update" : "Create"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CollectionModal;