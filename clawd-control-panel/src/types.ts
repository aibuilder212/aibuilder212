export type MessageRole = 'user' | 'assistant' | 'system'

export interface GatewayStatus {
  online: boolean
  activeModel: string
  activeAgent: string
  lastResponseMs?: number
  lastError?: string
}

export interface GatewayConversation {
  id: string
  title: string
  updatedAt: string
}

export interface GatewayMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: string
}

export interface GatewayConversationDetail {
  conversation: GatewayConversation
  messages: GatewayMessage[]
}

export interface GatewaySettings {
  model: string
  systemPrompt: string
  temperature: number
}

export interface CreateConversationResponse {
  conversation: GatewayConversation
}

export interface ListConversationsResponse {
  conversations: GatewayConversation[]
}

export interface ListMessagesResponse {
  messages: GatewayMessage[]
}

export interface SendMessageResponse {
  message: GatewayMessage
  response: GatewayMessage
  status?: {
    activeModel?: string
    activeAgent?: string
    lastResponseMs?: number
    lastError?: string
  }
}

export interface RenameConversationResponse {
  conversation: GatewayConversation
}

export interface DeleteConversationResponse {
  deleted: boolean
}

export interface TradeQuoteRequest {
  inputMint: string
  outputMint: string
  amount: string
  slippageBps?: number
}

export interface TradeQuoteResponse {
  quote: unknown
}

export interface TradeExecuteRequest {
  userPublicKey: string
  quoteResponse: Record<string, unknown>
}

export interface TradeExecuteResponse {
  result: Record<string, unknown>
}

export interface StrategyStepResponse {
  result: Record<string, unknown>
}
