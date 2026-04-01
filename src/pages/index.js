// // import { useState, useEffect, useRef } from "react";
// // import { db } from "../lib/firebase";
// // import {
// //     collection,
// //     addDoc,
// //     onSnapshot,
// //     orderBy,
// //     query,
// //     serverTimestamp,
// //     doc,
// //     setDoc,
// //     onDisconnect,
// // } from "firebase/firestore";
// // import styles from "../styles/chat.module.css";

// // export default function Chat() {
// //     const [name, setName] = useState("");
// //     const [nameSubmitted, setNameSubmitted] = useState(false);
// //     const [message, setMessage] = useState("");
// //     const [messages, setMessages] = useState([]);
// //     const [typingUsers, setTypingUsers] = useState([]);
// //     const [onlineUsers, setOnlineUsers] = useState([]);
// //     const messagesEndRef = useRef(null);
// //     const typingTimeoutRef = useRef(null);
// //     const userId = useRef(null);

// //     // Generate a unique user ID once
// //     useEffect(() => {
// //         const stored = localStorage.getItem("chat_user_id");
// //         if (stored) {
// //             userId.current = stored;
// //         } else {
// //             const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
// //             localStorage.setItem("chat_user_id", newId);
// //             userId.current = newId;
// //         }

// //         const storedName = localStorage.getItem("chat_user_name");
// //         if (storedName) {
// //             setName(storedName);
// //             setNameSubmitted(true);
// //         }
// //     }, []);

// //     // Listen to messages in real time
// //     useEffect(() => {
// //         const q = query(collection(db, "messages"), orderBy("timestamp"));
// //         const unsub = onSnapshot(q, (snapshot) => {
// //             const msgs = snapshot.docs.map((doc) => ({
// //                 id: doc.id,
// //                 ...doc.data(),
// //             }));
// //             setMessages(msgs);
// //         });
// //         return () => unsub();
// //     }, []);

// //     // Listen to typing indicators
// //     useEffect(() => {
// //         const unsub = onSnapshot(collection(db, "typing"), (snapshot) => {
// //             const typers = snapshot.docs
// //                 .map((doc) => ({ id: doc.id, ...doc.data() }))
// //                 .filter(
// //                     (u) =>
// //                         u.isTyping &&
// //                         u.id !== userId.current &&
// //                         Date.now() - u.lastTyping < 5000,
// //                 );
// //             setTypingUsers(typers);
// //         });
// //         return () => unsub();
// //     }, []);

// //     // Listen to online presence
// //     useEffect(() => {
// //         const unsub = onSnapshot(collection(db, "presence"), (snapshot) => {
// //             const online = snapshot.docs
// //                 .map((doc) => ({ id: doc.id, ...doc.data() }))
// //                 .filter((u) => u.isOnline);
// //             setOnlineUsers(online);
// //         });
// //         return () => unsub();
// //     }, []);

// //     // Set presence when user joins

// //     useEffect(() => {
// //         if (!nameSubmitted || !userId.current) return;

// //         const presenceRef = doc(db, "presence", userId.current);

// //         // Write online status immediately
// //         setDoc(presenceRef, {
// //             id: userId.current,
// //             name,
// //             isOnline: true,
// //             lastSeen: Date.now(),
// //         });

// //         // Keep presence alive every 30 seconds
// //         const interval = setInterval(() => {
// //             setDoc(
// //                 presenceRef,
// //                 {
// //                     id: userId.current,
// //                     name,
// //                     isOnline: true,
// //                     lastSeen: Date.now(),
// //                 },
// //                 { merge: true },
// //             );
// //         }, 30000);

// //         // Mark offline when tab closes
// //         const handleUnload = () => {
// //             setDoc(presenceRef, { isOnline: false }, { merge: true });
// //         };

// //         window.addEventListener("beforeunload", handleUnload);

// //         return () => {
// //             clearInterval(interval);
// //             window.removeEventListener("beforeunload", handleUnload);
// //             setDoc(presenceRef, { isOnline: false }, { merge: true });
// //         };
// //     }, [nameSubmitted, name]);

// //     // Scroll to bottom when new message arrives
// //     useEffect(() => {
// //         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
// //     }, [messages]);

// //     const handleNameSubmit = (e) => {
// //         e.preventDefault();
// //         if (!name.trim()) return;
// //         localStorage.setItem("chat_user_name", name.trim());
// //         setNameSubmitted(true);
// //     };

