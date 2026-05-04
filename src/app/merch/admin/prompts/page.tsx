"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

type PromptType = "sticker" | "sticker_embroidery" | "patch" | "embroidered" | "closeup";

const PROMPT_TYPES: { value: PromptType; label: string }[] = [
  { value: "sticker", label: "Regular Sticker" },
  { value: "sticker_embroidery", label: "Embroidery Sticker" },
  { value: "patch", label: "Patch" },
  { value: "embroidered", label: "Embroidered on Clothing" },
  { value: "closeup", label: "Close-up" },
];

const VARIABLES_REF = [
  "{design_description}",
  "{clothing_name}",
  "{placement}",
  "{size}",
  "{custom_position}",
  "{fabric_type}",
  "{background}",
];

const DEFAULT_TEMPLATES: { type: PromptType; name: string; template: string }[] = [
  {
    type: "sticker",
    name: "Default Sticker",
    template: "Die-cut sticker of this design with thin white outline border on {background}. Flat product photography.",
  },
  {
    type: "sticker_embroidery",
    name: "Default Embroidery Sticker",
    template: "Die-cut sticker that looks like an embroidered patch with thread texture and satin stitch border on {background}.",
  },
  {
    type: "patch",
    name: "Default Patch",
    template: "Embroidered iron-on patch of this design with merrowed edge border. Product photography on white background.",
  },
  {
    type: "embroidered",
    name: "Default Embroidered",
    template: "Photorealistic {clothing_name} with this design ({size}) embroidered at {placement}. Thread texture on fabric. Studio lighting.",
  },
  {
    type: "closeup",
    name: "Default Close-up",
    template: "Close-up of embroidered design on {fabric_type} fabric showing thread texture. Macro photography.",
  },
];

export default function PromptsAdminPage() {
  const templates = useQuery(api.promptTemplates.list, {});
  const createTemplate = useMutation(api.promptTemplates.create);
  const updateTemplate = useMutation(api.promptTemplates.update);
  const removeTemplate = useMutation(api.promptTemplates.remove);

  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ type: "sticker" as PromptType, name: "", template: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTemplate(newForm);
    setNewForm({ type: "sticker", name: "", template: "" });
    setCreating(false);
  };

  const handleSeedDefaults = async () => {
    for (const tpl of DEFAULT_TEMPLATES) {
      await createTemplate(tpl);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-colors";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Prompt Templates</h1>

      {/* Variables reference */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <h3 className="mb-2 text-sm font-semibold">Available Variables</h3>
        <div className="flex flex-wrap gap-2">
          {VARIABLES_REF.map((v) => (
            <code key={v} className="rounded bg-background px-2 py-1 text-xs text-secondary">
              {v}
            </code>
          ))}
        </div>
      </div>

      {/* Seed defaults button */}
      {templates && templates.length === 0 && (
        <button
          onClick={handleSeedDefaults}
          className="mb-6 rounded-lg border border-secondary/40 px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/10"
        >
          Seed Default Templates
        </button>
      )}

      {/* Create new */}
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="mb-6 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-background"
        >
          + New Template
        </button>
      ) : (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Type</label>
              <select
                value={newForm.type}
                onChange={(e) => setNewForm((f) => ({ ...f, type: e.target.value as PromptType }))}
                className={inputCls}
              >
                {PROMPT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Name</label>
              <input
                type="text"
                required
                value={newForm.name}
                onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-muted">Template</label>
            <textarea
              required
              value={newForm.template}
              onChange={(e) => setNewForm((f) => ({ ...f, template: e.target.value }))}
              rows={3}
              className={inputCls + " resize-none font-mono text-xs"}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-background">
              Create
            </button>
            <button type="button" onClick={() => setCreating(false)} className="rounded-lg bg-border px-4 py-2 text-sm text-muted">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Existing templates grouped by type */}
      {!templates ? (
        <div className="text-muted">Loading...</div>
      ) : (
        <div className="space-y-6">
          {PROMPT_TYPES.map((pt) => {
            const group = templates.filter((t) => t.type === pt.value);
            if (group.length === 0) return null;
            return (
              <div key={pt.value}>
                <h3 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">
                  {pt.label}
                </h3>
                <div className="space-y-3">
                  {group.map((tpl) => (
                    <TemplateCard
                      key={tpl._id}
                      template={tpl}
                      onUpdate={(updates) => updateTemplate({ id: tpl._id, ...updates })}
                      onDelete={() => {
                        if (confirm("Delete this template?")) removeTemplate({ id: tpl._id });
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onUpdate,
  onDelete,
}: {
  template: {
    _id: Id<"promptTemplates">;
    name: string;
    template: string;
    active: boolean;
  };
  onUpdate: (updates: { name?: string; template?: string; active?: boolean }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(template.name);
  const [editTemplate, setEditTemplate] = useState(template.template);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  const handleSave = () => {
    onUpdate({ name: editName, template: editTemplate });
    setEditing(false);
  };

  const handleTest = () => {
    const output = editTemplate
      .replace("{design_description}", "a cross with wings")
      .replace("{clothing_name}", "Black Hoodie")
      .replace("{placement}", "left chest")
      .replace("{size}", "large")
      .replace("{custom_position}", "center back")
      .replace("{fabric_type}", "cotton")
      .replace("{background}", "transparent background");
    setTestOutput(output);
  };

  return (
    <div className={`rounded-xl border bg-card p-4 ${template.active ? "border-border" : "border-border/50 opacity-60"}`}>
      {!editing ? (
        <>
          <div className="mb-1 flex items-center gap-2">
            <span className="font-medium">{template.name}</span>
            {!template.active && (
              <span className="rounded bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted">inactive</span>
            )}
          </div>
          <p className="mb-3 font-mono text-xs text-muted">{template.template}</p>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="rounded bg-secondary/20 px-2.5 py-1 text-xs font-medium text-secondary">
              Edit
            </button>
            <button onClick={() => onUpdate({ active: !template.active })} className="rounded bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent">
              {template.active ? "Deactivate" : "Activate"}
            </button>
            <button onClick={onDelete} className="rounded bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400">
              Delete
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          />
          <textarea
            value={editTemplate}
            onChange={(e) => setEditTemplate(e.target.value)}
            rows={3}
            className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-xs resize-none"
          />
          {testOutput && (
            <div className="rounded bg-background p-2 text-xs text-accent">
              <span className="text-[10px] text-muted">Preview: </span>
              {testOutput}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={handleSave} className="rounded bg-secondary px-3 py-1 text-xs font-medium text-background">
              Save
            </button>
            <button onClick={handleTest} className="rounded bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
              Test
            </button>
            <button onClick={() => setEditing(false)} className="rounded bg-border px-3 py-1 text-xs font-medium text-muted">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
