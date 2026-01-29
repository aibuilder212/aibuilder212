import { useCallback, useEffect, useMemo, useState } from 'react'
import { clawdClient } from './api/clawdClient'
import { useLocalStorage } from './hooks/useLocalStorage'
import type {
  GatewayConversation,
  GatewayMessage,
  GatewaySettings,
  GatewayStatus,
} from './types'

const defaultSettings: GatewaySettings = {
  model: 'gpt-4o-mini',
  systemPrompt: 'You are Clawd, a helpful automation assistant.',
  temperature: 0.4,
}

const modelOptions = ['gpt-4o-mini', 'gpt-4o', 'claude-3-opus']

const createEmptyStatus = (): GatewayStatus => ({
  online: false,
  activeAgent: 'Unknown',
  activeModel: 'Unknown',
})

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  })

const buildTempLabel = (value: number) => `${value.toFixed(2)}`

function App() {
  const [settings, setSettings] = useLocalStorage<GatewaySettings>(
    'clawd:settings',
    defaultSettings,
  )
  const [conversations, setConversations] = useState<GatewayConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string>('')
  const [messages, setMessages] = useState<GatewayMessage[]>([])
  const [status, setStatus] = useState<GatewayStatus>(createEmptyStatus)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string>('')
  const [draft, setDraft] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId),
    [conversations, activeConversationId],
  )

  const refreshStatus = useCallback(async () => {
    try {
      const response = await clawdClient.getStatus()
      setStatus({
        online: true,
        activeModel: response.activeModel ?? 'Unknown',
        activeAgent: response.activeAgent ?? 'Unknown',
        lastResponseMs: response.lastResponseMs,
        lastError: response.lastError,
      })
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        online: false,
        lastError: err instanceof Error ? err.message : 'Status unavailable',
      }))
    }
  }, [])

  const loadConversations = useCallback(async () => {
    const response = await clawdClient.listConversations()
    setConversations(response.conversations)
    if (response.conversations.length && !activeConversationId) {
      setActiveConversationId(response.conversations[0].id)
    }
  }, [activeConversationId])

  const loadMessages = useCallback(async (conversationId: string) => {
    const response = await clawdClient.listMessages(conversationId)
    setMessages(response.messages)
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([refreshStatus(), loadConversations()])
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to connect to the gateway.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    bootstrap()
  }, [loadConversations, refreshStatus])

  useEffect(() => {
    if (!activeConversationId) {
      return
    }
    loadMessages(activeConversationId).catch((err) => {
      setError(
        err instanceof Error ? err.message : 'Unable to load conversation.',
      )
    })
  }, [activeConversationId, loadMessages])

  const handleNewConversation = async () => {
    setError('')
    try {
      const response = await clawdClient.createConversation(settings)
      setConversations((prev) => [response.conversation, ...prev])
      setActiveConversationId(response.conversation.id)
      setMessages([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chat.')
    }
  }

  const handleRenameConversation = async (conversation: GatewayConversation) => {
    const title = window.prompt('Rename conversation', conversation.title)
    if (!title || title.trim().length === 0) {
      return
    }
    try {
      const response = await clawdClient.renameConversation(
        conversation.id,
        title.trim(),
      )
      setConversations((prev) =>
        prev.map((item) =>
          item.id === conversation.id ? response.conversation : item,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rename failed.')
    }
  }

  const handleDeleteConversation = async (conversation: GatewayConversation) => {
    const confirmed = window.confirm(
      `Delete "${conversation.title}"? This cannot be undone.`,
    )
    if (!confirmed) {
      return
    }
    try {
      await clawdClient.deleteConversation(conversation.id)
      setConversations((prev) =>
        prev.filter((item) => item.id !== conversation.id),
      )
      if (activeConversationId === conversation.id) {
        setActiveConversationId('')
        setMessages([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  const handleSendMessage = async () => {
    if (!activeConversationId || !draft.trim()) {
      return
    }
    const content = draft.trim()
    setDraft('')
    setIsSending(true)
    setError('')

    const optimisticMessage: GatewayMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMessage])

    try {
      const response = await clawdClient.sendMessage(
        activeConversationId,
        content,
        settings,
      )

      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== optimisticMessage.id),
        response.message,
        response.response,
      ])

      if (response.status) {
        setStatus((prev) => ({
          ...prev,
          activeModel: response.status?.activeModel ?? prev.activeModel,
          activeAgent: response.status?.activeAgent ?? prev.activeAgent,
          lastResponseMs: response.status?.lastResponseMs ?? prev.lastResponseMs,
          lastError: response.status?.lastError ?? prev.lastError,
        }))
      }

      setConversations((prev) =>
        prev.map((item) =>
          item.id === activeConversationId
            ? { ...item, updatedAt: new Date().toISOString() }
            : item,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSendMessage()
    }
  }

  const statusDot = status.online ? 'bg-emerald-400' : 'bg-rose-400'

  return (
    <div className="min-h-screen bg-ink-950 text-slate-100">
      <div className="flex h-screen overflow-hidden">
        <aside className="flex w-72 flex-col gap-4 border-r border-ink-800 bg-ink-900/80 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Clawd Control Panel
              </p>
              <h1 className="text-lg font-semibold">Conversations</h1>
            </div>
            <button
              className="rounded-lg bg-brand-600 px-3 py-1 text-sm font-semibold text-white hover:bg-brand-500"
              onClick={handleNewConversation}
              type="button"
            >
              New
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  conversation.id === activeConversationId
                    ? 'border-brand-500 bg-ink-800'
                    : 'border-ink-800 bg-ink-900 hover:border-brand-500/50'
                }`}
                onClick={() => setActiveConversationId(conversation.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{conversation.title}</p>
                    <p className="text-xs text-slate-400">
                      {formatTimestamp(conversation.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="rounded-md px-2 py-1 text-xs text-slate-400 hover:text-white"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleRenameConversation(conversation)
                      }}
                      type="button"
                    >
                      Rename
                    </button>
                    <button
                      className="rounded-md px-2 py-1 text-xs text-rose-400 hover:text-rose-200"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDeleteConversation(conversation)
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </button>
            ))}
            {conversations.length === 0 && !isLoading && (
              <div className="rounded-lg border border-dashed border-ink-700 p-4 text-sm text-slate-400">
                No conversations yet. Create one to start chatting.
              </div>
            )}
          </div>
          <button
            className="w-full rounded-lg border border-ink-700 px-3 py-2 text-sm text-slate-300 hover:border-brand-500"
            onClick={() => setShowSettings(true)}
            type="button"
          >
            Settings
          </button>
        </aside>

        <main className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-ink-800 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold">
                {activeConversation?.title ?? 'Select a conversation'}
              </h2>
              <p className="text-sm text-slate-400">
                Agent: {status.activeAgent} · Model: {status.activeModel}
              </p>
              {status.lastError && (
                <p className="text-xs text-rose-300">
                  Last error: {status.lastError}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${statusDot}`} />
                {status.online ? 'Online' : 'Offline'}
              </span>
              {status.lastResponseMs !== undefined && (
                <span>{status.lastResponseMs}ms</span>
              )}
            </div>
          </header>

          <section className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {error && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}
            {messages.length === 0 && !isLoading && (
              <div className="rounded-lg border border-ink-800 bg-ink-900/60 p-6 text-sm text-slate-400">
                Start the conversation by sending a message to Clawd.
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xl rounded-2xl px-4 py-3 text-sm shadow-card ${
                    message.role === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-800 text-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                  <p className="mt-2 text-xs text-slate-200/70">
                    {formatTimestamp(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </section>

          <footer className="border-t border-ink-800 px-6 py-4">
            <div className="flex items-end gap-3">
              <textarea
                className="min-h-[48px] flex-1 resize-none rounded-2xl border border-ink-700 bg-ink-900/60 px-4 py-3 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                placeholder={
                  activeConversationId
                    ? 'Message Clawd...'
                    : 'Create or select a conversation to begin.'
                }
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!activeConversationId || isSending}
              />
              <button
                className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink-700"
                onClick={handleSendMessage}
                disabled={!activeConversationId || isSending || !draft.trim()}
                type="button"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </footer>
        </main>
      </div>

      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-ink-950/80 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-900 p-6 text-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Settings</h3>
              <button
                className="text-slate-400 hover:text-white"
                onClick={() => setShowSettings(false)}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">
                System prompt
                <textarea
                  className="mt-2 w-full rounded-xl border border-ink-700 bg-ink-950/80 px-3 py-2 text-sm text-slate-100"
                  rows={4}
                  value={settings.systemPrompt}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      systemPrompt: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">
                Model
                <select
                  className="mt-2 w-full rounded-xl border border-ink-700 bg-ink-950/80 px-3 py-2 text-sm text-slate-100"
                  value={settings.model}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      model: event.target.value,
                    }))
                  }
                >
                  {modelOptions.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">
                Temperature ({buildTempLabel(settings.temperature)})
                <input
                  className="mt-2 w-full"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.temperature}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      temperature: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-lg border border-ink-700 px-4 py-2 text-sm text-slate-300"
                onClick={() => setSettings(defaultSettings)}
                type="button"
              >
                Reset
              </button>
              <button
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setShowSettings(false)}
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
