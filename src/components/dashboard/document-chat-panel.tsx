'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
};

type DocumentChatPanelProps = {
  documentId: string;
  documentTitle: string;
  documentStatus: 'UPLOADED' | 'PROCESSING' | 'COMPLETE' | 'FAILED';
  isPremiumEnabled: boolean;
  initialMessages: ChatMessage[];
};

export function DocumentChatPanel({
  documentId,
  documentTitle,
  documentStatus,
  isPremiumEnabled,
  initialMessages,
}: DocumentChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isReady = documentStatus === 'COMPLETE' && isPremiumEnabled;

  const statusCopy = useMemo(() => {
    if (!isPremiumEnabled) {
      return 'Upgrade the workspace to unlock AI chat over this document.';
    }

    if (documentStatus === 'COMPLETE') {
      return 'Ask a grounded question about the extracted document content.';
    }

    if (documentStatus === 'PROCESSING') {
      return 'Chat is available after processing finishes.';
    }

    if (documentStatus === 'FAILED') {
      return 'This document failed processing, so chat is disabled until the file is re-uploaded.';
    }

    return 'Chat unlocks once the document is processed.';
  }, [documentStatus, isPremiumEnabled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = input.trim();

    if (!trimmed || !isReady || isSending) {
      return;
    }

    setError(null);
    setIsSending(true);
    setInput('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'USER',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const assistantMessageId = `assistant-${Date.now()}`;

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      {
        id: assistantMessageId,
        role: 'ASSISTANT',
        content: '',
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch(`/api/documents/${documentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'Unable to generate a response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        responseText += decoder.decode(value, { stream: true });
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantMessageId ? { ...message, content: responseText } : message
          )
        );
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantMessageId && !message.content
            ? { ...message, content: responseText }
            : message
        )
      );
    } catch (submitError) {
      setMessages((currentMessages) =>
        currentMessages.filter((message) => message.id !== assistantMessageId)
      );
      setError(
        submitError instanceof Error ? submitError.message : 'Unable to submit the question.'
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="panel dashboard-card document-chat-panel">
      <div className="surface-header">
        <div>
          <p className="dashboard-kicker">Chat</p>
          <h2 className="section-title">Ask about {documentTitle}</h2>
          <p className="section-copy">{statusCopy}</p>
        </div>
        <span className={`tag ${isReady ? 'chat-ready' : 'chat-disabled'}`}>
          {isPremiumEnabled ? (isReady ? 'Ready' : documentStatus) : 'Upgrade required'}
        </span>
      </div>

      <div className="chat-thread" aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <strong>No messages yet</strong>
            <p>Ask the first grounded question once the document is ready.</p>
          </div>
        ) : (
          messages.map((message) => (
            <article
              className={`chat-message ${message.role === 'ASSISTANT' ? 'assistant' : 'user'}`}
              key={message.id}
            >
              <span className="chat-message-role">
                {message.role === 'ASSISTANT' ? 'NexusAI' : 'You'}
              </span>
              <p>
                {message.content ||
                  (message.role === 'ASSISTANT' && isSending ? 'Thinking...' : '')}
              </p>
            </article>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error ? <p className="error-box">{error}</p> : null}

      <form className="chat-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Your question</span>
          <textarea
            disabled={!isReady || isSending}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              isReady
                ? 'What does this document say about deadlines?'
                : 'Chat is disabled until processing completes.'
            }
            rows={4}
            value={input}
          />
        </label>

        <div className="upload-meta chat-meta">
          <div>
            <strong>{isSending ? 'Streaming answer…' : 'Ready to answer'}</strong>
            <span>
              {isPremiumEnabled
                ? isReady
                  ? 'Uses the extracted text stored in the database.'
                  : 'Wait for processing to finish.'
                : 'Enable a paid plan to unlock AI chat.'}
            </span>
          </div>
          <button
            className="button"
            disabled={!isReady || !isPremiumEnabled || isSending}
            type="submit"
          >
            {isSending ? 'Sending…' : 'Send question'}
          </button>
        </div>

        {!isPremiumEnabled ? (
          <div className="chat-upgrade-banner">
            <p>Document chat is a premium feature in production.</p>
            <a className="button" href="/pricing">
              Upgrade workspace
            </a>
          </div>
        ) : null}
      </form>
    </section>
  );
}
