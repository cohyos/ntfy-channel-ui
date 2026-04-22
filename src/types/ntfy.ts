export type Priority = 1 | 2 | 3 | 4 | 5;

export interface Attachment {
  name: string;
  url: string;
  type?: string;
  size?: number;
  expires?: number;
}

export type NtfyEventType = 'message' | 'keepalive' | 'open' | 'poll_request';

export interface NtfyMessage {
  id: string;
  time: number;
  event: NtfyEventType;
  topic: string;
  title?: string;
  message?: string;
  priority?: Priority;
  tags?: string[];
  attachment?: Attachment;
  expires?: number;
}

export interface PublishOptions {
  title?: string;
  tags?: string[];
  priority?: Priority;
  message?: string;
  filename?: string;
}

export interface ParsedRouting {
  from: string | null;
  to: string | null;
  subject: string;
}
