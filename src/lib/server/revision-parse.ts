import { isRejectReasonCode, isWorkSection } from "@/lib/works/constants";
import { isVideoAspectRatio } from "@/lib/works/aspect-ratio";
import type {
  PromoPendingRevision,
  RevisionReviewStatus,
  StreamStatus,
  WorkPendingRevision,
} from "@/types/work";

function parseRevisionStatus(raw: unknown): "draft" | "pending" | "rejected" {
  if (raw === "pending" || raw === "rejected") return raw;
  return "draft";
}

export function parseWorkPendingRevision(data: Record<string, unknown>): WorkPendingRevision | undefined {
  const rev = data.pendingRevision;
  if (!rev || typeof rev !== "object") return undefined;
  const r = rev as Record<string, unknown>;
  const sectionRaw = r.section;
  const tags = r.proposedTags;
  const code = r.rejectReasonCode;
  return {
    platformStatus: parseRevisionStatus(r.platformStatus),
    streamUid: r.streamUid ? String(r.streamUid) : undefined,
    streamStatus: r.streamStatus as StreamStatus | undefined,
    section:
      typeof sectionRaw === "string" && isWorkSection(sectionRaw) ? sectionRaw : undefined,
    title: r.title ? String(r.title) : undefined,
    description: r.description ? String(r.description) : undefined,
    director: r.director ? String(r.director) : undefined,
    proposedCategory: r.proposedCategory ? String(r.proposedCategory) : undefined,
    proposedTags: Array.isArray(tags) ? tags.map((x) => String(x)).filter(Boolean) : undefined,
    proposedAspectRatio:
      typeof r.proposedAspectRatio === "string" && isVideoAspectRatio(r.proposedAspectRatio)
        ? r.proposedAspectRatio
        : undefined,
    rejectReason: r.rejectReason ? String(r.rejectReason) : undefined,
    rejectReasonCode:
      typeof code === "string" && isRejectReasonCode(code) ? code : undefined,
    submittedAt: r.submittedAt,
    updatedAt: r.updatedAt,
  };
}

export function parsePromoPendingRevision(data: Record<string, unknown>): PromoPendingRevision | undefined {
  const rev = data.pendingRevision;
  if (!rev || typeof rev !== "object") return undefined;
  const r = rev as Record<string, unknown>;
  return {
    platformStatus: parseRevisionStatus(r.platformStatus),
    streamUid: r.streamUid ? String(r.streamUid) : undefined,
    streamStatus: r.streamStatus as StreamStatus | undefined,
    clipStartSec: typeof r.clipStartSec === "number" ? r.clipStartSec : 0,
    clipEndSec: typeof r.clipEndSec === "number" ? r.clipEndSec : 0,
    title: r.title ? String(r.title) : undefined,
    description: r.description ? String(r.description) : undefined,
    rejectReason: r.rejectReason ? String(r.rejectReason) : undefined,
    submittedAt: r.submittedAt,
    updatedAt: r.updatedAt,
  };
}

export function parseRevisionReviewStatus(data: Record<string, unknown>): RevisionReviewStatus | undefined {
  const s = data.revisionReviewStatus;
  return s === "pending" || s === "rejected" ? s : undefined;
}
