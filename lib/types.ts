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
  fg_color: string;
  bg_color: string;
  dot_style: string;
  corner_style: string;
  logo_url: string | null;
  frame_style: string;
  frame_color: string;
  frame_text: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface DesignTemplate {
  id: string;
  workspace_id: string;
  name: string;
  settings: {
    fg_color?: string;
    bg_color?: string;
    dot_style?: string;
    corner_style?: string;
    frame_style?: string;
    frame_color?: string;
    frame_text?: string;
  };
  created_at: string;
}

export interface LogoAsset {
  id: string;
  workspace_id: string;
  name: string;
  data_url: string;
  created_at: string;
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
