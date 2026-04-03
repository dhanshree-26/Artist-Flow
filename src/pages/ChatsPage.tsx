import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { MessageCircleDashed, SendHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { formatRelativeTime } from '../lib/date'
import { db } from '../lib/firebase'
import type { ChatMessage, ConnectionThread } from '../types'

const toDate = (value: { toDate: () => Date } | null | undefined) => (value?.toDate ? value.toDate() : null)

const sortThreads = (items: ConnectionThread[]) =>
  [...items].sort((a, b) => {
    const left = toDate(a.lastMessageAt)?.getTime() ?? 0
    const right = toDate(b.lastMessageAt)?.getTime() ?? 0
    return right - left
  })

const mergeThreads = (artistThreads: ConnectionThread[], venueThreads: ConnectionThread[]) => {
  const byId = new Map<string, ConnectionThread>()

  for (const thread of [...artistThreads, ...venueThreads]) {
    byId.set(thread.id, thread)
  }

  return sortThreads(Array.from(byId.values()))
}

export const ChatsPage = () => {
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [threads, setThreads] = useState<ConnectionThread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState(searchParams.get('thread') ?? '')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [threadsError, setThreadsError] = useState('')
  const [messagesError, setMessagesError] = useState('')

  useEffect(() => {
    if (!user) {
      setThreads([])
      return
    }

    let artistThreads: ConnectionThread[] = []
    let venueThreads: ConnectionThread[] = []

    const syncThreads = () => {
      setThreads(mergeThreads(artistThreads, venueThreads))
      setThreadsError('')
    }

    const artistUnsubscribe = onSnapshot(
      query(collection(db, 'connections'), where('artistId', '==', user.uid)),
      (snapshot) => {
        artistThreads = snapshot.docs.map((threadDoc) => ({
          id: threadDoc.id,
          ...(threadDoc.data() as Omit<ConnectionThread, 'id'>),
        }))
        syncThreads()
      },
      () => {
        setThreadsError('Unable to load chats. Check Firebase rules and try refreshing.')
      },
    )

    const venueUnsubscribe = onSnapshot(
      query(collection(db, 'connections'), where('venueId', '==', user.uid)),
      (snapshot) => {
        venueThreads = snapshot.docs.map((threadDoc) => ({
          id: threadDoc.id,
          ...(threadDoc.data() as Omit<ConnectionThread, 'id'>),
        }))
        syncThreads()
      },
      () => {
        setThreadsError('Unable to load chats. Check Firebase rules and try refreshing.')
      },
    )

    return () => {
      artistUnsubscribe()
      venueUnsubscribe()
    }
  }, [user])

  useEffect(() => {
    const threadFromUrl = searchParams.get('thread')

    if (threadFromUrl) {
      setSelectedThreadId(threadFromUrl)
      return
    }

    if (!threadFromUrl && threads.length > 0 && !selectedThreadId) {
      setSelectedThreadId(threads[0].id)
    }
  }, [searchParams, threads, selectedThreadId])

  useEffect(() => {
    if (selectedThreadId) {
      setSearchParams({ thread: selectedThreadId }, { replace: true })
    }
  }, [selectedThreadId, setSearchParams])

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([])
      return
    }

    const messagesQuery = query(
      collection(db, 'connections', selectedThreadId, 'messages'),
      orderBy('createdAt', 'asc'),
    )

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const next = snapshot.docs.map((messageDoc) => ({
          id: messageDoc.id,
          ...(messageDoc.data() as Omit<ChatMessage, 'id'>),
        }))

        setMessages(next)
        setMessagesError('')
      },
      () => {
        setMessagesError('Unable to load messages for this chat thread right now.')
      },
    )

    return () => unsubscribe()
  }, [selectedThreadId])

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  )

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user || !profile || !selectedThreadId || !messageText.trim()) {
      return
    }

    setIsSending(true)
    const text = messageText.trim()

    try {
      await addDoc(collection(db, 'connections', selectedThreadId, 'messages'), {
        senderId: user.uid,
        senderName: profile.stageOrVenueName || profile.fullName,
        text,
        createdAt: serverTimestamp(),
      })

      await setDoc(
        doc(db, 'connections', selectedThreadId),
        { lastMessage: text, lastMessageAt: serverTimestamp() },
        { merge: true },
      )

      setMessageText('')
      setMessagesError('')
    } catch {
      setMessagesError('Message failed to send. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="chat-layout">
      <aside className="surface-card chat-thread-list">
        <p className="hero-tag">Conversations</p>
        <h2>Your active chats</h2>

        {threadsError && <p className="form-error">{threadsError}</p>}

        {threads.length === 0 && <p className="empty-copy">No conversations yet. Connect from opportunities to begin.</p>}

        <div className="thread-list-scroll">
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              className={thread.id === selectedThreadId ? 'thread-item active' : 'thread-item'}
              onClick={() => setSelectedThreadId(thread.id)}
            >
              <strong>{thread.opportunityTitle}</strong>
              <span>{user?.uid === thread.venueId ? thread.artistName : thread.venueName}</span>
              <small>{thread.lastMessage || 'Conversation started'}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="surface-card chat-panel">
        {!selectedThread && (
          <div className="chat-placeholder">
            <MessageCircleDashed size={24} />
            <p>Select a conversation to start chatting.</p>
          </div>
        )}

        {selectedThread && (
          <>
            <header className="chat-panel-head">
              <div>
                <p className="hero-tag">{selectedThread.opportunityTitle}</p>
                <h2>{user?.uid === selectedThread.venueId ? selectedThread.artistName : selectedThread.venueName}</h2>
              </div>
            </header>

            <div className="chat-messages" aria-live="polite">
              {messagesError && <p className="form-error">{messagesError}</p>}

              {messages.map((message) => {
                const messageDate = toDate(message.createdAt)
                const mine = message.senderId === user?.uid

                return (
                  <article key={message.id} className={mine ? 'message-bubble mine' : 'message-bubble'}>
                    <p>{message.text}</p>
                    <small>{messageDate ? formatRelativeTime(messageDate) : 'just now'}</small>
                  </article>
                )
              })}
            </div>

            <form className="chat-input" onSubmit={handleSend}>
              <input
                type="text"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Type your message"
                required
              />
              <button className="button button-primary" type="submit" disabled={isSending}>
                <SendHorizontal size={16} /> {isSending ? 'Sending' : 'Send'}
              </button>
            </form>
          </>
        )}
      </section>
    </section>
  )
}
