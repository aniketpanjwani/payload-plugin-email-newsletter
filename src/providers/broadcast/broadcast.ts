import type { 
  Broadcast,
  ListBroadcastOptions,
  ListBroadcastResponse,
  CreateBroadcastInput,
  UpdateBroadcastInput,
  SendBroadcastOptions,
  BroadcastAnalytics,
  BroadcastProviderCapabilities,
  Channel,
  CreateChannelInput,
  UpdateChannelInput,
  ListChannelsOptions,
  ListChannelsResponse
} from '../../types'
import { 
  BroadcastProviderError, 
  BroadcastErrorCode,
  BroadcastStatus,
  BaseBroadcastProvider
} from '../../types'
import type { BroadcastProviderConfig } from '../../types'

interface BroadcastApiResponse {
  id: number
  name: string
  subject: string
  preheader?: string
  body: string
  status: string
  track_opens: boolean
  track_clicks: boolean
  html_body: boolean
  reply_to?: string
  total_recipients: number
  sent_at?: string
  scheduled_send_at?: string
  created_at: string
  updated_at: string
}

interface BroadcastListResponse {
  data: BroadcastApiResponse[]
  total: number
}

// Channel API interfaces
interface BroadcastChannelApiResponse {
  id: number
  name: string
  description?: string
  address: string
  from: string
  reply_to?: string
  total_active_subscribers: number
  created_at: string
  updated_at: string
}

export class BroadcastApiProvider extends BaseBroadcastProvider {
  readonly name = 'broadcast'
  private apiUrl: string
  private token: string
  private isDevelopment: boolean

  constructor(config: BroadcastProviderConfig) {
    super(config)
    this.apiUrl = config.apiUrl.replace(/\/$/, '') // Remove trailing slash
    this.isDevelopment = process.env.NODE_ENV !== 'production'
    this.token = this.isDevelopment 
      ? config.tokens.development || config.tokens.production || ''
      : config.tokens.production || config.tokens.development || ''
    
    if (!this.token) {
      throw new BroadcastProviderError(
        'Broadcast API token is required',
        BroadcastErrorCode.CONFIGURATION_ERROR,
        this.name
      )
    }
  }

  // Channel Management Methods
  async listChannels(options?: ListChannelsOptions): Promise<ListChannelsResponse> {
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())