// //     const handleTyping = async () => {
// //         if (!userId.current) return;

// //         await setDoc(doc(db, "typing", userId.current), {
// //             id: userId.current,
// //             name,
// //             isTyping: true,
// //             lastTyping: Date.now(),
// //         });

// //         if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

// //         typingTimeoutRef.current = setTimeout(async () => {
// //             await setDoc(
// //                 doc(db, "typing", userId.current),
// //                 { isTyping: false },
// //                 { merge: true },
// //             );
// //         }, 2000);
// //     };

// //     const sendMessage = async (e) => {
// //         e.preventDefault();
// //         if (!message.trim()) return;

// //         await addDoc(collection(db, "messages"), {
// //             text: message.trim(),
// //             senderName: name,
// //             senderId: userId.current,
// //             timestamp: serverTimestamp(),
// //         });

// //         // Clear typing indicator after sending
// //         await setDoc(
// //             doc(db, "typing", userId.current),
// //             { isTyping: false },
// //             { merge: true },
// //         );

// //         setMessage("");
// //     };

// //     // Name entry screen
// //     if (!nameSubmitted) {
// //         return (
// //             <div className={styles.nameScreen}>
// //                 <div className={styles.nameCard}>
// //                     <h1>Welcome to LiveChat</h1>
// //                     <p>Enter your name to start chatting</p>
// //                     <form onSubmit={handleNameSubmit}>
// //                         <input
// //                             type="text"
// //                             placeholder="Your name..."
// //                             value={name}
// //                             onChange={(e) => setName(e.target.value)}
// //                             autoFocus
// //                             maxLength={30}
// //                         />
// //                         <button type="submit">Join Chat</button>
// //                     </form>
// //                 </div>
// //             </div>
// //         );
// //     }

// //     return (
// //         <div className={styles.container}>
// //             {/* Header */}
// //             <div className={styles.header}>
// //                 <div className={styles.headerLeft}>
// //                     <h2>LiveChat</h2>
// //                     <span className={styles.onlineCount}>
// //                         {onlineUsers.length} online
// //                     </span>
// //                 </div>
// //                 <div className={styles.headerRight}>
// //                     <div className={styles.avatar}>{name[0].toUpperCase()}</div>
// //                     <span className={styles.userName}>{name}</span>
// //                 </div>
// //             </div>

// //             {/* Online users */}
// //             {onlineUsers.length > 0 && (
// //                 <div className={styles.onlineBar}>
// //                     {onlineUsers.map((u) => (
// //                         <div key={u.id} className={styles.onlineUser}>
// //                             <span className={styles.onlineDot} />
// //                             {u.name}
// //                         </div>
// //                     ))}
// //                 </div>
// //             )}

// //             {/* Messages */}
// //             <div className={styles.messages}>
// //                 {messages.length === 0 && (
// //                     <div className={styles.emptyState}>
// //                         No messages yet. Say hello! 👋
// //                     </div>
// //                 )}
// //                 {messages.map((msg) => {
// //                     const isOwn = msg.senderId === userId.current;
// //                     return (
// //                         <div
// //                             key={msg.id}
// //                             className={`${styles.messageRow} ${isOwn ? styles.ownRow : ""}`}
// //                         >
// //                             {!isOwn && (
// //                                 <div className={styles.avatar}>
// //                                     {msg.senderName[0].toUpperCase()}
// //                                 </div>
// //                             )}
// //                             <div
// //                                 className={`${styles.bubble} ${isOwn ? styles.ownBubble : ""}`}
// //                             >
// //                                 {!isOwn && (
// //                                     <span className={styles.senderName}>
// //                                         {msg.senderName}
// //                                     </span>
// //                                 )}
// //                                 <p>{msg.text}</p>
// //                                 <span className={styles.time}>
// //                                     {msg.timestamp?.toDate
// //                                         ? msg.timestamp
// //                                               .toDate()
// //                                               .toLocaleTimeString([], {
// //                                                   hour: "2-digit",
// //                                                   minute: "2-digit",
// //                                               })
// //                                         : "just now"}
// //                                 </span>
// //                             </div>
// //                         </div>
// //                     );
// //                 })}
// //                 <div ref={messagesEndRef} />
// //             </div>

