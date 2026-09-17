import { useState } from "react";
import axios from "axios";
import "./App.css";

const API = "/api";

function Login({ onLogin }) {
    const [mode, setMode] = useState("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const submit = async () => {
        if (!username || !password) {
            setMessage("Username and password are required");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const endpoint =
                mode === "login"
                    ? `${API}/auth/login`
                    : `${API}/auth/register`;

            const body =
                mode === "login"
                    ? {
                        username,
                        password
                    }
                    : {
                        username,
                        password,
                        role: "STAFF"
                    };

            const res = await axios.post(endpoint, body);

            if (mode === "register") {
                setMessage(
                    "Registration successful. You can now login."
                );
                setMode("login");
                setPassword("");
                return;
            }

            const token = res.data.data.token;

            localStorage.setItem("token", token);
            onLogin(token);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                <div className="login-icon">☕</div>

                <h1>Café Rewards</h1>

                <p className="login-subtitle">
                    Staff Rewards Portal
                </p>

                <div className="auth-tabs">

                    <button
                        className={
                            mode === "login"
                                ? "active"
                                : ""
                        }
                        onClick={() => {
                            setMode("login");
                            setMessage("");
                        }}
                    >
                        Login
                    </button>

                    <button
                        className={
                            mode === "register"
                                ? "active"
                                : ""
                        }
                        onClick={() => {
                            setMode("register");
                            setMessage("");
                        }}
                    >
                        Register
                    </button>

                </div>

                <div className="login-form">

                    <label>Username</label>

                    <input
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                        placeholder="Enter username"
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        placeholder="Enter password"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                submit();
                            }
                        }}
                    />

                    <button
                        onClick={submit}
                        disabled={loading}
                    >
                        {loading
                            ? "Please wait..."
                            : mode === "login"
                                ? "Sign In"
                                : "Create Account"}
                    </button>

                    {message && (
                        <div className="login-error">
                            {message}
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}

function Dashboard({ token, onLogout }) {
    const [phone, setPhone] = useState("");
    const [member, setMember] = useState(null);

    const [purchaseAmount, setPurchaseAmount] =
        useState("");

    const [pointsToRedeem, setPointsToRedeem] =
        useState("");

    const [referenceId, setReferenceId] =
        useState("");

    const [outbox, setOutbox] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    const lookupMember = async () => {
        if (!phone.trim()) {
            setMessage("Enter a phone number");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const res = await axios.get(
                `${API}/rewards/member/${encodeURIComponent(phone)}`
            );

            setMember(res.data.data);
        } catch (error) {
            setMember(null);

            setMessage(
                error.response?.data?.message ||
                "Member lookup failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const earn = async () => {
        if (!phone || !purchaseAmount || !referenceId) {
            setMessage(
                "Phone, purchase amount and reference ID are required"
            );
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            await axios.post(
                `${API}/rewards/earn`,
                {
                    phone,
                    purchaseAmount: Number(purchaseAmount),
                    referenceId
                },
                authConfig
            );

            setMessage("Points earned successfully");

            setPurchaseAmount("");
            setReferenceId("");

            await lookupMember();
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Earn request failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const redeem = async () => {
        if (!phone || !pointsToRedeem || !referenceId) {
            setMessage(
                "Phone, points and reference ID are required"
            );
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            await axios.post(
                `${API}/rewards/redeem`,
                {
                    phone,
                    pointsToRedeem: Number(pointsToRedeem),
                    referenceId
                },
                authConfig
            );

            setMessage("Points redeemed successfully");

            setPointsToRedeem("");
            setReferenceId("");

            await lookupMember();
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Redeem request failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const runClock = async () => {
        try {
            setLoading(true);
            setMessage("");

            const res = await axios.post(
                "/clock",
                {}
            );

            setMessage(
                `Expiry clock completed. ${res.data.data.expiredPoints} points expired.`
            );

            if (phone) {
                await lookupMember();
            }
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Clock execution failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const loadOutbox = async () => {
        try {
            setLoading(true);
            setMessage("");

            const res = await axios.get(
                "/outbox"
            );

            setOutbox(res.data.data);

            setMessage(
                `${res.data.data.length} notification event(s)`
            );
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to load outbox"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app">

            <header>

                <div className="header-content">

                    <div>
                        <h1>☕ Café Rewards</h1>
                        <p>
                            Member Rewards Management System
                        </p>
                    </div>

                    <button
                        className="logout-button"
                        onClick={onLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>

            <main>

                <section className="card">

                    <h2>Member Lookup</h2>

                    <div className="row">

                        <input
                            value={phone}
                            onChange={(e) =>
                                setPhone(e.target.value)
                            }
                            placeholder="Enter phone number"
                        />

                        <button onClick={lookupMember}>
                            {loading
                                ? "Searching..."
                                : "Search Member"}
                        </button>

                    </div>

                </section>

                {member && (
                    <section className="card">

                        <div className="member-heading">
                            <div>
                                <h2>{member.name}</h2>
                                <p>{member.phone}</p>
                            </div>

                            <div className="tier-badge">
                                {member.tier}
                            </div>
                        </div>

                        <div className="member">

                            <div>
                                <span>Earn Rate</span>
                                <strong>
                                    {member.earnRate}x
                                </strong>
                            </div>

                            <div>
                                <span>Lifetime Points</span>
                                <strong>
                                    {member.lifetimePoints}
                                </strong>
                            </div>

                            <div>
                                <span>Available Balance</span>
                                <strong>
                                    {member.currentBalance}
                                </strong>
                            </div>

                        </div>

                    </section>
                )}

                <section className="actions">

                    <div className="card">

                        <h2>Earn Points</h2>

                        <input
                            type="number"
                            min="0"
                            placeholder="Purchase amount"
                            value={purchaseAmount}
                            onChange={(e) =>
                                setPurchaseAmount(e.target.value)
                            }
                        />

                        <input
                            placeholder="Reference ID"
                            value={referenceId}
                            onChange={(e) =>
                                setReferenceId(e.target.value)
                            }
                        />

                        <button onClick={earn}>
                            Earn Points
                        </button>

                    </div>

                    <div className="card">

                        <h2>Redeem Points</h2>

                        <input
                            type="number"
                            min="0"
                            placeholder="Points to redeem"
                            value={pointsToRedeem}
                            onChange={(e) =>
                                setPointsToRedeem(e.target.value)
                            }
                        />

                        <input
                            placeholder="Reference ID"
                            value={referenceId}
                            onChange={(e) =>
                                setReferenceId(e.target.value)
                            }
                        />

                        <button onClick={redeem}>
                            Redeem Points
                        </button>

                    </div>

                </section>

                <section className="card">

                    <h2>System Controls</h2>

                    <div className="row">

                        <button onClick={runClock}>
                            Run Expiry Clock
                        </button>

                        <button
                            className="secondary"
                            onClick={loadOutbox}
                        >
                            View Notifications
                        </button>

                    </div>

                </section>

                {outbox.length > 0 && (
                    <section className="card">

                        <h2>Notification Outbox</h2>

                        {outbox.map((event) => (
                            <div
                                className="outbox-event"
                                key={event._id}
                            >
                                <strong>
                                    {event.eventType}
                                </strong>

                                <p>
                                    {event.payload?.previousTier}
                                    {" → "}
                                    {event.payload?.newTier}
                                </p>

                                <small>
                                    {new Date(
                                        event.createdAt
                                    ).toLocaleString()}
                                </small>
                            </div>
                        ))}

                    </section>
                )}

                {message && (
                    <div className="message">
                        {message}
                    </div>
                )}

            </main>
        </div>
    );
}

function App() {
    const [token, setToken] = useState(
        localStorage.getItem("token")
    );

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
    };

    if (!token) {
        return (
            <Login
                onLogin={setToken}
            />
        );
    }

    return (
        <Dashboard
            token={token}
            onLogout={logout}
        />
    );
}

export default App;
