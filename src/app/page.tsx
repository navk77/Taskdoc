"use client";
import React, { useState } from "react";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import api from "./lib/api";

interface Collection {
  id: number;
  name: string;
  description: string | null;
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

export default function HomePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);

  const handleCreateNew = async () => {
    try {
      const newDoc = await api.post("/api/pages", {
        title: "Untitled Document",
        content: "",
      });
      
      setDocuments((prev) => [newDoc.data, ...prev]);
      setSelectedDocumentId(newDoc.data.id);
    } catch (error) {
      console.error("Error creating new document:", error);
      alert("Failed to create new document");
    }
  };

  return (
    <div className="d-flex flex-column vh-100" style={{ backgroundColor: "#fff" }}>
      {/* Topbar */}
      <Topbar onCreateNew={handleCreateNew} />

      {/* Main Layout */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* Sidebar */}
        <div className="border-end bg-light" style={{ width: "280px", overflowY: "auto" }}>
          <Sidebar
            documents={documents}
            selectedDocumentId={selectedDocumentId}
            setSelectedDocumentId={setSelectedDocumentId}
            setDocuments={setDocuments}
          />
        </div>

        {/* Editor */}
        <div className="flex-grow-1 p-3 overflow-auto">
          <Editor
            selectedDocumentId={selectedDocumentId}
            documents={documents}
            setDocuments={setDocuments}
          />
        </div>
      </div>
    </div>
  );
}