// //             {/* Typing indicator */}
// //             {typingUsers.length > 0 && (
// //                 <div className={styles.typingIndicator}>
// //                     {typingUsers.map((u) => u.name).join(", ")}{" "}
// //                     {typingUsers.length === 1 ? "is" : "are"} typing...
// //                 </div>
// //             )}

// //             {/* Input */}
// //             <form className={styles.inputArea} onSubmit={sendMessage}>
// //                 <input
// //                     type="text"
// //                     placeholder="Type a message..."
// //                     value={message}
// //                     onChange={(e) => {
// //                         setMessage(e.target.value);
// //                         handleTyping();
// //                     }}
// //                 />
// //                 <button type="submit" disabled={!message.trim()}>
// //                     Send
// //                 </button>
// //             </form>
// //         </div>
// //     );
// // }

// import { useState, useEffect } from "react";
// import { db } from "../lib/firebase";
// import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
// import { useRouter } from "next/router";
// import styles from "../styles/Home.module.css";

// export default function Home() {
//     const [name, setName] = useState("");
//     const [nameSubmitted, setNameSubmitted] = useState(false);
//     const [view, setView] = useState("dashboard"); // dashboard | create | join
//     const [roomName, setRoomName] = useState("");
//     const [password, setPassword] = useState("");
//     const [joinCode, setJoinCode] = useState("");
//     const [joinPassword, setJoinPassword] = useState("");
//     const [error, setError] = useState("");
//     const [loading, setLoading] = useState(false);
//     const router = useRouter();

//     useEffect(() => {
//         const storedName = localStorage.getItem("chat_user_name");
//         if (storedName) {
//             setName(storedName);
//             setNameSubmitted(true);
//         }
//     }, []);

//     const handleNameSubmit = (e) => {
//         e.preventDefault();
//         if (!name.trim()) return;
//         localStorage.setItem("chat_user_name", name.trim());
//         setNameSubmitted(true);
//     };

//     const generateRoomId = () => {
//         return Math.random().toString(36).substring(2, 8).toUpperCase();
//     };

//     const handleCreateRoom = async (e) => {
//         e.preventDefault();
//         if (!roomName.trim() || !password.trim()) return;
//         setLoading(true);
//         setError("");

//         try {
//             const roomId = generateRoomId();
//             await addDoc(collection(db, "rooms"), {
//                 roomId,
//                 name: roomName.trim(),
//                 password: password.trim(),
//                 createdBy: name,
//                 createdAt: Date.now(),
//             });
//             router.push(`/room/${roomId}`);
//         } catch (err) {
//             setError("Failed to create room. Try again.");
//             setLoading(false);
//         }
//     };

//     // const handleJoinRoom = async (e) => {
//     //     e.preventDefault();
//     //     if (!joinCode.trim() || !joinPassword.trim()) return;
//     //     setLoading(true);
//     //     setError("");

//     //     try {
//     //         const q = query(
//     //             collection(db, "rooms"),
//     //             where("roomId", "==", joinCode.trim().toUpperCase()),
//     //         );
//     //         const snapshot = await getDocs(q);

//     //         if (snapshot.empty) {
//     //             setError("Room not found. Check the code and try again.");
//     //             setLoading(false);
//     //             return;
//     //         }

//     //         const room = snapshot.docs[0].data();

//     //         if (room.password !== joinPassword.trim()) {
//     //             setError("Wrong password. Try again.");
//     //             setLoading(false);
//     //             return;
//     //         }

//     //         router.push(`/room/${joinCode.trim().toUpperCase()}`);
//     //     } catch (err) {
//     //         setError("Something went wrong. Try again.");
//     //         setLoading(false);
//     //     }
//     // };

//     const handleJoinRoom = async (e) => {
//         e.preventDefault();
//         if (!joinCode.trim() || !joinPassword.trim()) return;
//         setLoading(true);
//         setError("");

//         try {
//             const q = query(
//                 collection(db, "rooms"),
//                 where("roomId", "==", joinCode.trim().toUpperCase()),
//             );
//             const snapshot = await getDocs(q);

//             if (snapshot.empty) {
//                 setError("Room not found. Check the code and try again.");
//                 setLoading(false);
//                 return;
//             }

//             const room = snapshot.docs[0].data();

//             if (room.password !== joinPassword.trim()) {
//                 setError("Wrong password. Try again.");
//                 setLoading(false);
//                 return;
//             }

