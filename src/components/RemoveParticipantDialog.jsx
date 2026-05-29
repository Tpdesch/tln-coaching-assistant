import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function RemoveParticipantDialog({ client, coachProfileId, onClose, onRemoved }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRemove = async () => {
    if (client.coach_id !== coachProfileId) {
      setError("You are not authorized to remove this participant.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Set client status to inactive — preserves all records
      await base44.entities.Client.update(client.id, {
        coaching_status: "inactive",
        status: "inactive",
      });
      onRemoved?.();
      onClose();
    } catch (e) {
      setError(e.message || "Failed to remove participant.");
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Remove Participant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-900 mb-1">
              Remove this participant from active coaching?
            </p>
            <p className="text-sm text-amber-800">
              Their historical data will be preserved and can be restored later.
            </p>
          </div>

          <p className="text-sm text-gray-600">
            <span className="font-medium">{client.full_name}</span> will be moved to inactive status.
            They will no longer appear in your active client lists or dashboard metrics,
            but all check-ins and coaching history will be retained.
          </p>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleRemove}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Removing…" : "Remove Participant"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}