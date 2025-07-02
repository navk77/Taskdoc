'use client';
import React from 'react';
import { Button, Navbar } from 'react-bootstrap';

interface TopbarProps {
  onCreateNew: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onCreateNew }) => {
  return (
    <Navbar bg="light" className="px-3">
      <Navbar.Brand>TaskDoc</Navbar.Brand>
      <Button variant="outline-primary" onClick={onCreateNew}>
        + New
      </Button>
    </Navbar>
  );
};

export default Topbar;

