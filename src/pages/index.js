import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import {
    collection,
    addDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    doc,
    setDoc,
    onDisconnect,
} from "firebase/firestore";
import styles from "../styles/chat.module.css";

export default function Chat() {
    const [name, setName] = useState("");
    const [nameSubmitted, setNameSubmitted] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const userId = useRef(null);

    // Generate a unique user ID once
    useEffect(() => {
        const stored = localStorage.getItem("chat_user_id");
        if (stored) {
            userId.current = stored;
        } else {
            const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem("chat_user_id", newId);
            userId.current = newId;
        }

        const storedName = localStorage.getItem("chat_user_name");
        if (storedName) {
            setName(storedName);
            setNameSubmitted(true);
        }
    }, []);

    // Listen to messages in real time
    useEffect(() => {
        const q = query(collection(db, "messages"), orderBy("timestamp"));
        const unsub = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMessages(msgs);
        });
        return () => unsub();
    }, []);

    // Listen to typing indicators
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "typing"), (snapshot) => {
            const typers = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter(
                    (u) =>
                        u.isTyping &&
                        u.id !== userId.current &&
                        Date.now() - u.lastTyping < 5000,
                );
            setTypingUsers(typers);
        });
        return () => unsub();
    }, []);

    // Listen to online presence
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "presence"), (snapshot) => {
            const online = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((u) => u.isOnline);
            setOnlineUsers(online);
        });
        return () => unsub();
    }, []);

    // Set presence when user joins

    useEffect(() => {
        if (!nameSubmitted || !userId.current) return;

        const presenceRef = doc(db, "presence", userId.current);

        // Write online status immediately
        setDoc(presenceRef, {
            id: userId.current,
            name,
            isOnline: true,
            lastSeen: Date.now(),
        });

        // Keep presence alive every 30 seconds
        const interval = setInterval(() => {
            setDoc(
                presenceRef,
                {
                    id: userId.current,
                    name,
                    isOnline: true,
                    lastSeen: Date.now(),
                },
                { merge: true },
            );
        }, 30000);

        // Mark offline when tab closes
        const handleUnload = () => {
            setDoc(presenceRef, { isOnline: false }, { merge: true });
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            clearInterval(interval);
            window.removeEventListener("beforeunload", handleUnload);
            setDoc(presenceRef, { isOnline: false }, { merge: true });
        };
    }, [nameSubmitted, name]);

    // Scroll to bottom when new message arrives
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleNameSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        localStorage.setItem("chat_user_name", name.trim());
        setNameSubmitted(true);
    };

    const handleTyping = async () => {
        if (!userId.current) return;

        await setDoc(doc(db, "typing", userId.current), {
            id: userId.current,
            name,
            isTyping: true,
            lastTyping: Date.now(),
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(async () => {
            await setDoc(
                doc(db, "typing", userId.current),
                { isTyping: false },
                { merge: true },
            );
        }, 2000);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        await addDoc(collection(db, "messages"), {
            text: message.trim(),
            senderName: name,
            senderId: userId.current,
            timestamp: serverTimestamp(),
        });

        // Clear typing indicator after sending
        await setDoc(
            doc(db, "typing", userId.current),
            { isTyping: false },
            { merge: true },
        );

        setMessage("");
    };

    // Name entry screen
    if (!nameSubmitted) {
        return (
            <div className={styles.nameScreen}>
                <div className={styles.nameCard}>
                    <h1>Welcome to LiveChat</h1>
                    <p>Enter your name to start chatting</p>
                    <form onSubmit={handleNameSubmit}>
                        <input
                            type="text"
                            placeholder="Your name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            maxLength={30}
                        />
                        <button type="submit">Join Chat</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2>LiveChat</h2>
                    <span className={styles.onlineCount}>
                        {onlineUsers.length} online
                    </span>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.avatar}>{name[0].toUpperCase()}</div>
                    <span className={styles.userName}>{name}</span>
                </div>
            </div>

            {/* Online users */}
            {onlineUsers.length > 0 && (
                <div className={styles.onlineBar}>
                    {onlineUsers.map((u) => (
                        <div key={u.id} className={styles.onlineUser}>
                            <span className={styles.onlineDot} />
                            {u.name}
                        </div>
                    ))}
                </div>
            )}

            {/* Messages */}
            <div className={styles.messages}>
                {messages.length === 0 && (
                    <div className={styles.emptyState}>
                        No messages yet. Say hello! 👋
                    </div>
                )}
                {messages.map((msg) => {
                    const isOwn = msg.senderId === userId.current;
                    return (
                        <div
                            key={msg.id}
                            className={`${styles.messageRow} ${isOwn ? styles.ownRow : ""}`}
                        >
                            {!isOwn && (
                                <div className={styles.avatar}>
                                    {msg.senderName[0].toUpperCase()}
                                </div>
                            )}
                            <div
                                className={`${styles.bubble} ${isOwn ? styles.ownBubble : ""}`}
                            >
                                {!isOwn && (
                                    <span className={styles.senderName}>
                                        {msg.senderName}
                                    </span>
                                )}
                                <p>{msg.text}</p>
                                <span className={styles.time}>
                                    {msg.timestamp?.toDate
                                        ? msg.timestamp
                                              .toDate()
                                              .toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                        : "just now"}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
                <div className={styles.typingIndicator}>
                    {typingUsers.map((u) => u.name).join(", ")}{" "}
                    {typingUsers.length === 1 ? "is" : "are"} typing...
                </div>
            )}

            {/* Input */}
            <form className={styles.inputArea} onSubmit={sendMessage}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        handleTyping();
                    }}
                />
                <button type="submit" disabled={!message.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
}
