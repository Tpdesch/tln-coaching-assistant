import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

/**
 * Shown once when a coach has no display_name set.
 * Saves to Profiles and calls onSaved(displayName) on success.
 */
export default function CoachDisplayNamePrompt({ profileId, fallbackName = "", onSaved }) {
  const [name, setName] = useState(fallbackName);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    await base44.entities.Profiles.update(profileId, { display_name: trimmed });
    onSaved(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">What should we call you?</h2>
        <p className="text-sm text-gray-500 mb-5">
          Enter your preferred display name. This is what participants and your dashboard greeting will use.
        </p>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Tom Desch"
            autoFocus
            required
          />
          <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={saving || !name.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save & Continue
          </Button>
        </form>
      </div>
    </div>
  );
}