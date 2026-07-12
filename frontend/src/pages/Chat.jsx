import React, { useState } from "react";
import api from "../api/axios";
import "../styling/Chat.css";

function AIAnswer() {

    const [query, setQuery] = useState("");
    const [method, setMethod] = useState("");
    const [answer, setAnswer] = useState("");
    const [documents, setDocuments] = useState("");
    const [cost, setCost] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleMethodChange = (event) => {

        setMethod(event.target.value);

    };

    const sendMessage = async () => {

        try {

            setLoading(true);
            setError(null);

            const response = await api.post("/query", {

                query,
                method,

            });

            console.log(response.data);

            setAnswer(response.data.answer);
            setDocuments(response.data.document);
            setCost(response.data.cost);

            setQuery("");

        }

        catch (err) {

            console.log(err);

            setError(

                err.response?.data?.detail ||

                "Failed to contact backend."

            );

            setAnswer("");
            setDocuments("");
            setCost(0);

        }

        finally {

            setLoading(false);

        }

    };

    return (

        <div className="chat-page">

            <div className="chat-card">

                <h2>Road Design Assistant</h2>

                <textarea

                    className="chat-input"

                    value={query}

                    onChange={(e) => setQuery(e.target.value)}

                    placeholder="Ask a road design, pavement, geometric design or construction question..."

                />

                <div className="method-box">

                    <label>

                        <input

                            type="radio"

                            value="hybrid"

                            checked={method === "hybrid"}

                            onChange={handleMethodChange}

                        />

                        Hybrid RAG

                    </label>

                    <label>

                        <input

                            type="radio"

                            value="vectorless"

                            checked={method === "vectorless"}

                            onChange={handleMethodChange}

                        />

                        Vectorless RAG

                    </label>

                </div>

                <p>

                    <strong>Method:</strong> {method || "Not selected"}

                </p>

                <button

                    className="btn-primary"

                    onClick={sendMessage}

                    disabled={loading}

                >

                    {loading ? "Sending..." : "Send Query"}

                </button>

            </div>

            {error && (

                <div className="response-card">

                    <h3>Error</h3>

                    <p>{error}</p>

                </div>

            )}

            {answer && (

                <div className="response-card">

                    <h3>AI Response</h3>

                    <p>{answer}</p>

                    <hr />

                    <h3>Documents Used</h3>

                    <p>{documents}</p>

                    <hr />

                    <h3>Estimated Query Cost</h3>

                    <p>${cost}</p>

                </div>

            )}

        </div>

    );

}

export default AIAnswer;