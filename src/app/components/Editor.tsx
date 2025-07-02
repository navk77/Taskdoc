"use client";
import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, ButtonGroup, Dropdown, Badge, Alert } from "react-bootstrap";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import api from "../lib/api";
import CollectionSelector from "./CollectionSelector";

interface Collection {
  id: number;
  name: string;
  color: string;
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

interface EditorProps {
  selectedDocumentId: number | null;
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
}

const Editor: React.FC<EditorProps> = ({ selectedDocumentId, documents, setDocuments }) => {
  const [title, setTitle] = useState("");
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);

  const router = useRouter();

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setHasUnsavedChanges(true);
      setWordCount(editor.storage.characterCount?.words() || 0);
    },
    editorProps: {
      attributes: {
        class: "p-4",
        style: "min-height: 400px; background-color: #fff; color: #000;",
      },
    },
  });

  const currentDoc = documents.find((doc) => doc.id === selectedDocumentId);

  useEffect(() => {
    if (currentDoc && editor) {
      setTitle(currentDoc.title);
      editor.commands.setContent(currentDoc.content || "");
      setCollectionId(currentDoc.collectionId);
      setLastSaved(new Date(currentDoc.updatedAt));
      setHasUnsavedChanges(false);
      setWordCount(editor.storage.characterCount?.words() || 0);
    } else if (editor) {
      setTitle("");
      editor.commands.setContent("");
      setCollectionId(null);
      setLastSaved(null);
      setHasUnsavedChanges(false);
    }
  }, [selectedDocumentId, editor]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleCollectionChange = (newCollectionId: number | null) => {
    setCollectionId(newCollectionId);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!selectedDocumentId || !editor) return;

    setIsSaving(true);
    try {
      const content = editor.getHTML();
      const res = await api.put(`/api/pages/${selectedDocumentId}`, {
        title: title.trim() || "Untitled Document",
        content,
        collectionId,
      });

      setDocuments((prev) =>
        prev.map((doc) => (doc.id === selectedDocumentId ? res.data : doc))
      );

      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!selectedDocumentId || !editor) return;

    setIsPublishing(true);
    try {
      const content = editor.getHTML();

      let res;
      if (currentDoc?.published) {
        res = await api.put(`/api/pages/${selectedDocumentId}`, {
          title,
          content,
          published: false,
          collectionId,
        });
      } else {
        await api.put(`/api/pages/${selectedDocumentId}`, {
          title,
          content,
          collectionId,
        });
        res = await api.post(`/api/pages/${selectedDocumentId}/publish`);
      }

      setDocuments((prev) =>
        prev.map((doc) => (doc.id === selectedDocumentId ? res.data : doc))
      );

      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Publish error:", err);
      alert("Failed to toggle publish");
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    if (!hasUnsavedChanges || !selectedDocumentId) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 30000); // 30s auto-save

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, selectedDocumentId, title]);

  const addLink = () => {
    const url = window.prompt("Enter link:");
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  };

  if (!selectedDocumentId) {
    return (
      <div className="p-4 text-center text-muted">
        <h4>No document selected</h4>
        <p>Select a document from the sidebar to start editing.</p>
      </div>
    );
  }

  if (!editor) {
    return <div className="p-4">Loading editor...</div>;
  }

  return (
    <div className="h-100 d-flex flex-column">
      {/* Header */}
      <div className="border-bottom p-3">
        <Row className="align-items-center">
          <Col md={8}>
            <Form.Control
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Document Title"
              className="fs-4 border-0 p-0 fw-bold"
              style={{ backgroundColor: "#fff", color: "#000", boxShadow: "none" }}
            />
          </Col>
          <Col md={4} className="text-end d-flex align-items-center justify-content-end gap-2">
            <CollectionSelector
              pageId={selectedDocumentId}
              currentCollectionId={collectionId}
              onCollectionChange={handleCollectionChange}
            />
            {hasUnsavedChanges && <small className="text-warning">● Unsaved</small>}
            {currentDoc?.published && <Badge bg="success">Published</Badge>}
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant={currentDoc?.published ? "outline-warning" : "success"}
              size="sm"
              onClick={handlePublishToggle}
              disabled={isPublishing}
            >
              {isPublishing ? "Publishing..." : currentDoc?.published ? "Unpublish" : "Publish"}
            </Button>
          </Col>
        </Row>
      </div>

      {/* Toolbar */}
      <div className="border-bottom p-2 bg-light">
        <div className="d-flex flex-wrap gap-1">
          {/* Bold, Italic, etc. */}
          <ButtonGroup size="sm">
            <Button variant={editor.isActive("bold") ? "primary" : "outline-secondary"} onClick={() => editor.chain().focus().toggleBold().run()}>B</Button>
            <Button variant={editor.isActive("italic") ? "primary" : "outline-secondary"} onClick={() => editor.chain().focus().toggleItalic().run()}>I</Button>
            <Button variant={editor.isActive("strike") ? "primary" : "outline-secondary"} onClick={() => editor.chain().focus().toggleStrike().run()}>S</Button>
          </ButtonGroup>

          <Dropdown as={ButtonGroup} size="sm">
            <Dropdown.Toggle variant="outline-secondary">Heading</Dropdown.Toggle>
            <Dropdown.Menu>
              {[1, 2, 3].map(level => (
                <Dropdown.Item key={level} onClick={() => editor.chain().focus().toggleHeading({ level }).run()}>Heading {level}</Dropdown.Item>
              ))}
              <Dropdown.Item onClick={() => editor.chain().focus().setParagraph().run()}>Normal</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <ButtonGroup size="sm">
            <Button variant="outline-secondary" onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</Button>
            <Button variant="outline-secondary" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</Button>
            <Button variant="outline-secondary" onClick={() => editor.chain().focus().toggleTaskList().run()}>☐ Task</Button>
          </ButtonGroup>

          <ButtonGroup size="sm">
            <Button variant="outline-secondary" onClick={addLink}>🔗</Button>
            <Button variant="outline-secondary" onClick={addImage}>🖼</Button>
          </ButtonGroup>

          <ButtonGroup size="sm">
            <Button variant="outline-secondary" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>↶</Button>
            <Button variant="outline-secondary" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>↷</Button>
          </ButtonGroup>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-grow-1 overflow-auto p-3">
        <EditorContent editor={editor} />
      </div>

      {/* Footer */}
      <div className="border-top px-3 py-2 bg-light d-flex justify-content-between">
        <small className="text-muted">
          Last saved: {lastSaved?.toLocaleString() || "Never"}
        </small>
        <small className="text-muted">
          Words: {wordCount} | Characters: {editor.storage.characterCount?.characters() || 0}
        </small>
      </div>
    </div>
  );
};

export default Editor;