      const response = await fetch(`${this.apiUrl}/api/v1/channels?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      const channels = data.data.map((channel: BroadcastChannelApiResponse) => this.transformChannelFromApi(channel))
      
      return {
        channels,
        total: data.total || channels.length,
        limit: options?.limit || 20,
        offset: options?.offset || 0
      }
    } catch (error: unknown) {
      throw new BroadcastProviderError(
        `Failed to list channels: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async getChannel(id: string): Promise<Channel> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/channels/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new BroadcastProviderError(
            `Channel not found: ${id}`,
            BroadcastErrorCode.CHANNEL_NOT_FOUND,
            this.name
          )
        }
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }

      const channel: BroadcastChannelApiResponse = await response.json()
      return this.transformChannelFromApi(channel)
    } catch (error: unknown) {
      if (error instanceof BroadcastProviderError) throw error
      
      throw new BroadcastProviderError(
        `Failed to get channel: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async createChannel(data: CreateChannelInput): Promise<Channel> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: {
            name: data.name,
            description: data.description,
            from: data.fromName,
            address: data.fromEmail,
            reply_to: data.replyTo
          }
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }

      const channel: BroadcastChannelApiResponse = await response.json()
      return this.transformChannelFromApi(channel)
    } catch (error: unknown) {
      throw new BroadcastProviderError(
        `Failed to create channel: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async updateChannel(id: string, data: UpdateChannelInput): Promise<Channel> {
    try {
      const updateData: any = { channel: {} }
      if (data.name !== undefined) updateData.channel.name = data.name
      if (data.description !== undefined) updateData.channel.description = data.description
      if (data.fromName !== undefined) updateData.channel.from = data.fromName
      if (data.fromEmail !== undefined) updateData.channel.address = data.fromEmail
      if (data.replyTo !== undefined) updateData.channel.reply_to = data.replyTo

      const response = await fetch(`${this.apiUrl}/api/v1/channels/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }

      const channel: BroadcastChannelApiResponse = await response.json()
      return this.transformChannelFromApi(channel)
    } catch (error: unknown) {
      throw new BroadcastProviderError(
        `Failed to update channel: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async deleteChannel(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/channels/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }
    } catch (error: unknown) {
      throw new BroadcastProviderError(
        `Failed to delete channel: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  // Broadcast Management Methods
  async list(options?: ListBroadcastOptions): Promise<ListBroadcastResponse<Broadcast>> {
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())

      const response = await fetch(`${this.apiUrl}/api/v1/broadcasts?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }

      const data: BroadcastListResponse = await response.json()
      
      const broadcasts = data.data.map(broadcast => this.transformBroadcastFromApi(broadcast))
      
      return this.buildListResponse(broadcasts, data.total, options)
    } catch (error: unknown) {
      throw new BroadcastProviderError(
        `Failed to list broadcasts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async get(id: string): Promise<Broadcast> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/broadcasts/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new BroadcastProviderError(
            `Broadcast not found: ${id}`,
            BroadcastErrorCode.NOT_FOUND,
            this.name
          )
        }
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }

      const broadcast: BroadcastApiResponse = await response.json()
      return this.transformBroadcastFromApi(broadcast)
    } catch (error: unknown) {
      if (error instanceof BroadcastProviderError) throw error
      
      throw new BroadcastProviderError(
        `Failed to get broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async create(data: CreateBroadcastInput): Promise<Broadcast> {
    try {
      this.validateRequiredFields(data, ['channelId', 'name', 'subject', 'content'])

      const response = await fetch(`${this.apiUrl}/api/v1/broadcasts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broadcast: {
            channel_id: parseInt(data.channelId), // Broadcast API uses numeric IDs
            name: data.name,
            subject: data.subject,
            preheader: data.preheader,
            body: data.content,
            html_body: true,
            track_opens: data.trackOpens ?? true,
            track_clicks: data.trackClicks ?? true,
            reply_to: data.replyTo,
            segment_ids: data.audienceIds,
          }
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }

      const result = await response.json()
      // Broadcast API returns just {id: 123}, so we need to fetch the full object
      return this.get(result.id.toString())
    } catch (error: unknown) {
      if (error instanceof BroadcastProviderError) throw error
      
      throw new BroadcastProviderError(
        `Failed to create broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async update(id: string, data: UpdateBroadcastInput): Promise<Broadcast> {
    try {
      // First check if the broadcast can be edited
      const existing = await this.get(id)
      if (!this.canEditInStatus(existing.status)) {
        throw new BroadcastProviderError(
          `Cannot update broadcast in status: ${existing.status}`,
          BroadcastErrorCode.INVALID_STATUS,
          this.name
        )
      }

      const response = await fetch(`${this.apiUrl}/api/v1/broadcasts/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broadcast: {
            name: data.name,
            subject: data.subject,
            preheader: data.preheader,
            body: data.content,
            track_opens: data.trackOpens,
            track_clicks: data.trackClicks,
            reply_to: data.replyTo,
            segment_ids: data.audienceIds,
          }
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }

      const broadcast: BroadcastApiResponse = await response.json()
      return this.transformBroadcastFromApi(broadcast)
    } catch (error: unknown) {
      if (error instanceof BroadcastProviderError) throw error
      
      throw new BroadcastProviderError(
        `Failed to update broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // First check if the broadcast can be deleted
      const existing = await this.get(id)
      if (!this.canEditInStatus(existing.status)) {
        throw new BroadcastProviderError(
          `Cannot delete broadcast in status: ${existing.status}`,
          BroadcastErrorCode.INVALID_STATUS,
          this.name
        )
      }

      const response = await fetch(`${this.apiUrl}/api/v1/broadcasts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }
    } catch (error: unknown) {
      if (error instanceof BroadcastProviderError) throw error
      
      throw new BroadcastProviderError(
        `Failed to delete broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async send(id: string, options?: SendBroadcastOptions): Promise<Broadcast> {
    try {
      // Check if we're in test mode
      if (options?.testMode && options.testRecipients?.length) {
        // TODO: Broadcast doesn't have a documented test send API
        // For now, we'll throw an error
        throw new BroadcastProviderError(
          'Test send is not yet implemented for Broadcast provider',
          BroadcastErrorCode.NOT_SUPPORTED,
          this.name
        )
      }

      const response = await fetch(`${this.apiUrl}/api/v1/broadcasts/${id}/send_broadcast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          segment_ids: options?.audienceIds
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }

      // Response includes updated status
      const result = await response.json()
      return this.get(result.id.toString())
    } catch (error: unknown) {
      if (error instanceof BroadcastProviderError) throw error
      
      throw new BroadcastProviderError(
        `Failed to send broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async schedule(id: string, scheduledAt: Date): Promise<Broadcast> {
    try {
      // Update the newsletter with scheduled time
      const response = await fetch(`${this.apiUrl}/api/v1/broadcasts/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broadcast: {
            scheduled_send_at: scheduledAt.toISOString(),
            // TODO: Handle timezone properly
            scheduled_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }

      const broadcast: BroadcastApiResponse = await response.json()
      return this.transformBroadcastFromApi(broadcast)
    } catch (error: unknown) {
      throw new BroadcastProviderError(
        `Failed to schedule broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async cancelSchedule(id: string): Promise<Broadcast> {
    try {
      // Clear the scheduled time
      const response = await fetch(`${this.apiUrl}/api/v1/broadcasts/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broadcast: {
            scheduled_send_at: null,
            scheduled_timezone: null
          }
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }

      const broadcast: BroadcastApiResponse = await response.json()
      return this.transformBroadcastFromApi(broadcast)
    } catch (error: unknown) {
      throw new BroadcastProviderError(
        `Failed to cancel scheduled broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async getAnalytics(id: string): Promise<BroadcastAnalytics> {
    // TODO: Broadcast analytics API is not documented in the CRUD API
    // This would need additional API documentation
    throw new BroadcastProviderError(
      'Analytics API not yet implemented for Broadcast provider',
      BroadcastErrorCode.NOT_SUPPORTED,
      this.name
    )
  }

  getCapabilities(): BroadcastProviderCapabilities {
    return {
      supportsScheduling: true,
      supportsSegmentation: true,
      supportsAnalytics: false, // Not documented yet
      supportsABTesting: false,
      supportsTemplates: false,
      supportsPersonalization: true,
      supportsMultipleChannels: true,
      supportsChannelSegmentation: true,
      editableStatuses: [BroadcastStatus.DRAFT, BroadcastStatus.SCHEDULED],
      supportedContentTypes: ['html', 'text']
    }
  }

  async validateConfiguration(): Promise<boolean> {
    try {
      // Try to list broadcasts with limit 1 to validate API access
      await this.list({ limit: 1 })
      return true
    } catch (error) {
      return false
    }
  }

  private transformBroadcastFromApi(broadcast: BroadcastApiResponse): Broadcast {
    // TODO: We need to get the channel_id from the broadcast API response
    // For now, we'll use a placeholder
    return {
      id: broadcast.id.toString(),
      channelId: '1', // TODO: Get from API response when available
      name: broadcast.name,
      subject: broadcast.subject,
      preheader: broadcast.preheader,
      content: broadcast.body,
      status: this.mapBroadcastStatus(broadcast.status),
      trackOpens: broadcast.track_opens,
      trackClicks: broadcast.track_clicks,
      replyTo: broadcast.reply_to,
      recipientCount: broadcast.total_recipients,
      sentAt: broadcast.sent_at ? new Date(broadcast.sent_at) : undefined,
      scheduledAt: broadcast.scheduled_send_at ? new Date(broadcast.scheduled_send_at) : undefined,
      createdAt: new Date(broadcast.created_at),
      updatedAt: new Date(broadcast.updated_at),
      providerData: { broadcast },
      providerId: broadcast.id.toString(),
      providerType: 'broadcast'
    }
  }
  
  private transformChannelFromApi(channel: BroadcastChannelApiResponse): Channel {
    return {
      id: channel.id.toString(),
      name: channel.name,
      description: channel.description,
      fromName: channel.from,
      fromEmail: channel.address,
      replyTo: channel.reply_to,
      providerId: channel.id.toString(),
      providerType: 'broadcast',
      subscriberCount: channel.total_active_subscribers,
      active: true, // Broadcast API doesn't have an active field
      createdAt: new Date(channel.created_at),
      updatedAt: new Date(channel.updated_at)
    }
  }

  private mapBroadcastStatus(status: string): BroadcastStatus {
    const statusMap: Record<string, BroadcastStatus> = {
      'draft': BroadcastStatus.DRAFT,
      'scheduled': BroadcastStatus.SCHEDULED,
      'queueing': BroadcastStatus.SENDING,
      'sending': BroadcastStatus.SENDING,
      'sent': BroadcastStatus.SENT,
      'failed': BroadcastStatus.FAILED,
      'partial_failure': BroadcastStatus.FAILED,
      'paused': BroadcastStatus.PAUSED,
      'aborted': BroadcastStatus.CANCELED
    }
    return statusMap[status] || BroadcastStatus.DRAFT
  }
}