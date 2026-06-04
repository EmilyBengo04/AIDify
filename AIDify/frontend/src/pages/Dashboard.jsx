import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiHome,
  FiLogOut,
  FiMessageCircle,
  FiPlus,
  FiSearch,
  FiSend,
  FiSettings,
  FiTarget,
  FiTrendingUp,
} from "react-icons/fi";
import { GiChemicalDrop } from "react-icons/gi";
import api from "../services/api";

const sessions = [
  {
    title: "Limits & Continuity",
    subject: "Calculus",
    date: "Today",
    duration: "45 min",
    status: "LIVE",
    icon: FiBookOpen,
    tone: "purple",
    progress: 86,
  },
  {
    title: "Newton's Laws of Motion",
    subject: "Physics",
    date: "Tomorrow, 4:00 PM",
    duration: "30 min",
    status: "UPCOMING",
    icon: FiBookOpen,
    tone: "cyan",
    progress: 0,
  },
  {
    title: "Photosynthesis Explained",
    subject: "Biology",
    date: "May 31, 2:00 PM",
    duration: "30 min",
    status: "UPCOMING",
    icon: GiChemicalDrop,
    tone: "amber",
    progress: 0,
  },
];

const navItems = [
  { label: "Dashboard", icon: FiHome, active: true },
  { label: "Sessions", icon: FiCalendar },
  { label: "Chats", icon: FiMessageCircle },
  { label: "Subjects", icon: FiBookOpen },
  { label: "Progress", icon: FiBarChart2 },
  { label: "Settings", icon: FiSettings },
];

const fallbackMessages = (firstName) => [
  {
    role: "assistant",
    content: `Hi ${firstName}, what are we learning today? I can help with calculus, physics, biology, essays, or Swahili practice.`,
  },
];

const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  return `${Math.floor(diffHours / 24)} days ago`;
};

