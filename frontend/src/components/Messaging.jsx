import React, { useEffect, useState, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { Send, Search, User, X, Check, CheckCheck, Clock, Loader2 } from 'lucide-react'
import { useToast } from './ui/use-toast'
import api from '../api'

export default function Messaging() {
  const { showSuccess, showError, showInfo } = useToast()
  
  const [contacts, setContacts] = useState([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [contactsLoading, setContactsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredContacts, setFilteredContacts] = useState([])
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [socket, setSocket] = useState(null)

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const currentUserId = currentUser.unique_id

  // Initialize Socket.IO
  useEffect(() => {
    if (!currentUserId) return

    const newSocket = io(import.meta.env.VITE_API_URL, { withCredentials: true })

    newSocket.on('connect', () => {
      newSocket.emit('register', currentUserId)
    })

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message])
      showInfo('New message received')
    })

    newSocket.on('typing_start', ({ sender }) => {
      setTypingUsers(prev => new Set([...prev, sender]))
    })

    newSocket.on('typing_stop', ({ sender }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(sender)
        return newSet
      })
    })

    newSocket.on('user_online', ({ uniqueId }) => {
      setOnlineUsers(prev => new Set([...prev, uniqueId]))
    })

    newSocket.on('user_offline', ({ uniqueId }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(uniqueId)
        return newSet
      })
    })

    setSocket(newSocket)
    return () => newSocket.disconnect()
  }, [currentUserId])

  // Load contacts
  useEffect(() => {
    loadContacts()
  }, [])

  // Filter contacts
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts)
    } else {
      const filtered = contacts.filter(contact =>
        contact.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredContacts(filtered)
    }
  }, [searchQuery, contacts])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadContacts = async () => {
    try {
      setContactsLoading(true)
      const response = await api.get('/messages/contacts')
      
      if (response.data.success) {
        setContacts(response.data.contacts)
        setFilteredContacts(response.data.contacts)
      } else {
        showError('Failed to load contacts')
      }
    } catch (error) {
      showError('Failed to load contacts: ' + (error.response?.data?.message || error.message))
    } finally {
      setContactsLoading(false)
    }
  }

  const loadThread = async (contactId) => {
    if (!contactId) return
    
    try {
      setLoading(true)
      const response = await api.get(`/messages/threads/${contactId}`)
      
      if (response.data.success) {
        setMessages(response.data.messages)
        
        // Mark messages as read
        const unreadMessages = response.data.messages.filter(
          msg => msg.sender === contactId && !msg.is_read
        )
        
        for (const msg of unreadMessages) {
          try {
            await api.put(`/messages/${msg.id}/read`)
            setMessages(prev => prev.map(m => 
              m.id === msg.id ? { ...m, is_read: true } : m
            ))
          } catch (error) {
            console.warn('Failed to mark message as read:', error)
          }
        }
      } else {
        showError('Failed to load conversation')
      }
    } catch (error) {
      showError('Failed to load conversation: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleContactSelect = (contact) => {
    setSelectedContact(contact)
    setMessages([])
    loadThread(contact.unique_id)
  }

  const handleTyping = useCallback(() => {
    if (!selectedContact || !socket) return

    socket.emit('typing_start', { 
      recipient: selectedContact.unique_id, 
      sender: currentUserId 
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { 
        recipient: selectedContact.unique_id, 
        sender: currentUserId 
      })
    }, 1000)
  }, [selectedContact, socket, currentUserId])

  const sendMessage = async () => {
    if (!draft.trim() || !selectedContact || !socket) return

    const messageText = draft.trim()
    setDraft('')

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    socket.emit('typing_stop', { 
      recipient: selectedContact.unique_id, 
      sender: currentUserId 
    })

    try {
      const response = await api.post(`/messages/threads/${selectedContact.unique_id}`, {
        text: messageText,
        messageType: 'text'
      })

      if (response.data.success) {
        const newMessage = response.data.data
        setMessages(prev => [...prev, newMessage])
        
        socket.emit('message_delivered', {
          messageId: newMessage.id,
          recipient: selectedContact.unique_id
        })
      } else {
        showError('Failed to send message')
      }
    } catch (error) {
      showError('Failed to send message: ' + (error.response?.data?.message || error.message))
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const getMessageStatus = (message) => {
    if (message.sender === currentUserId) {
      if (message.is_read) {
        return <CheckCheck className="w-4 h-4 text-blue-500" />
      } else if (message.is_delivered) {
        return <CheckCheck className="w-4 h-4 text-gray-400" />
      } else {
        return <Clock className="w-4 h-4 text-gray-300" />
      }
    }
    return null
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-120px)]">
      <div className="bg-white rounded-lg shadow-lg h-full flex">
        {/* Contacts Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {contactsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No contacts found' : 'No contacts available'}
              </div>
            ) : (
              filteredContacts.map(contact => (
                <div
                  key={contact.unique_id}
                  onClick={() => handleContactSelect(contact)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedContact?.unique_id === contact.unique_id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      {onlineUsers.has(contact.unique_id) && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {contact.first_name} {contact.last_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{contact.role}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      {onlineUsers.has(selectedContact.unique_id) && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedContact.first_name} {selectedContact.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">{selectedContact.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedContact(null)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`flex ${message.sender === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === currentUserId
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                          <span>{formatTime(message.created_at)}</span>
                          {getMessageStatus(message)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {typingUsers.has(selectedContact.unique_id) && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex items-end space-x-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onInput={handleTyping}
                      placeholder="Type your message..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="1"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={!draft.trim()}
                    className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Select a contact to start messaging</h3>
                <p className="text-sm">Choose someone from the contacts list to begin a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
