import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './InboxPage.css';

function InboxPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com'
    : 'http://localhost:8000';

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const fetchConversations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/messages/inbox/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setConversations(data);
        } else {
          console.error("Failed to fetch inbox:", data);
        }
      } catch (error) {
        console.error("Error fetching inbox:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  return (
    <div className="inbox-container">
      <h2>Your Inbox</h2>
      {loading ? (
        <p>Loading messages...</p>
      ) : conversations.length === 0 ? (
        <p>No conversations yet.</p>
      ) : (
        <ul className="conversation-list">
          {conversations.map((msg) => (
            <li key={msg.id} className="conversation-item">
              <Link to={`/chat/${msg.sender.id === msg.receiver.id ? msg.receiver.id : (msg.sender.id !== msg.receiver.id ? msg.sender.id : '')}`}>
                <div className="conversation-preview">
                  <strong>{msg.sender.username !== localStorage.getItem('username') ? msg.sender.username : msg.receiver.username}</strong>
                  <p>{msg.content.slice(0, 40)}...</p>
                  <small>{new Date(msg.timestamp).toLocaleString()}</small>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default InboxPage;
