"use client";

import { useState, useEffect, useCallback } from "react";
import { secureStorage } from "@/lib/secureStorage";
import {
  Folder,
  FolderPlus,
  Plus,
  Layers,
  Check,
  X,
  Loader2,
  FolderOpen,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import type { ProjectResponse } from "@/lib/types";

interface ProjectSwitcherProps {
  managerId: string;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
}

const COLOR_OPTIONS = [
  { value: "#8B6FBD", label: "Lavender" },
  { value: "#E06D83", label: "Rose" },
  { value: "#C3B1E1", label: "Blush Purple" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#EC4899", label: "Pink" },
  { value: "#10B981", label: "Emerald" },
  { value: "#F59E0B", label: "Amber" },
];

export default function ProjectSwitcher({
  managerId: propManagerId,
  selectedProjectId,
  onSelectProject,
}: ProjectSwitcherProps) {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // Rename state
  const [renamingProject, setRenamingProject] = useState<ProjectResponse | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  // Delete state
  const [deletingProject, setDeletingProject] = useState<ProjectResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const getEffectiveManagerId = useCallback(() => {
    return propManagerId || secureStorage.getItem("balance_manager_id") || "";
  }, [propManagerId]);

  const loadProjects = useCallback(() => {
    const mId = getEffectiveManagerId();
    if (!mId) return;
    setIsLoading(true);
    fetch(`/api/projects?managerId=${encodeURIComponent(mId)}`)
      .then(async (r) => {
        if (!r.ok) return [];
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [getEffectiveManagerId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const openModal = () => {
    setName("");
    setDescription("");
    setColor(COLOR_OPTIONS[0].value);
    setError("");
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    const mId = getEffectiveManagerId();
    setIsCreating(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId: mId,
          name: name.trim(),
          description: description.trim() || null,
          color,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || `HTTP ${res.status}`);
      }

      const newProj: ProjectResponse = await res.json();
      setProjects((prev) => [newProj, ...prev]);
      onSelectProject(newProj.id);
      setShowModal(false);
    } catch (err: any) {
      console.error("[ProjectSwitcher] create error:", err);
      setError(err?.message || "Failed to create project.");
    } finally {
      setIsCreating(false);
    }
  };

  // Rename project handler
  const handleRename = async () => {
    if (!renamingProject || !renameValue.trim()) return;
    const mId = getEffectiveManagerId();
    setIsRenaming(true);
    setRenameError("");
    try {
      const res = await fetch(`/api/projects?id=${renamingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: mId, name: renameValue.trim() }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const updated: ProjectResponse = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setRenamingProject(null);
    } catch (err: any) {
      setRenameError(err?.message || "Failed to rename project.");
    } finally {
      setIsRenaming(false);
    }
  };

  // Delete project handler
  const handleDelete = async () => {
    if (!deletingProject) return;
    const mId = getEffectiveManagerId();
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(
        `/api/projects?id=${deletingProject.id}&managerId=${encodeURIComponent(mId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      // Remove from list and deselect if it was selected
      setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
      if (selectedProjectId === deletingProject.id) onSelectProject(null);
      setDeletingProject(null);
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete project.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="shrink-0 flex items-center gap-1.5 text-[11px] font-extrabold text-[#665578] uppercase tracking-wider mr-1">
          <Layers className="w-3.5 h-3.5 text-[#8B6FBD]" />
          Project Workspace:
        </span>

        <button
          onClick={() => onSelectProject(null)}
          className={`shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
            selectedProjectId === null
              ? "bg-[#8B6FBD] text-white border-[#8B6FBD] shadow-md shadow-[#8B6FBD]/30"
              : "bg-white text-[#241830] border-[#F5BEC6] hover:bg-[#FCE4E8]"
          }`}
        >
          {selectedProjectId === null ? (
            <FolderOpen className="w-3.5 h-3.5" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-[#8B6FBD]" />
          )}
          All Projects
        </button>

        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#665578]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8B6FBD]" />
            <span>Loading...</span>
          </div>
        )}

        {projects.map((proj) => {
          const isSelected = selectedProjectId === proj.id;
          return (
            <div key={proj.id} className="relative group/proj">
              <button
                onClick={() => onSelectProject(isSelected ? null : proj.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
                  isSelected
                    ? "bg-[#8B6FBD] text-white border-[#8B6FBD] shadow-md shadow-[#8B6FBD]/30"
                    : "bg-white text-[#241830] border-[#F5BEC6] hover:bg-[#FCE4E8]"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: proj.color || "#8B6FBD" }}
                />
                {proj.name}
                {isSelected && <Check className="w-3 h-3 ml-0.5" />}
              </button>
              {/* Hover action buttons: rename + delete */}
              <div className="absolute -top-2 -right-1 flex gap-0.5 opacity-0 group-hover/proj:opacity-100 transition-all">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingProject(proj);
                    setRenameValue(proj.name);
                    setRenameError("");
                  }}
                  title="Rename workspace"
                  className="w-5 h-5 rounded-full bg-white border border-[#F5BEC6] text-[#665578] hover:text-[#8B6FBD] hover:border-[#8B6FBD] flex items-center justify-center shadow-sm transition-all"
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingProject(proj);
                    setDeleteError("");
                  }}
                  title="Delete workspace"
                  className="w-5 h-5 rounded-full bg-white border border-[#F5BEC6] text-[#665578] hover:text-[#E06D83] hover:border-[#E06D83] flex items-center justify-center shadow-sm transition-all"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={openModal}
          className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-white border border-dashed border-[#F5BEC6] text-[#8B6FBD] hover:bg-[#FCE4E8] transition-all duration-200 ml-1"
        >
          <Plus className="w-3.5 h-3.5 text-[#8B6FBD]" />
          New Project
        </button>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(36, 24, 48, 0.6)", backdropFilter: "blur(12px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-[#F5BEC6] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F5BEC6]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FCE4E8] border border-[#F5BEC6] flex items-center justify-center text-[#8B6FBD]">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#241830]">Create Project Workspace</h3>
                  <p className="text-[11px] text-[#665578]">Group 1:1 sessions by team or initiative</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#665578] hover:text-[#241830] hover:bg-[#FCE4E8] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-[#241830] uppercase tracking-wider flex items-center gap-1">
                  Project Name
                  <span className="text-[#E06D83]">*</span>
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. Q3 Engineering Core"
                  className="w-full h-10 px-3.5 text-xs font-bold text-[#241830] placeholder-[#8E7E9E] rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] focus:outline-none focus:ring-2 focus:ring-[#8B6FBD] transition-all"
                />
                {error && (
                  <p className="text-[11px] text-[#E06D83] font-bold">{error}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-[#241830] uppercase tracking-wider">
                  Description
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Backend architecture & API syncs"
                  className="w-full h-10 px-3.5 text-xs font-bold text-[#241830] placeholder-[#8E7E9E] rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] focus:outline-none focus:ring-2 focus:ring-[#8B6FBD] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-[#241830] uppercase tracking-wider">
                  Color Badge
                </label>
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  {COLOR_OPTIONS.map(({ value: c, label }) => (
                    <button
                      key={c}
                      type="button"
                      title={label}
                      onClick={() => setColor(c)}
                      className="relative w-7 h-7 rounded-full transition-all duration-200 flex items-center justify-center"
                      style={{
                        backgroundColor: c,
                        transform: color === c ? "scale(1.25)" : "scale(1)",
                        boxShadow: color === c ? `0 0 12px ${c}80, 0 0 0 2px white` : "none",
                      }}
                    >
                      {color === c && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#F5BEC6]">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#665578] hover:text-[#241830] border border-[#F5BEC6] hover:bg-[#FCE4E8] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || !name.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#8B6FBD] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-md shadow-[#8B6FBD]/30"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-3.5 h-3.5" />
                    Create Workspace
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal (Bug 1.5 fix) */}
      {renamingProject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(36, 24, 48, 0.6)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setRenamingProject(null); }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-[#F5BEC6] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F5BEC6]">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#8B6FBD]" />
                <h3 className="text-sm font-extrabold text-[#241830]">Rename Workspace</h3>
              </div>
              <button
                onClick={() => setRenamingProject(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#665578] hover:text-[#241830] hover:bg-[#FCE4E8] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-[#241830] uppercase tracking-wider">New Name</label>
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => { setRenameValue(e.target.value); setRenameError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenamingProject(null); }}
                  className="w-full h-10 px-3.5 text-xs font-bold text-[#241830] placeholder-[#8E7E9E] rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] focus:outline-none focus:ring-2 focus:ring-[#8B6FBD] transition-all"
                  placeholder="New workspace name…"
                />
                {renameError && <p className="text-[11px] text-[#E06D83] font-bold">{renameError}</p>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#F5BEC6]">
              <button
                onClick={() => setRenamingProject(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#665578] hover:text-[#241830] border border-[#F5BEC6] hover:bg-[#FCE4E8] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={isRenaming || !renameValue.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#8B6FBD] transition-all disabled:opacity-40 hover:scale-105 active:scale-95 shadow-md shadow-[#8B6FBD]/30"
              >
                {isRenaming ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</> : <><Check className="w-3.5 h-3.5" />Save Name</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {deletingProject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(36, 24, 48, 0.65)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingProject(null); }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-[#F5BEC6] bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F5BEC6]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFE3E8] border border-[#F5BEC6] flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-[#E06D83]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#241830]">Delete Workspace?</h3>
                  <p className="text-[11px] text-[#665578] mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingProject(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#665578] hover:text-[#241830] hover:bg-[#FCE4E8] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="p-4 bg-[#FFF4F6] rounded-2xl border border-[#F5BEC6] flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-[#E06D83] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-[#241830]">
                    Delete &ldquo;{deletingProject.name}&rdquo;?
                  </p>
                  <p className="text-[11px] text-[#665578] leading-relaxed font-semibold">
                    All sessions inside this workspace will be unlinked (not deleted) and moved to
                    &ldquo;All Projects&rdquo;. The workspace itself will be permanently removed.
                  </p>
                </div>
              </div>
              {deleteError && (
                <p className="text-[11px] text-[#E06D83] font-bold bg-[#FFE3E8] px-3 py-2 rounded-xl">
                  {deleteError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#F5BEC6]">
              <button
                onClick={() => setDeletingProject(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#665578] hover:text-[#241830] border border-[#F5BEC6] hover:bg-[#FCE4E8] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#E06D83] transition-all disabled:opacity-40 hover:scale-105 active:scale-95 shadow-md shadow-[#E06D83]/30"
              >
                {isDeleting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Deleting…</>
                ) : (
                  <><Trash2 className="w-3.5 h-3.5" />Yes, Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