//             // ✅ Save auth so room page doesn't ask again
//             localStorage.setItem(
//                 `room_auth_${joinCode.trim().toUpperCase()}`,
//                 "true",
//             );

//             router.push(`/room/${joinCode.trim().toUpperCase()}`);
//         } catch (err) {
//             setError("Something went wrong. Try again.");
//             setLoading(false);
//         }
//     };

//     // Name entry screen
//     if (!nameSubmitted) {
//         return (
//             <div className={styles.nameScreen}>
//                 <div className={styles.nameCard}>
//                     <div className={styles.logo}>💬</div>
//                     <h1>Welcome to LiveChat</h1>
//                     <p>Enter your name to get started</p>
//                     <form onSubmit={handleNameSubmit}>
//                         <input
//                             type="text"
//                             placeholder="Your name..."
//                             value={name}
//                             onChange={(e) => setName(e.target.value)}
//                             autoFocus
//                             maxLength={30}
//                         />
//                         <button type="submit">Continue →</button>
//                     </form>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className={styles.pageWrapper}>
//             <div className={styles.container}>
//                 {/* Header */}
//                 <div className={styles.header}>
//                     <div className={styles.headerLogo}>💬 LiveChat</div>
//                     <div className={styles.headerUser}>
//                         <div className={styles.avatar}>
//                             {name[0].toUpperCase()}
//                         </div>
//                         <span>{name}</span>
//                         <button
//                             className={styles.logoutBtn}
//                             onClick={() => {
//                                 localStorage.removeItem("chat_user_name");
//                                 setNameSubmitted(false);
//                                 setName("");
//                             }}
//                         >
//                             Change name
//                         </button>
//                     </div>
//                 </div>

//                 {/* Dashboard */}
//                 {view === "dashboard" && (
//                     <div className={styles.dashboard}>
//                         <h2>What would you like to do?</h2>
//                         <p>Create a private room or join one with a code</p>
//                         <div className={styles.options}>
//                             <button
//                                 className={styles.optionCard}
//                                 onClick={() => setView("create")}
//                             >
//                                 <span className={styles.optionIcon}>🏠</span>
//                                 <h3>Create a Room</h3>
//                                 <p>
//                                     Start a new private chat and invite friends
//                                 </p>
//                             </button>
//                             <button
//                                 className={styles.optionCard}
//                                 onClick={() => setView("join")}
//                             >
//                                 <span className={styles.optionIcon}>🔑</span>
//                                 <h3>Join a Room</h3>
//                                 <p>Enter a room code and password to join</p>
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 {/* Create Room */}
//                 {view === "create" && (
//                     <div className={styles.formSection}>
//                         <button
//                             className={styles.backBtn}
//                             onClick={() => setView("dashboard")}
//                         >
//                             ← Back
//                         </button>
//                         <h2>Create a Room</h2>
//                         <p>Set a name and password for your room</p>
//                         <form onSubmit={handleCreateRoom}>
//                             <div className={styles.formGroup}>
//                                 <label>Room Name</label>
//                                 <input
//                                     type="text"
//                                     placeholder="e.g. Weekend Trip Planning"
//                                     value={roomName}
//                                     onChange={(e) =>
//                                         setRoomName(e.target.value)
//                                     }
//                                     maxLength={50}
//                                     autoFocus
//                                 />
//                             </div>
//                             <div className={styles.formGroup}>
//                                 <label>Password</label>
//                                 <input
//                                     type="text"
//                                     placeholder="Share this with people you invite"
//                                     value={password}
//                                     onChange={(e) =>
//                                         setPassword(e.target.value)
//                                     }
//                                     maxLength={30}
//                                 />
//                             </div>
//                             {error && <p className={styles.error}>{error}</p>}
//                             <button type="submit" disabled={loading}>
//                                 {loading ? "Creating..." : "Create Room →"}
//                             </button>
//                         </form>
//                     </div>
//                 )}

