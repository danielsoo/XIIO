"use client";

import type { DirectorNameChangeRequest } from "@/types/user";

type Props = {
  title: string;
  requestedLabel: string;
  reasonLabel: string;
  noteLabel: string;
  approveLabel: string;
  rejectLabel: string;
  processingLabel: string;
  superOnlyLabel: string;
  request: DirectorNameChangeRequest;
  formatRequested: (name: string) => string;
  isSuperAdmin: boolean;
  adminNote: string;
  onAdminNote: (v: string) => void;
  actionBusy: boolean;
  actionErr: string | null;
  onApprove: () => void;
  onReject: () => void;
};

export default function AdminProfileChangeRequestPanel({
  title,
  requestedLabel,
  reasonLabel,
  noteLabel,
  approveLabel,
  rejectLabel,
  processingLabel,
  superOnlyLabel,
  request,
  formatRequested,
  isSuperAdmin,
  adminNote,
  onAdminNote,
  actionBusy,
  actionErr,
  onApprove,
  onReject,
}: Props) {
  return (
    <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 mb-6 space-y-4">
      <h2 className="text-white font-semibold">{title}</h2>
      <div>
        <p className="text-xs text-xiio-muted">{requestedLabel}</p>
        <p className="text-sm text-white mt-0.5">{formatRequested(request.requestedName)}</p>
      </div>
      {request.reason && (
        <div>
          <p className="text-xs text-xiio-muted">{reasonLabel}</p>
          <p className="text-sm text-white mt-0.5">{request.reason}</p>
        </div>
      )}
      {isSuperAdmin ? (
        <>
          <div>
            <label className="block text-xs text-xiio-muted mb-1.5">{noteLabel}</label>
            <input
              type="text"
              value={adminNote}
              onChange={(e) => onAdminNote(e.target.value)}
              disabled={actionBusy}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-xiio-accent"
              maxLength={500}
            />
          </div>
          {actionErr && <p className="text-red-400 text-sm">{actionErr}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={actionBusy}
              onClick={onApprove}
              className="px-4 py-2 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-40 text-white text-sm font-medium"
            >
              {actionBusy ? processingLabel : approveLabel}
            </button>
            <button
              type="button"
              disabled={actionBusy}
              onClick={onReject}
              className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 disabled:opacity-40 text-sm"
            >
              {rejectLabel}
            </button>
          </div>
        </>
      ) : (
        <p className="text-xs text-xiio-muted">{superOnlyLabel}</p>
      )}
    </section>
  );
}
