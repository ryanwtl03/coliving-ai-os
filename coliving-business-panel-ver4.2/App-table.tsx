import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          "http://127.0.0.1:4001/coliving-ai-os/api/raw-user-message/",
          {
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": "supersecretapikey123",
            },
          }
        );
        setMessages(res.data);
      } catch (err) {
        setError("Failed to fetch messages");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  if (loading) return <p>Loading messages...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📩 User Messages</h2>
      <table border="1" cellPadding="8" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>User Namespace</th>
            <th>Message</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg) => (
            <tr key={msg.id}>
              <td>{msg.id}</td>
              <td>{msg.user_ns}</td>
              <td>{msg.content}</td>
              <td>{msg.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
