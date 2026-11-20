export interface ConflictInput {
  remoteVersion?: number | string | null;
  localVersion?: number | string | null;
  remoteTimestamp?: Date | string | null;
  lastSyncedAt?: Date | string | null;
  receivedAt: Date | string;
  now?: Date | string;
}

export interface ConflictResult {
  apply: boolean;
  reason: string;
  effectiveTimestamp: Date;
  skewed: boolean;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function shouldApplyIncoming(input: ConflictInput): ConflictResult {
  const now = toDate(input.now) || new Date();
  const receivedAt = toDate(input.receivedAt) || now;
  const rawRemote = toDate(input.remoteTimestamp) || receivedAt;
  const skewLimit = new Date(receivedAt.getTime() + 5 * 60 * 1000);
  const skewed = rawRemote.getTime() > skewLimit.getTime();
  const effectiveTimestamp = skewed ? receivedAt : rawRemote;

  const remoteVersion = toNumber(input.remoteVersion);
  const localVersion = toNumber(input.localVersion);

  if (remoteVersion !== null && localVersion !== null) {
    if (remoteVersion > localVersion) {
      return { apply: true, reason: "remote_version_newer", effectiveTimestamp, skewed };
    }
    return { apply: false, reason: remoteVersion === localVersion ? "version_tie" : "remote_version_older", effectiveTimestamp, skewed };
  }

  const baseline = toDate(input.lastSyncedAt);
  if (!baseline) {
    return { apply: true, reason: "no_baseline", effectiveTimestamp, skewed };
  }
  if (effectiveTimestamp.getTime() > baseline.getTime()) {
    return { apply: true, reason: "remote_timestamp_newer", effectiveTimestamp, skewed };
  }
  return { apply: false, reason: "remote_timestamp_not_newer", effectiveTimestamp, skewed };
}

export function isSkewedTimestamp(
  remoteTimestamp: Date | string | null | undefined,
  receivedAt: Date | string,
): boolean {
  const remote = toDate(remoteTimestamp);
  const received = toDate(receivedAt);
  if (!remote || !received) return false;
  return remote.getTime() > received.getTime() + 5 * 60 * 1000;
}