//                 {/* Join Room */}
//                 {view === "join" && (
//                     <div className={styles.formSection}>
//                         <button
//                             className={styles.backBtn}
//                             onClick={() => setView("dashboard")}
//                         >
//                             ← Back
//                         </button>
//                         <h2>Join a Room</h2>
//                         <p>Enter the room code and password</p>
//                         <form onSubmit={handleJoinRoom}>
//                             <div className={styles.formGroup}>
//                                 <label>Room Code</label>
//                                 <input
//                                     type="text"
//                                     placeholder="e.g. ABC123"
//                                     value={joinCode}
//                                     onChange={(e) =>
//                                         setJoinCode(e.target.value)
//                                     }
//                                     maxLength={6}
//                                     autoFocus
//                                 />
//                             </div>
//                             <div className={styles.formGroup}>
//                                 <label>Password</label>
//                                 <input
//                                     type="password"
//                                     placeholder="Enter room password"
//                                     value={joinPassword}
//                                     onChange={(e) =>
//                                         setJoinPassword(e.target.value)
//                                     }
//                                     maxLength={30}
//                                 />
//                             </div>
//                             {error && <p className={styles.error}>{error}</p>}
//                             <button type="submit" disabled={loading}>
//                                 {loading ? "Joining..." : "Join Room →"}
//                             </button>
//                         </form>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";

