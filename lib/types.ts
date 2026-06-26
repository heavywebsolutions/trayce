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
  action_type: string;
  content_type: string;
  content: Record<string, string>;
  lead_headline: string;
  lead_subtext: string;
  lead_button: string;
  lead_collect_name: boolean;
  lead_collect_phone: boolean;
  lead_success_message: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface BioPage {
  id: string;
  workspace_id: string;
  handle: string;
  custom_domain: string | null;
  display_name: string;
  tagline: string;
  avatar_url: string | null;
  bg_image_url: string | null;
  bg_fit: string;
  framed: boolean;
  panel_color: string;
  bg_color: string;
  accent_color: string;
  button_text_color: string;
  font_family: string;
  socials: Record<string, string>;
  views: number;
  published: boolean;
  paused: boolean;
  created_at: string;
  updated_at: string;
}

export interface BioProduct {
  handle: string;
  title: string;
  image: string | null;
  price: string | null;
  currency: string | null;
  url: string;
}

export interface BioLinkConfig {
  button?: string;
  success?: string;
  collect_name?: boolean;
  collect_phone?: boolean;
  product?: BioProduct;
}

export interface BioLink {
  id: string;
  page_id: string;
  workspace_id: string;
  kind: string; // 'link' | 'header' | 'video' | 'subscribe' | 'text' | 'image' | 'form'
  title: string;
  url: string;
  thumbnail_url: string | null;
  thumbnail_auto: boolean;
  config: BioLinkConfig;
  position: number;
  clicks: number;
  hidden: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  code_id: string | null;
  page_id: string | null;
  bio_link_id: string | null;
  source: string | null;
  workspace_id: string;
  email: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  created_at: string;
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

export interface BookingLink {
  id: string;
  workspace_id: string;
  name: string;
  destination_url: string;
  capture_lead: boolean;
  capture_collect_phone: boolean;
  avg_value_cents: number | null;
  status: CodeStatus;
  tap_count: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface BookingPlacement {
  id: string;
  booking_link_id: string;
  workspace_id: string;
  label: string;
  channel: string;
  slug: string;
  status: CodeStatus;
  tap_count: number;
  created_at: string;
  archived_at: string | null;
}
