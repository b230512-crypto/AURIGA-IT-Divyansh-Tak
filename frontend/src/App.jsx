import { useState } from "react";
import axios from "axios";
import "./App.css";

//const API = "https://crispy-sniffle-p7jgww55p7qjh6xg9-5000.app.github.dev/api/rewards";
const API = "/api/rewards";

function App() {
    const [phone, setPhone] = useState("");
    const [member, setMember] = useState(null);
    const [purchaseAmount, setPurchaseAmount] = useState("");
    const [pointsToRedeem, setPointsToRedeem] = useState("");
    const [referenceId, setReferenceId] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const lookupMember = async () => {
        if (!phone.trim()) {
            setMessage("Enter a phone number");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const res = await axios.get(
                `${API}/member/${encodeURIComponent(phone)}`
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
            setMessage("Phone, purchase amount and reference ID are required");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            await axios.post(`${API}/earn`, {
                phone,
                purchaseAmount: Number(purchaseAmount),
                referenceId
            });

            setMessage("Points earned successfully");
            await lookupMember();

            setPurchaseAmount("");
            setReferenceId("");
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
            setMessage("Phone, points and reference ID are required");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            await axios.post(`${API}/redeem`, {
                phone,
                pointsToRedeem: Number(pointsToRedeem),
                referenceId
            });

            setMessage("Points redeemed successfully");
            await lookupMember();

            setPointsToRedeem("");
            setReferenceId("");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Redeem request failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app">
            <header>
                <h1>☕ Café Rewards</h1>
                <p>Member Rewards Management System</p>
            </header>

            <main>
                <section className="card">
                    <h2>Member Lookup</h2>

                    <div className="row">
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Phone number"
                        />

                        <button onClick={lookupMember}>
                            {loading ? "Loading..." : "Search"}
                        </button>
                    </div>
                </section>

                {member && (
                    <section className="card member">
                        <div>
                            <span>Name</span>
                            <strong>{member.name}</strong>
                        </div>

                        <div>
                            <span>Phone</span>
                            <strong>{member.phone}</strong>
                        </div>

                        <div>
                            <span>Tier</span>
                            <strong>{member.tier}</strong>
                        </div>

                        <div>
                            <span>Earn Rate</span>
                            <strong>{member.earnRate}x</strong>
                        </div>

                        <div>
                            <span>Lifetime Points</span>
                            <strong>{member.lifetimePoints}</strong>
                        </div>

                        <div>
                            <span>Current Balance</span>
                            <strong>{member.currentBalance}</strong>
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

                {message && (
                    <div className="message">
                        {message}
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
