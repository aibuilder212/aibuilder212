import type {
  CreateConversationResponse,
  DeleteConversationResponse,
  GatewaySettings,
  ListConversationsResponse,
  ListMessagesResponse,
  RenameConversationResponse,
  SendMessageResponse,
  StrategyStepResponse,
  TradeExecuteRequest,
  TradeExecuteResponse,
  TradeQuoteRequest,
  TradeQuoteResponse,
} from '../types'

const gatewayUrl = import.meta.env.VITE_GATEWAY_URL
const gatewayToken = import.meta.env.VITE_GATEWAY_TOKEN

const jsonHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${gatewayToken}`,
}

const ensureConfig = () => {
  if (!gatewayUrl || !gatewayToken) {
    throw new Error(
      'Missing VITE_GATEWAY_URL or VITE_GATEWAY_TOKEN. Add them to the .env file.',
    )
  }
}

const buildUrl = (path: string) => {
  const normalizedBase = gatewayUrl?.replace(/\/$/, '')
  return `${normalizedBase}${path}`
}

export const clawdClient = {
  async getStatus() {
    ensureConfig()
    const response = await fetch(buildUrl('/status'), {
      headers: jsonHeaders,
    })

    if (!response.ok) {
      throw new Error('Failed to fetch gateway status.')
    }

    return (await response.json()) as {
      activeModel?: string
      activeAgent?: string
      lastResponseMs?: number
      lastError?: string
    }
  },

  async listConversations() {
    ensureConfig()
    const response = await fetch(buildUrl('/conversations'), {
      headers: jsonHeaders,
    })

    if (!response.ok) {
      throw new Error('Failed to load conversations.')
    }

    return (await response.json()) as ListConversationsResponse
  },

  async createConversation(settings: GatewaySettings) {
    ensureConfig()
    const response = await fetch(buildUrl('/conversations'), {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        title: 'New conversation',
        settings,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create conversation.')
    }

    return (await response.json()) as CreateConversationResponse
  },

  async renameConversation(conversationId: string, title: string) {
    ensureConfig()
    const response = await fetch(buildUrl(`/conversations/${conversationId}`), {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify({ title }),
    })

    if (!response.ok) {
      throw new Error('Failed to rename conversation.')
    }

    return (await response.json()) as RenameConversationResponse
  },

  async deleteConversation(conversationId: string) {
    ensureConfig()
    const response = await fetch(buildUrl(`/conversations/${conversationId}`), {
      method: 'DELETE',
      headers: jsonHeaders,
    })

    if (!response.ok) {
      throw new Error('Failed to delete conversation.')
    }

    return (await response.json()) as DeleteConversationResponse
  },

  async listMessages(conversationId: string) {
    ensureConfig()
    const response = await fetch(buildUrl(`/conversations/${conversationId}/messages`), {
      headers: jsonHeaders,
    })

    if (!response.ok) {
      throw new Error('Failed to load messages.')
    }

    return (await response.json()) as ListMessagesResponse
  },

  async sendMessage(
    conversationId: string,
    text: string,
    settings: GatewaySettings,
  ) {
    ensureConfig()
    const response = await fetch(buildUrl(`/conversations/${conversationId}/messages`), {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        content: text,
        settings,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send message.')
    }

    return (await response.json()) as SendMessageResponse
  },

  async fetchTradeQuote(payload: TradeQuoteRequest) {
    ensureConfig()
    const response = await fetch(buildUrl('/trades/quote'), {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch trade quote.')
    }

    return (await response.json()) as TradeQuoteResponse
  },

  async executeTrade(payload: TradeExecuteRequest) {
    ensureConfig()
    const response = await fetch(buildUrl('/trades/execute'), {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Failed to execute trade.')
    }

    return (await response.json()) as TradeExecuteResponse
  },

  async runStrategyStep() {
    ensureConfig()
    const response = await fetch(buildUrl('/trades/strategy-step'), {
      method: 'POST',
      headers: jsonHeaders,
    })

    if (!response.ok) {
      throw new Error('Failed to run strategy step.')
    }

    return (await response.json()) as StrategyStepResponse
  },
}
