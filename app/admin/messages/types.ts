export interface Profile {
  id: string;
  name: string;
  email?: string;
}

export interface MessageReply {
  id: string;
  message_id: string;
  user_id: string;
  reply_text: string;
  created_at: string;
  formatted_time?: string;
  is_from_user: boolean;
  admin?: Profile;
}

export interface Message {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  created_at: string;
  formatted_time?: string;
  replies?: MessageReply[];
  is_read?: boolean;
  profiles: {
    id?: string;
    name?: string;
    email?: string;
  };
}

export interface ThreadMessage extends Message {
  isAdmin: boolean;
}

export interface ThreadReply extends MessageReply {
  isAdmin: boolean;
  message: string; // For compatibility with the thread display
} 