// src/components/Messaging.jsx
import React, { useEffect, useState } from 'react'
import api from '../api'      // axios.create({ baseURL:'/api/messages' })

export default function Messaging() {
  const [contacts, setContacts] = useState([])
  const [selected, setSelected] = useState('')
  const [thread, setThread]     = useState([])
  const [draft, setDraft]       = useState('')

  // load just once
  useEffect(() => {
    api.get('/contacts')
      .then(r => setContacts(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
  }, [])

  // whenever you pick someone, load history
  useEffect(() => {
    if (!selected) return
    api.get(`/threads/${selected}`)
      .then(r => setThread(r.data))
      .catch(console.error)
  }, [selected])

  function send() {
    if (!draft.trim() || !selected) return
    api.post(`/threads/${selected}`, { text: draft })
      .then(() => {
        // append locally
        setThread(t => [...t, { sender: 'me', recipient: selected, message: draft, created_at: new Date().toISOString() }])
        setDraft('')
      })
      .catch(console.error)
  }

  return (
    <div className="max-w-md mx-auto p-4 border rounded">
      <label className="block mb-2 font-medium">Send To</label>
      <select
        className="w-full mb-4 border rounded p-2"
        value={selected}
        onChange={e => setSelected(e.target.value)}
      >
        <option value="">-- pick a user --</option>
        {contacts.map(u => (
          <option key={u.unique_id} value={u.unique_id}>
            {u.first_name} {u.last_name} ({u.role})
          </option>
        ))}
      </select>

      <div className="h-64 mb-4 overflow-auto bg-gray-50 p-2 rounded">
        {thread.map((m,i) => (
          <div key={i} className={m.sender=== 'me' ? 'text-right' : ''}>
            <p className="inline-block px-2 py-1 mb-1 rounded bg-white">
              {m.message}
            </p>
          </div>
        ))}
      </div>

      <div className="flex">
        <input
          className="flex-1 border rounded-l p-2"
          placeholder={selected ? "Type your message…" : "Select a user first"}
          disabled={!selected}
          value={draft}
          onChange={e => setDraft(e.target.value)}
        />
        <button
          onClick={send}
          disabled={!draft.trim() || !selected}
          className="bg-indigo-600 text-white px-4 rounded-r"
        >
          Send
        </button>
      </div>
    </div>
  )
}