export default function Home() {
    const [name, setName] = useState("");
    const [nameSubmitted, setNameSubmitted] = useState(false);
    const [view, setView] = useState("dashboard");
    const [roomName, setRoomName] = useState("");
    const [password, setPassword] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [joinPassword, setJoinPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [myRooms, setMyRooms] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const storedName = localStorage.getItem("chat_user_name");
        if (storedName) {
            setName(storedName);
            setNameSubmitted(true);
        }
    }, []);

    // Load my rooms from localStorage
    useEffect(() => {
        if (!nameSubmitted) return;
        const stored = localStorage.getItem("my_rooms");
        if (stored) {
            try {
                setMyRooms(JSON.parse(stored));
            } catch {
                setMyRooms([]);
            }
        }
    }, [nameSubmitted]);

    const saveRoomToList = (roomId, roomName) => {
        const stored = localStorage.getItem("my_rooms");
        const existing = stored ? JSON.parse(stored) : [];

        // Don't add duplicates
        const alreadyExists = existing.find((r) => r.roomId === roomId);
        if (alreadyExists) return;

        const updated = [
            { roomId, name: roomName, joinedAt: Date.now() },
            ...existing,
        ];
        localStorage.setItem("my_rooms", JSON.stringify(updated));
        setMyRooms(updated);
    };

    const handleNameSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        localStorage.setItem("chat_user_name", name.trim());
        setNameSubmitted(true);
    };

    const generateRoomId = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!roomName.trim() || !password.trim()) return;
        setLoading(true);
        setError("");

        try {
            const roomId = generateRoomId();
            await addDoc(collection(db, "rooms"), {
                roomId,
                name: roomName.trim(),
                password: password.trim(),
                createdBy: name,
                createdAt: Date.now(),
            });

            // Save auth and room to list
            localStorage.setItem(`room_auth_${roomId}`, "true");
            saveRoomToList(roomId, roomName.trim());

            router.push(`/room/${roomId}`);
        } catch (err) {
            setError("Failed to create room. Try again.");
            setLoading(false);
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        if (!joinCode.trim() || !joinPassword.trim()) return;
        setLoading(true);
        setError("");

        try {
            const q = query(
                collection(db, "rooms"),
                where("roomId", "==", joinCode.trim().toUpperCase()),
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setError("Room not found. Check the code and try again.");
                setLoading(false);
                return;
            }

            const room = snapshot.docs[0].data();

            if (room.password !== joinPassword.trim()) {
                setError("Wrong password. Try again.");
                setLoading(false);
                return;
            }

            // Save auth and room to list
            localStorage.setItem(
                `room_auth_${joinCode.trim().toUpperCase()}`,
                "true",
            );
            saveRoomToList(joinCode.trim().toUpperCase(), room.name);

            router.push(`/room/${joinCode.trim().toUpperCase()}`);
        } catch (err) {
            setError("Something went wrong. Try again.");
            setLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    if (!nameSubmitted) {
        return (
            <div className={styles.nameScreen}>
                <div className={styles.nameCard}>
                    <div className={styles.logo}>💬</div>
                    <h1>Welcome to LiveChat</h1>
                    <p>Enter your name to get started</p>
                    <form onSubmit={handleNameSubmit}>
                        <input
                            type="text"
                            placeholder="Your name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            maxLength={30}
                        />
                        <button type="submit">Continue →</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLogo}>💬 LiveChat</div>
                    <div className={styles.headerUser}>
                        <div className={styles.avatar}>
                            {name[0].toUpperCase()}
                        </div>
                        <span>{name}</span>
                        <button
                            className={styles.logoutBtn}
                            onClick={() => {
                                localStorage.removeItem("chat_user_name");
                                setNameSubmitted(false);
                                setName("");
                            }}
                        >
                            Change name
                        </button>
                    </div>
                </div>

                {/* Dashboard */}
                {view === "dashboard" && (
                    <div className={styles.dashboard}>
                        {/* My Rooms */}
                        {myRooms.length > 0 && (
                            <div className={styles.myRoomsSection}>
                                <h3>My Rooms</h3>
                                <div className={styles.roomsList}>
                                    {myRooms.map((room) => (
                                        <button
                                            key={room.roomId}
                                            className={styles.roomItem}
                                            onClick={() =>
                                                router.push(
                                                    `/room/${room.roomId}`,
                                                )
                                            }
                                        >
                                            <div
                                                className={styles.roomItemLeft}
                                            >
                                                <span
                                                    className={
                                                        styles.roomItemIcon
                                                    }
                                                >
                                                    🏠
                                                </span>
                                                <div>
                                                    <p
                                                        className={
                                                            styles.roomItemName
                                                        }
                                                    >
                                                        {room.name}
                                                    </p>
                                                    <p
                                                        className={
                                                            styles.roomItemMeta
                                                        }
                                                    >
                                                        {room.roomId} · joined{" "}
                                                        {formatTime(
                                                            room.joinedAt,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={styles.roomItemArrow}
                                            >
                                                →
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <h2>
                            {myRooms.length > 0
                                ? "Start something new"
                                : "What would you like to do?"}
                        </h2>
                        {myRooms.length === 0 && (
                            <p>Create a private room or join one with a code</p>
                        )}
                        <div className={styles.options}>
                            <button
                                className={styles.optionCard}
                                onClick={() => {
                                    setError("");
                                    setView("create");
                                }}
                            >
                                <span className={styles.optionIcon}>🏠</span>
                                <h3>Create a Room</h3>
                                <p>
                                    Start a new private chat and invite friends
                                </p>
                            </button>
                            <button
                                className={styles.optionCard}
                                onClick={() => {
                                    setError("");
                                    setView("join");
                                }}
                            >
                                <span className={styles.optionIcon}>🔑</span>
                                <h3>Join a Room</h3>
                                <p>Enter a room code and password to join</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Room */}
                {view === "create" && (
                    <div className={styles.formSection}>
                        <button
                            className={styles.backBtn}
                            onClick={() => {
                                setError("");
                                setView("dashboard");
                            }}
                        >
                            ← Back
                        </button>
                        <h2>Create a Room</h2>
                        <p>Set a name and password for your room</p>
                        <form onSubmit={handleCreateRoom}>
                            <div className={styles.formGroup}>
                                <label>Room Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Weekend Trip Planning"
                                    value={roomName}
                                    onChange={(e) =>
                                        setRoomName(e.target.value)
                                    }
                                    maxLength={50}
                                    autoFocus
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Password</label>
                                <input
                                    type="text"
                                    placeholder="Share this with people you invite"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    maxLength={30}
                                />
                            </div>
                            {error && <p className={styles.error}>{error}</p>}
                            <button type="submit" disabled={loading}>
                                {loading ? "Creating..." : "Create Room →"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Join Room */}
                {view === "join" && (
                    <div className={styles.formSection}>
                        <button
                            className={styles.backBtn}
                            onClick={() => {
                                setError("");
                                setView("dashboard");
                            }}
                        >
                            ← Back
                        </button>
                        <h2>Join a Room</h2>
                        <p>Enter the room code and password</p>
                        <form onSubmit={handleJoinRoom}>
                            <div className={styles.formGroup}>
                                <label>Room Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. ABC123"
                                    value={joinCode}
                                    onChange={(e) =>
                                        setJoinCode(e.target.value)
                                    }
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter room password"
                                    value={joinPassword}
                                    onChange={(e) =>
                                        setJoinPassword(e.target.value)
                                    }
                                    maxLength={30}
                                />
                            </div>
                            {error && <p className={styles.error}>{error}</p>}
                            <button type="submit" disabled={loading}>
                                {loading ? "Joining..." : "Join Room →"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
