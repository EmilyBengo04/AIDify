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
import AnalyticsCards from "../components/AnalyticsCards";

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
  const [analytics, setAnalytics] = useState(null);
  const [liveInsights, setLiveInsights] = useState(null);
  const [flippedCards, setFlippedCards] = useState({});
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState(
    localStorage.getItem("aidifyTheme") || "light"
  );

  const user = JSON.parse(localStorage.getItem("user"));
  const firstName = user?.name?.split(" ")[0] || "Student";
  const darkMode = theme === "dark";

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

  const subjectPerformance = useMemo(() => {
    if (!analytics?.subjectStats?.length) return [];

    const entries = [...analytics.subjectStats]
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const maxCount = Math.max(...entries.map((item) => item.count), 1);

    return entries.map((item) => ({
      subject: item.subject,
      value: Math.round((item.count / maxCount) * 100),
    }));
  }, [analytics]);

  const insights = useMemo(() => {
    if (liveInsights) {
      return liveInsights;
    }

    const strongest =
      analytics?.strongestSubject || activeSession?.subject || "Languages";
    const weakest = analytics?.weakestSubject || "Physics";
    const recent =
      activeSession?.subject || analytics?.subjectStats?.[0]?.subject || "Machine Learning";
    const nextBySubject = {
      Physics: "Introduction to Newton's Laws",
      Calculus: "Practice limits with real examples",
      Biology: "Review cell structure",
      Languages: "Practice code-switching examples",
      Writing: "Draft a thesis statement",
      General: "Introduction to Neural Networks",
    };

    return {
      strongest,
      weakest,
      recent,
      next: nextBySubject[recent] || "Introduction to Neural Networks",
    };
  }, [analytics, activeSession, liveInsights]);

  const allSessions = chatSessions.length ? chatSessions : sessions;

  const subjectOptions = useMemo(() => {
    const subjects = Array.from(
      new Set(allSessions.map((session) => session.subject || "General"))
    );

    return ["All", ...subjects];
  }, [allSessions]);

  const filteredSessions = useMemo(() => {
    if (subjectFilter === "All") {
      return allSessions;
    }

    return allSessions.filter(
      (session) => (session.subject || "General") === subjectFilter
    );
  }, [allSessions, subjectFilter]);

  const flashcards = useMemo(() => {
    const subject = activeSession?.subject || "General";
    const bank = {
      Calculus: [
        {
          question: "What is a limit?",
          answer:
            "A limit describes the value a function approaches as the input gets closer to a point.",
        },
        {
          question: "What does derivative represent?",
          answer:
            "The derivative measures how fast a function changes relative to its input.",
        },
        {
          question: "What is a tangent line?",
          answer:
            "A tangent line touches a curve at one point and has the same slope as the curve there.",
        },
      ],
      Physics: [
        {
          question: "What is Newton's first law?",
          answer:
            "An object stays at rest or moves at constant speed unless acted on by an unbalanced force.",
        },
        {
          question: "What is velocity?",
          answer: "Velocity is speed with a direction attached.",
        },
        {
          question: "What is energy?",
          answer:
            "Energy is the ability to do work, stored in motion, position, or fields.",
        },
      ],
      Biology: [
        {
          question: "What is photosynthesis?",
          answer:
            "Photosynthesis is how plants turn sunlight, water and CO₂ into food and oxygen.",
        },
        {
          question: "What is a cell?",
          answer:
            "A cell is the basic building block of living organisms.",
        },
        {
          question: "What is DNA?",
          answer: "DNA carries genetic instructions for growth and reproduction.",
        },
      ],
      Writing: [
        {
          question: "What makes a strong thesis statement?",
          answer:
            "A strong thesis clearly states the main idea and what the essay will prove.",
        },
        {
          question: "Why is structure important?",
          answer:
            "Structure helps the reader follow your argument and keeps the writing clear.",
        },
        {
          question: "What is a supporting example?",
          answer:
            "A supporting example gives evidence that backs up your main point.",
        },
      ],
      Languages: [
        {
          question: "What is code-switching?",
          answer:
            "Code-switching means switching between languages or dialects in the same conversation.",
        },
        {
          question: "What is a common Kiswahili greeting?",
          answer: "A common Kiswahili greeting is 'Habari' or 'Hujambo'.",
        },
        {
          question: "What does 'shine' mean in Sheng?",
          answer: "In Sheng, 'shine' can mean something is impressive or very good.",
        },
      ],
      General: [
        {
          question: "What is active learning?",
          answer:
            "Active learning means asking questions, practicing, and explaining concepts in your own words.",
        },
        {
          question: "How can you improve memory?",
          answer:
            "Practice regularly, review notes, and use examples to make ideas stick.",
        },
        {
          question: "Why schedule short study sessions?",
          answer:
            "Short, frequent review sessions help the brain retain information better than long cramming.",
        },
      ],
    };

    return bank[subject] || bank.General;
  }, [activeSession]);

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

  const loadAnalytics = async () => {
    const { data } = await api.get("/analytics");
    setAnalytics(data);
  };

  const loadInsights = async (sessionId) => {
    try {
      const { data } = await api.get("/analytics/insights", {
        params: sessionId ? { sessionId } : {},
      });
      setLiveInsights(data.insights);
    } catch (error) {
      setLiveInsights(null);
    }
  };

  const toggleFlashcard = (index) => {
    setFlippedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setIsLoadingChat(true);

    Promise.all([loadSessions(), loadAnalytics()])
      .catch((error) => {
        setChatError(
          error.response?.data?.message || "Could not load your learning data."
        );
        setActiveMessages(fallbackMessages(firstName));
      })
      .finally(() => setIsLoadingChat(false));
  }, []);

  useEffect(() => {
    if (activeSessionId !== null) {
      loadInsights(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    localStorage.setItem("aidifyTheme", theme);
  }, [theme]);

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
    <div className={`dashboard-page ${darkMode ? "dark" : ""}`}>
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

        <div className="dashboard-subjects">
          <h3>My subjects</h3>
          <div className="subject-list">
            {subjectOptions.map((subject) => (
              <button
                key={subject}
                type="button"
                className={`subject-pill ${subjectFilter === subject ? "active" : ""}`}
                onClick={() => {
                  setSubjectFilter(subject);
                  if (subject !== "All") {
                    const nextSession = allSessions.find(
                      (session) => (session.subject || "General") === subject
                    );
                    if (nextSession) {
                      openSession(nextSession);
                    }
                  }
                }}
              >
                {subject}
              </button>
            ))}
          </div>

          <div className="subject-performance-panel">
            <h4>Subject performance</h4>
            {subjectPerformance.length === 0 ? (
              <p className="subject-performance-empty">
                Complete more chats to unlock performance insights.
              </p>
            ) : (
              subjectPerformance.map((subject) => (
                <div key={subject.subject} className="performance-row">
                  <span>{subject.subject}</span>
                  <div className="performance-bar">
                    <span className="performance-fill" style={{ width: `${subject.value}%` }} />
                  </div>
                  <strong>{subject.value}%</strong>
                </div>
              ))
            )}
          </div>
        </div>

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

            <div className="dashboard-header-controls">
              <button
                type="button"
                className={`theme-toggle ${theme === "light" ? "active" : ""}`}
                onClick={() => setTheme("light")}
              >
                ☀️ Light
              </button>
              <button
                type="button"
                className={`theme-toggle ${theme === "dark" ? "active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                🌙 Dark
              </button>

              <div className="profile-menu">
                <button
                  type="button"
                  className="profile-toggle"
                  onClick={() => setProfileOpen((open) => !open)}
                >
                  👤 {firstName}
                </button>
                {profileOpen && (
                  <div className="profile-dropdown">
                    <button type="button">Profile</button>
                    <button type="button">Learning Goals</button>
                    <button type="button">Settings</button>
                    <button type="button" onClick={logout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

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
                <button type="button" className={subjectFilter === "All" ? "active" : ""}>All</button>
                <button type="button">Upcoming</button>
                <button type="button">Completed</button>
              </div>
            </div>

            <div className="session-list">
              {filteredSessions.map((session) => {
                const Icon = session.icon || FiBookOpen;
                const sessionStatus = session.status || "Active";
                const sessionTone = session.tone || "purple";
                const sessionDate = session.date ||
                  (session.updatedAt ? new Date(session.updatedAt).toLocaleDateString() : "Today");
                const sessionDuration = session.duration || "30 min";
                const sessionProgress = session.progress ?? Math.min(100, (session.messages?.length ?? 1) * 12 + 10);

                return (
                  <div className="session-row" key={session._id || session.title}>
                    <div className={`session-icon ${sessionTone}`}>
                      <Icon />
                    </div>

                    <div className="session-info">
                      <p className="session-subject-pill">
                        {session.subject === "Physics" ? "⚛️" : "📘"} {session.subject || "General"}
                      </p>
                      <h3>{session.title || `Study ${session.subject || "General"}`}</h3>
                      <p className="session-meta">
                        Progress: {sessionProgress}% · Last active: {session.updatedAt ? getRelativeTime(session.updatedAt) : session.date}
                      </p>
                      <div className="session-progress">
                        <span style={{ width: `${sessionProgress}%` }}></span>
                      </div>
                    </div>

                    <button type="button" className="session-play" onClick={() => openSession(session)}>
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

          <div className="dashboard-right-column">
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

            <article className="dashboard-panel insights-panel">
              <div className="dashboard-panel-header">
                <h2>🧠 Learning insights</h2>
              </div>
              <div className="insights-grid">
                <div className="insight-item">
                  <span>Strongest Subject</span>
                  <strong>{insights.strongest}</strong>
                </div>
                <div className="insight-item">
                  <span>Needs More Practice</span>
                  <strong>{insights.weakest}</strong>
                </div>
                <div className="insight-item">
                  <span>Recent Topic</span>
                  <strong>{insights.recent}</strong>
                </div>
                <div className="insight-item">
                  <span>Recommended Next</span>
                  <strong>{insights.next}</strong>
                </div>
              </div>
            </article>

            <article className="dashboard-panel flashcards-panel">
              <div className="dashboard-panel-header">
                <h2>AI Flashcards</h2>
              </div>
              <p className="flashcards-description">
                Review quick AI-generated study cards for {activeSession?.subject || "your current subject"}.
              </p>

              <div className="flashcard-grid">
                {flashcards.map((card, index) => (
                  <button
                    type="button"
                    className={`flashcard ${flippedCards[index] ? "flipped" : ""}`}
                    key={`${card.question}-${index}`}
                    onClick={() => toggleFlashcard(index)}
                  >
                    <div className="flashcard-inner">
                      <div className="flashcard-face flashcard-front">
                        <h3>{card.question}</h3>
                      </div>
                      <div className="flashcard-face flashcard-back">
                        <p>{card.answer}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </article>
          </div>
        </section>

        <AnalyticsCards analytics={analytics} />

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
              <div className="chat-message ai-message">
                <span>A</span>
                <p>Loading your learning history...</p>
              </div>
            ) : (
              activeMessages.map((chatMessage, index) => (
                <div
                  className={`chat-message ${
                    chatMessage.role === "user" ? "user-message" : "ai-message"
                  }`}
                  key={`${chatMessage.role}-${index}`}
                >
                  {chatMessage.role !== "user" && <span>A</span>}
                  <p>{chatMessage.content}</p>
                  {chatMessage.role === "user" && (
                    <span>{firstName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              ))
            )}

            {isSending && (
              <div className="chat-message ai-message typing-message">
                <span>A</span>
                <p>
                  AIDify is thinking
                  <span className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </span>
                </p>
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
