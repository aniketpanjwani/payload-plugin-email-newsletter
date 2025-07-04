export interface Channel {
  id: string;
  name: string;
  description?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  providerId: string;
  providerType: 'broadcast' | 'resend';
  subscriberCount?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChannelInput {
  name: string;
  description?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
}

export interface UpdateChannelInput {
  name?: string;
  description?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  active?: boolean;
}

export interface ListChannelsOptions {
  limit?: number;
  offset?: number;
  active?: boolean;
}

export interface ListChannelsResponse {
  channels: Channel[];
  total: number;
  limit: number;
  offset: number;
}