import type { 
  Broadcast,
  ListBroadcastOptions,
  ListBroadcastResponse,
  CreateBroadcastInput,
  UpdateBroadcastInput,
  SendBroadcastOptions,
  BroadcastAnalytics,
  BroadcastProviderCapabilities
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


export class BroadcastApiProvider extends BaseBroadcastProvider {
  readonly name = 'broadcast'
  private apiUrl: string
  private token: string

  constructor(config: BroadcastProviderConfig) {
    super(config)
    this.apiUrl = config.apiUrl.replace(/\/$/, '') // Remove trailing slash
    this.token = config.token
    
    if (!this.token) {
      throw new BroadcastProviderError(
        'Broadcast API token is required',
        BroadcastErrorCode.CONFIGURATION_ERROR,
        this.name
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
      console.log('[BroadcastApiProvider] Getting broadcast with ID:', id)
      
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
      console.log('[BroadcastApiProvider] GET response:', broadcast)
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
      this.validateRequiredFields(data, ['name', 'subject', 'content'])

      const requestBody = {
        broadcast: {
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
      }

      // Log the request details (without exposing the token)
      console.log('[BroadcastApiProvider] Creating broadcast:', {
        url: `${this.apiUrl}/api/v1/broadcasts`,
        method: 'POST',
        hasToken: !!this.token,
        tokenLength: this.token?.length,
        body: JSON.stringify(requestBody, null, 2),
      })

      const response = await fetch(`${this.apiUrl}/api/v1/broadcasts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('[BroadcastApiProvider] Response status:', response.status)
      console.log('[BroadcastApiProvider] Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[BroadcastApiProvider] Error response body:', errorText)
        
        // Try to parse as JSON if possible
        let errorDetails
        try {
          errorDetails = JSON.parse(errorText)
          console.error('[BroadcastApiProvider] Parsed error:', errorDetails)
        } catch {
          // Not JSON, use as is
        }
        
        throw new Error(`Broadcast API error: ${response.status} - ${errorText}`)
      }

      const responseText = await response.text()
      console.log('[BroadcastApiProvider] Success response body:', responseText)
      
      let result
      try {
        result = JSON.parse(responseText)
      } catch {
        throw new Error(`Failed to parse response as JSON: ${responseText}`)
      }
      
      console.log('[BroadcastApiProvider] Parsed result:', result)
      
      if (!result.id) {
        throw new Error(`Response missing expected 'id' field: ${JSON.stringify(result)}`)
      }
      
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
      if (!this.canEditInStatus(existing.sendStatus)) {
        throw new BroadcastProviderError(
          `Cannot update broadcast in status: ${existing.sendStatus}`,
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
      if (!this.canEditInStatus(existing.sendStatus)) {
        throw new BroadcastProviderError(
          `Cannot delete broadcast in status: ${existing.sendStatus}`,
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

  async getAnalytics(_id: string): Promise<BroadcastAnalytics> {
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
      supportsMultipleChannels: false,
      supportsChannelSegmentation: false,
      editableStatuses: [BroadcastStatus.DRAFT, BroadcastStatus.SCHEDULED],
      supportedContentTypes: ['html', 'text']
    }
  }

  async validateConfiguration(): Promise<boolean> {
    try {
      // Try to list broadcasts with limit 1 to validate API access
      await this.list({ limit: 1 })
      return true
    } catch {
      return false
    }
  }

  private transformBroadcastFromApi(broadcast: BroadcastApiResponse): Broadcast {
    return {
      id: broadcast.id.toString(),
      name: broadcast.name,
      subject: broadcast.subject,
      preheader: broadcast.preheader,
      content: broadcast.body,
      sendStatus: this.mapBroadcastStatus(broadcast.status),
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