export type CodeStatus = "active" | "paused" | "archived";
export type CodeType = "dynamic" | "static";
export type LifecycleStage =
  | "new"
  | "activated"
  | "habit"
  | "expansion"
  | "dormant";

export interface Code {
  id: string;
  workspace_id: string;
  slug: string;
  title: string;
  destination_url: string;
  type: CodeType;
  status: CodeStatus;
  lifecycle_stage: LifecycleStage;
  scan_count: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface Scan {
  id: string;
  code_id: string;
  workspace_id: string;
  scanned_at: string;
  device_type: string | null;
  referrer: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  user_agent: string | null;
}