const toneForIndex = (index) => {
  const tones = ["purple", "green", "pink", "blue", "amber"];
  return tones[index % tones.length];
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const firstName = user?.name?.split(" ")[0] || "Student";

  const stats = useMemo(
    () => [
      {
        label: "Learning streak",
        value: String(user?.streak ?? 0),
        suffix: "days",
        icon: FiTrendingUp,
        tone: "pink",
      },
      {
        label: "Sessions this week",
        value: String(chatSessions.length),
        suffix: "/10",
        icon: FiTarget,
        tone: "purple",
      },
      {
        label: "Total chat hours",
        value: String(Math.max(0, Math.ceil(chatSessions.length * 0.5))),
        suffix: "hrs",
        icon: FiMessageCircle,
        tone: "cyan",
      },
      {
        label: "Mastery score",
        value: String(user?.masteryScore ?? 0),
        suffix: "%",
        icon: FiBarChart2,
        tone: "green",
      },
    ],
    [chatSessions.length, user?.masteryScore, user?.streak]
  );

  const activeSession = chatSessions.find((session) => session._id === activeSessionId);

  const loadSessions = async () => {
    const { data } = await api.get("/chat/sessions");
    setChatSessions(data.sessions);

    if (data.sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(data.sessions[0]._id);
      setActiveMessages(data.sessions[0].messages);
    }

    if (data.sessions.length === 0) {
      setActiveMessages(fallbackMessages(firstName));
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setIsLoadingChat(true);
    loadSessions()
      .catch((error) => {
        setChatError(error.response?.data?.message || "Could not load your chat history.");
        setActiveMessages(fallbackMessages(firstName));
      })
      .finally(() => setIsLoadingChat(false));
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const startNewSession = () => {
    setActiveSessionId(null);
    setActiveMessages(fallbackMessages(firstName));
    setMessage("");
    setChatError("");
  };

  const openSession = (session) => {
    setActiveSessionId(session._id);
    setActiveMessages(session.messages?.length ? session.messages : fallbackMessages(firstName));
    setChatError("");
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || isSending) {
      return;
    }

    const optimisticMessages = [
      ...activeMessages,
      {
        role: "user",
        content: cleanMessage,
      },
    ];

    setActiveMessages(optimisticMessages);
    setMessage("");
    setIsSending(true);
    setChatError("");

    try {
      const { data } = await api.post("/chat/message", {
        message: cleanMessage,
        sessionId: activeSessionId,
      });

      setActiveSessionId(data.session._id);
      setActiveMessages(data.session.messages);
      await loadSessions();
    } catch (error) {
      setChatError(
        error.response?.data?.message ||
          "Claude could not answer right now. Please try again."
      );
      setActiveMessages([
        ...optimisticMessages,
        {
          role: "assistant",
          content: "I could not reach Claude right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const chatHistory = chatSessions.map((session, index) => {
    const lastMessage = session.messages?.[session.messages.length - 1];

    return {
      id: session._id,
      title: session.title,
      preview: lastMessage?.content || session.learningTrack?.summary || "New learning chat",
      time: getRelativeTime(session.updatedAt),
      tone: toneForIndex(index),
      session,
    };
  });

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-logo">
          AIDIFY
        </Link>

        <nav className="dashboard-menu">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                className={`dashboard-menu-item ${item.active ? "active" : ""}`}
                key={item.label}
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button type="button" className="dashboard-logout" onClick={logout}>
          <FiLogOut />
          <span>Logout</span>
        </button>
      </aside>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Welcome back, {firstName}</h1>
            <p>Ready to learn something new today?</p>
          </div>

          <div className="dashboard-actions">
            <label className="dashboard-search">
              <FiSearch />
              <input type="search" placeholder="Search sessions, chats..." />
            </label>

            <button type="button" className="new-session-btn" onClick={startNewSession}>
              <FiPlus />
              <span>New session</span>
            </button>
          </div>
        </header>

        <section className="dashboard-stats">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article className="dashboard-stat-card" key={stat.label}>
                <div className={`dashboard-stat-icon ${stat.tone}`}>
                  <Icon />
                </div>
                <div className="dashboard-stat-value">
                  <strong>{stat.value}</strong>
                  <span>{stat.suffix}</span>
                </div>
                <p>{stat.label}</p>
              </article>
            );
          })}
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-panel sessions-panel">
            <div className="dashboard-panel-header">
              <h2>Your sessions</h2>
              <div className="session-tabs">
                <button type="button" className="active">All</button>
                <button type="button">Upcoming</button>
                <button type="button">Completed</button>
              </div>
            </div>

            <div className="session-list">
              {sessions.map((session) => {
                const Icon = session.icon;

                return (
                  <div className="session-row" key={session.title}>
                    <div className={`session-icon ${session.tone}`}>
                      <Icon />
                    </div>

                    <div className="session-info">
                      <h3>
                        {session.title}
                        <span className={`session-status ${session.status.toLowerCase()}`}>
                          {session.status}
                        </span>
                      </h3>
                      <p>
                        <span>{session.subject}</span>
                        <FiCalendar />
                        <span>{session.date}</span>
                        <FiClock />
                        <span>{session.duration}</span>
                      </p>
                      <div className="session-progress">
                        <span style={{ width: `${session.progress}%` }}></span>
                      </div>
                    </div>

                    <button type="button" className="session-play">
                      <FiArrowRight />
                    </button>
                  </div>
                );
              })}
            </div>

            <button type="button" className="view-sessions-btn">
              View all sessions
              <FiArrowRight />
            </button>
          </article>

          <article className="dashboard-panel history-panel">
            <div className="dashboard-panel-header">
              <h2>Chat history</h2>
              <button type="button">See all</button>
            </div>

            <div className="chat-history-list">
              {chatHistory.length === 0 ? (
                <div className="chat-history-empty">
                  Your Claude tutor chats will appear here.
                </div>
              ) : (
                chatHistory.map((chat) => (
                  <button
                    type="button"
                    className={`chat-history-item ${chat.id === activeSessionId ? "active" : ""}`}
                    key={chat.id}
                    onClick={() => openSession(chat.session)}
                  >
                    <span className={`chat-history-icon ${chat.tone}`}>
                      <FiMessageCircle />
                    </span>
                    <span>
                      <strong>{chat.title}</strong>
                      <small>{chat.preview}</small>
                    </span>
                    <time>{chat.time}</time>
                  </button>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="dashboard-panel chatbox-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>{activeSession?.title || "AIDify Claude tutor"}</h2>
              <p>
                {activeSession?.subject
                  ? `${activeSession.subject} track`
                  : "Ask a question, continue a lesson, or translate a concept."}
              </p>
            </div>
            <span className="chatbox-status">{isSending ? "Thinking" : "Online"}</span>
          </div>

          {chatError && <div className="chatbox-error">{chatError}</div>}

          <div className="chatbox-messages">
            {isLoadingChat ? (
              <div className="chat-message ai">
                <span>A</span>
                <p>Loading your learning history...</p>
              </div>
            ) : (
              activeMessages.map((chatMessage, index) => (
                <div className={`chat-message ${chatMessage.role === "user" ? "user" : "ai"}`} key={`${chatMessage.role}-${index}`}>
                  {chatMessage.role !== "user" && <span>A</span>}
                  <p>{chatMessage.content}</p>
                  {chatMessage.role === "user" && (
                    <span>{firstName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              ))
            )}

            {isSending && (
              <div className="chat-message ai">
                <span>A</span>
                <p>Claude is preparing your next step...</p>
              </div>
            )}
          </div>

          <form className="chatbox-input" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask AIDify anything..."
              disabled={isSending}
            />
            <button type="submit" disabled={isSending}>
              <FiSend />
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
