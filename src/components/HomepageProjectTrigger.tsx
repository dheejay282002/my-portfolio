"use client";

import { useState } from "react";
import { ClipboardEdit } from "lucide-react";
import ProjectRequestModal from "./ProjectRequestModal";

export default function HomepageProjectTrigger() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 left-6 z-[100]">
        <button
          onClick={() => setShowModal(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 transition-transform hover:scale-105"
          title="Request a Project"
        >
          <ClipboardEdit className="h-6 w-6" />
        </button>
      </div>
      <ProjectRequestModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
