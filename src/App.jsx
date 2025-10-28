import React, { useState, useEffect } from "react";

export default function App() {
  const [diaryText, setDiaryText] = useState("");
  const [shift] = useState(3);
  const [entryIds, setEntryIds] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [decryptKey, setDecryptKey] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

 const SERVER_URL = "https://secure-diary-server.onrender.com";

  const caesarEncrypt = (text, shift) => {
    return text
      .split("")
      .map((char) => {
        if (/[a-z]/.test(char)) {
          return String.fromCharCode(((char.charCodeAt(0) - 97 + shift) % 26) + 97);
        } else if (/[A-Z]/.test(char)) {
          return String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 26) + 65);
        }
        return char;
      })
      .join("");
  };

  const loadEntries = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/entries`);
      if (!res.ok) throw new Error("Server not responding");
      const data = await res.json();
      setEntryIds(data.ids);
    } catch (err) {
      console.error("Failed to load entries:", err);
    }
  };

  useEffect(() => {
    loadEntries();
    const interval = setInterval(loadEntries, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    if (!diaryText.trim()) {
      setStatus("⚠️ Please write something before saving!");
      return;
    }

    setLoading(true);
    setStatus("🔐 Encrypting and sending to server...");

    try {
      const encrypted = caesarEncrypt(diaryText, shift);
      
      const res = await fetch(`${SERVER_URL}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedText: encrypted }),
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setStatus(`✅ Diary saved! Entry ID: ${data.id}`);
      setDiaryText("");
      loadEntries();
    } catch (err) {
      setStatus("❌ Server connection failed!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!selectedId) {
      setStatus("⚠️ Please select an entry!");
      return;
    }

    if (!decryptKey.trim()) {
      setStatus("⚠️ Please enter decryption key!");
      return;
    }

    setLoading(true);
    setStatus("🔓 Requesting decryption from server...");
    setDecryptedText("");

    try {
      const res = await fetch(`${SERVER_URL}/decrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedId, 
          key: Number(decryptKey) 
        }),
      });

      if (res.status === 403) {
        setStatus("❌ WRONG KEY! Server denied access.");
        setDecryptKey("");
        return;
      }

      if (res.status === 404) {
        setStatus("❌ Entry not found!");
        return;
      }

      if (!res.ok) throw new Error("Decryption failed");

      const data = await res.json();
      setDecryptedText(data.decrypted);
      setStatus("✅ Server verified key and sent decrypted content!");
    } catch (err) {
      setStatus("❌ Connection error!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black bg-opacity-50 backdrop-blur-md border-b border-purple-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl">
                🔐
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Secure E-Diary</h1>
                <p className="text-purple-300 text-sm">End-to-End Encrypted System</p>
              </div>
            </div>
            <a 
              href={SERVER_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition font-semibold"
            >
              🖥️ Server Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          
          {/* Write Section */}
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-2xl p-8 shadow-2xl border border-purple-600">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">✍️</span>
              <h2 className="text-2xl font-bold text-white">Write New Entry</h2>
            </div>

            <textarea
              className="w-full h-64 p-4 bg-black bg-opacity-30 border-2 border-purple-500 rounded-xl text-white placeholder-purple-300 focus:border-purple-400 focus:outline-none resize-none"
              placeholder="Write your private thoughts here..."
              value={diaryText}
              onChange={(e) => setDiaryText(e.target.value)}
              disabled={loading}
            />

            <button
              onClick={handleSave}
              disabled={loading || !diaryText.trim()}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-lg shadow-lg"
            >
              {loading ? "⏳ Encrypting..." : "💾 Encrypt & Send to Server"}
            </button>

            <div className="mt-4 bg-purple-950 bg-opacity-50 border border-purple-600 rounded-lg p-4">
              <p className="text-purple-200 text-sm">
                🔒 <strong>Caesar Cipher (Shift: {shift})</strong> - Your text is encrypted before transmission
              </p>
            </div>
          </div>

          {/* Decrypt Section */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-8 shadow-2xl border border-indigo-600">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🔓</span>
              <h2 className="text-2xl font-bold text-white">Decrypt Entry</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-indigo-200 font-semibold mb-3">
                  📋 Select Entry ID:
                </label>
                <select
                  className="w-full p-4 bg-black bg-opacity-30 border-2 border-indigo-500 rounded-xl text-white focus:border-indigo-400 focus:outline-none"
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    setDecryptedText("");
                    setStatus("");
                  }}
                  disabled={loading}
                >
                  <option value="">-- Choose an entry --</option>
                  {entryIds.length === 0 && <option disabled>No entries yet</option>}
                  {entryIds.map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-indigo-200 font-semibold mb-3">
                  🔑 Decryption Key:
                </label>
                <input
                  type="number"
                  className="w-full p-4 bg-black bg-opacity-30 border-2 border-indigo-500 rounded-xl text-white placeholder-indigo-300 focus:border-indigo-400 focus:outline-none"
                  placeholder="Enter secret key (server will verify)"
                  value={decryptKey}
                  onChange={(e) => setDecryptKey(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleDecrypt}
                disabled={loading || !selectedId || !decryptKey}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-lg shadow-lg"
              >
                {loading ? "⏳ Verifying..." : "🔓 Request Decryption"}
              </button>

              <div className="bg-indigo-950 bg-opacity-50 border border-yellow-500 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                  ⚠️ <strong>Server-Side Verification</strong> - Wrong key = Access Denied!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        {status && (
          <div className="bg-black bg-opacity-50 backdrop-blur-md border border-purple-500 rounded-xl p-6 mb-8">
            <p className="text-center text-white text-lg font-medium">{status}</p>
          </div>
        )}

        {/* Decrypted Content */}
        {decryptedText && (
          <div className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-2xl p-8 shadow-2xl border border-green-500">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📖</span>
              <h3 className="text-2xl font-bold text-white">Decrypted Content</h3>
            </div>
            <div className="bg-black bg-opacity-40 rounded-xl p-6 border border-green-400">
              <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                {decryptedText}
              </p>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-8 border border-purple-500">
          <h3 className="text-2xl font-bold text-purple-300 mb-6">🔐 How It Works</h3>
          <div className="grid md:grid-cols-2 gap-6 text-purple-200">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <strong className="text-white">Write & Encrypt</strong>
                  <p className="text-sm">Client encrypts diary with Caesar cipher</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <strong className="text-white">Send to Server</strong>
                  <p className="text-sm">Encrypted data transmitted securely</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <strong className="text-white">Server Stores</strong>
                  <p className="text-sm">Server cannot read encrypted content</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">4️⃣</span>
                <div>
                  <strong className="text-white">Request Decrypt</strong>
                  <p className="text-sm">Client asks server to decrypt with key</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">5️⃣</span>
                <div>
                  <strong className="text-white">Verify Key</strong>
                  <p className="text-sm">Server checks if key matches</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">6️⃣</span>
                <div>
                  <strong className="text-white">Send Decrypted</strong>
                  <p className="text-sm text-red-300">❌ Wrong key = No access!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-6 text-center">
          <p className="text-purple-300">
            Server: <span className="font-mono font-bold text-white">{SERVER_URL}</span>
            {entryIds.length > 0 ? (
              <span className="ml-4 text-green-400">● Connected ({entryIds.length} entries)</span>
            ) : (
              <span className="ml-4 text-yellow-400">● Waiting...</span>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}