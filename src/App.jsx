import React, { useState, useEffect } from "react";

export default function App() {
  const [diaryText, setDiaryText] = useState("");
  const [userKey, setUserKey] = useState("");
  const [shift] = useState(3);
  const [entryIds, setEntryIds] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [decryptKey, setDecryptKey] = useState("");
  const [decryptedContent, setDecryptedContent] = useState("");
  const [responseMsg, setResponseMsg] = useState("");
  const [serverStatus, setServerStatus] = useState("⚫ Checking...");

  const SERVER_URL = "https://secure-diary-server.onrender.com";

  useEffect(() => {
    checkServerStatus();
    fetchEntryIds();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/status`);
      if (response.ok) {
        const data = await response.json();
        setServerStatus(`🟢 Connected (${data.entries} entries)`);
      }
    } catch (error) {
      setServerStatus("🔴 Disconnected");
    }
  };

  const fetchEntryIds = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/entries`);
      if (response.ok) {
        const data = await response.json();
        setEntryIds(data.entries || []);
      }
    } catch (error) {
      console.error("Failed to fetch entries:", error);
    }
  };

  const handleEncrypt = async () => {
    if (!diaryText.trim()) {
      setResponseMsg("⚠️ Please write something first!");
      return;
    }

    if (!userKey.trim() || userKey.length !== 4 || !/^\d{4}$/.test(userKey)) {
      setResponseMsg("⚠️ Please set a valid 4-digit key first!");
      return;
    }

    try {
      setResponseMsg("📤 Sending to server for encryption...");

      const response = await fetch(`${SERVER_URL}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: diaryText,
          key: Number(userKey),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResponseMsg(
          `✅ Diary encrypted and saved! Entry ID: ${data.id}\n🔑 Remember your key: ${userKey}`
        );
        setDiaryText("");
        setUserKey("");
        fetchEntryIds();
        
        setTimeout(() => {
          setResponseMsg("");
        }, 5000);
      } else {
        setResponseMsg("❌ Failed to save diary");
      }
    } catch (error) {
      setResponseMsg("❌ Error: " + error.message);
    }
  };

  const handleDecrypt = async () => {
    if (!selectedId) {
      setDecryptedContent("⚠️ Please select an entry first");
      return;
    }

    if (!decryptKey.trim() || decryptKey.length !== 4 || !/^\d{4}$/.test(decryptKey)) {
      setDecryptedContent("⚠️ Please enter a valid 4-digit key");
      return;
    }

    try {
      setDecryptedContent("🔄 Requesting decryption from server...");

      const response = await fetch(`${SERVER_URL}/decrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedId,
          key: Number(decryptKey),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDecryptedContent(
          `✅ Server verified key and sent decrypted content!\n\n📖 Decrypted Content:\n${data.content}`
        );
      } else {
        const error = await response.json();
        setDecryptedContent(`❌ ${error.error || "Decryption failed"}`);
      }
    } catch (error) {
      setDecryptedContent("❌ Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">🔐 Secure E-Diary</h1>
          <p className="text-xl text-green-400">End-to-End Encrypted System</p>
          <p className="text-sm text-gray-400 mt-2">
            Server: {SERVER_URL} • {serverStatus}
          </p>
        </div>

        {/* Write New Entry Section */}
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-green-400">
            ✍️ Write New Entry
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              🔑 Set Your 4-Digit Decryption Key (keep it secret!)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength="4"
              value={userKey}
              onChange={(e) => setUserKey(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 4 digits (e.g., 1234)"
              className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-600 rounded-lg text-white text-center text-2xl font-mono tracking-widest focus:border-green-400 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              ⚠️ Remember this key! You'll need it to decrypt your diary.
            </p>
          </div>

          <textarea
            value={diaryText}
            onChange={(e) => setDiaryText(e.target.value)}
            placeholder="Write your diary here..."
            rows="6"
            className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-600 rounded-lg text-white focus:border-green-400 focus:outline-none resize-none"
          />

          <button
            onClick={handleEncrypt}
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            💾 Encrypt & Send to Server
          </button>

          {responseMsg && (
            <pre className="mt-4 bg-gray-900 bg-opacity-50 border border-gray-600 rounded-lg p-3 text-sm text-green-300 whitespace-pre-wrap">
              {responseMsg}
            </pre>
          )}

          <p className="mt-2 text-xs text-gray-500">
            🔒 Server will encrypt using Caesar Cipher (Shift: {shift})
          </p>
        </div>

        {/* Decrypt Entry Section */}
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-blue-400">
            🔓 Decrypt Entry
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              📋 Select Entry ID:
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
            >
              <option value="">-- Choose an entry --</option>
              {entryIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              🔑 Decryption Key:
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength="4"
              value={decryptKey}
              onChange={(e) => setDecryptKey(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 4-digit key"
              className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-600 rounded-lg text-white text-center text-2xl font-mono tracking-widest focus:border-blue-400 focus:outline-none"
            />
          </div>

          <button
            onClick={handleDecrypt}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            🔓 Request Decryption
          </button>

          {decryptedContent && (
            <pre className="mt-4 bg-gray-900 bg-opacity-50 border border-gray-600 rounded-lg p-4 text-sm text-blue-300 whitespace-pre-wrap">
              {decryptedContent}
            </pre>
          )}

          <p className="mt-2 text-xs text-gray-500">
            ⚠️ Server-Side Verification - Wrong key = Access Denied!
          </p>
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-gray-800 bg-opacity-30 backdrop-blur-sm p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">
            🔐 How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">1️⃣</div>
              <h3 className="font-bold mb-1">User Sets Key</h3>
              <p className="text-sm text-gray-400">
                You create your own 4-digit key
              </p>
            </div>
            <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">2️⃣</div>
              <h3 className="font-bold mb-1">Write & Send</h3>
              <p className="text-sm text-gray-400">
                Plain text sent to server with your key
              </p>
            </div>
            <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">3️⃣</div>
              <h3 className="font-bold mb-1">Server Encrypts</h3>
              <p className="text-sm text-gray-400">
                Server encrypts using Caesar cipher
              </p>
            </div>
            <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">4️⃣</div>
              <h3 className="font-bold mb-1">Stored Securely</h3>
              <p className="text-sm text-gray-400">
                Encrypted data stored on server
              </p>
            </div>
            <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">5️⃣</div>
              <h3 className="font-bold mb-1">Request Decrypt</h3>
              <p className="text-sm text-gray-400">
                Enter your key to decrypt
              </p>
            </div>
            <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">6️⃣</div>
              <h3 className="font-bold mb-1">Verify & Send</h3>
              <p className="text-sm text-gray-400">
                ❌ Wrong key = No access!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}