import { useState, useEffect, useRef } from "react";
import { db } from "../../lib/firebase";
import {
    collection,
    addDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    doc,
    setDoc,
    getDocs,
    where,
} from "firebase/firestore";
import { useRouter } from "next/router";
import styles from "../../styles/chat.module.css";

export default function Room() {
    const router = useRouter();
    const { roomId } = router.query;

    const [name, setName] = useState("");
    const [roomData, setRoomData] = useState(null);
    const [authorized, setAuthorized] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [copied, setCopied] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const userId = useRef(null);

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
        if (storedName) setName(storedName);
        else router.push("/");
    }, []);

    // Load room data
    useEffect(() => {
        if (!roomId) return;
        const fetchRoom = async () => {
            const q = query(
                collection(db, "rooms"),
                where("roomId", "==", roomId),
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                setRoomData(snapshot.docs[0].data());
            } else {
                router.push("/");
            }
        };
        fetchRoom();
    }, [roomId]);

    // Check if already authorized
    useEffect(() => {
        if (!roomId) return;
        const auth = localStorage.getItem(`room_auth_${roomId}`);
        if (auth === "true") setAuthorized(true);
    }, [roomId]);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordInput.trim() === roomData?.password) {
            localStorage.setItem(`room_auth_${roomId}`, "true");
            setAuthorized(true);
            setPasswordError("");
        } else {
            setPasswordError("Wrong password. Try again.");
        }
    };

    // Listen to messages
    useEffect(() => {
        if (!roomId || !authorized) return;
        const q = query(
            collection(db, `rooms/${roomId}/messages`),
            orderBy("timestamp"),
        );
        const unsub = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMessages(msgs);
        });
        return () => unsub();
    }, [roomId, authorized]);

    // Listen to typing
    useEffect(() => {
        if (!roomId || !authorized) return;
        const unsub = onSnapshot(
            collection(db, `rooms/${roomId}/typing`),
            (snapshot) => {
                const typers = snapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() }))
                    .filter(
                        (u) =>
                            u.isTyping &&
                            u.id !== userId.current &&
                            Date.now() - u.lastTyping < 5000,
                    );
                setTypingUsers(typers);
            },
        );
        return () => unsub();
    }, [roomId, authorized]);

    // Listen to presence
    useEffect(() => {
        if (!roomId || !authorized) return;
        const unsub = onSnapshot(
            collection(db, `rooms/${roomId}/presence`),
            (snapshot) => {
                const online = snapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() }))
                    .filter((u) => u.isOnline);
                setOnlineUsers(online);
            },
        );
        return () => unsub();
    }, [roomId, authorized]);

    // Set presence
    useEffect(() => {
        if (!roomId || !authorized || !userId.current || !name) return;
        const presenceRef = doc(db, `rooms/${roomId}/presence`, userId.current);

        setDoc(presenceRef, {
            id: userId.current,
            name,
            isOnline: true,
            lastSeen: Date.now(),
        });

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

        const handleUnload = () => {
            setDoc(presenceRef, { isOnline: false }, { merge: true });
        };
        window.addEventListener("beforeunload", handleUnload);

        return () => {
            clearInterval(interval);
            window.removeEventListener("beforeunload", handleUnload);
            setDoc(presenceRef, { isOnline: false }, { merge: true });
        };
    }, [roomId, authorized, name]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleTyping = async () => {
        if (!userId.current || !roomId) return;
        await setDoc(doc(db, `rooms/${roomId}/typing`, userId.current), {
            id: userId.current,
            name,
            isTyping: true,
            lastTyping: Date.now(),
        });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(async () => {
            await setDoc(
                doc(db, `rooms/${roomId}/typing`, userId.current),
                { isTyping: false },
                { merge: true },
            );
        }, 2000);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        await addDoc(collection(db, `rooms/${roomId}/messages`), {
            text: message.trim(),
            senderName: name,
            senderId: userId.current,
            timestamp: serverTimestamp(),
        });
        await setDoc(
            doc(db, `rooms/${roomId}/typing`, userId.current),
            { isTyping: false },
            { merge: true },
        );
        setMessage("");
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Password screen
    if (roomData && !authorized) {
        return (
            <div className={styles.nameScreen}>
                <div className={styles.nameCard}>
                    <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>
                        🔒
                    </div>
                    <h1>{roomData.name}</h1>
                    <p>Enter the password to join this room</p>
                    <form onSubmit={handlePasswordSubmit}>
                        <input
                            type="password"
                            placeholder="Room password..."
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            autoFocus
                        />
                        {passwordError && (
                            <p
                                style={{
                                    color: "#e53935",
                                    fontSize: "0.85rem",
                                }}
                            >
                                {passwordError}
                            </p>
                        )}
                        <button type="submit">Join Room</button>
                    </form>
                    <button
                        onClick={() => router.push("/")}
                        style={{
                            marginTop: "1rem",
                            background: "none",
                            border: "none",
                            color: "#6c63ff",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                        }}
                    >
                        ← Back to home
                    </button>
                </div>
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <button
                        onClick={() => router.push("/")}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "1.2rem",
                            marginRight: "8px",
                        }}
                    >
                        ←
                    </button>
                    <h2>{roomData?.name || "Room"}</h2>
                    <span className={styles.onlineCount}>
                        {onlineUsers.length} online
                    </span>
                </div>
                <div className={styles.headerRight}>
                    <button
                        onClick={copyRoomCode}
                        style={{
                            background: copied ? "#e8f5e9" : "#f5f4ff",
                            border: "1px solid",
                            borderColor: copied ? "#4caf50" : "#6c63ff",
                            borderRadius: "8px",
                            padding: "4px 12px",
                            fontSize: "0.8rem",
                            color: copied ? "#2e7d32" : "#6c63ff",
                            cursor: "pointer",
                            fontWeight: "600",
                        }}
                    >
                        {copied ? "✓ Copied!" : `Code: ${roomId}`}
                    </button>
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
                        <br />
                        <span
                            style={{
                                fontSize: "0.85rem",
                                color: "#aaa",
                                marginTop: "8px",
                                display: "block",
                            }}
                        >
                            Share code <strong>{roomId}</strong> with friends to
                            invite them
                        </span>
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
