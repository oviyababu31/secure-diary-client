import React, { useState, useEffect } from "react";

export default function App() {
  const [userKey, setUserKey] = useState("");
  const [keyConfirmed, setKeyConfirmed] = useState(false);
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

  const handleKeyConfirm = () => {
    if (userKey.length !== 4 || !/^\d{4}$/.test(userKey)) {
      setStatus("⚠️ Please enter a valid 4-digit key!");
      return;
    }
    setKeyConfirmed(true);
    setStatus("✅ Key set! You can now write your diary entry.");
  };

  const handleReset = () => {
    setKeyConfirmed(false);
    setUserKey("");
    setDiaryText("");
    setStatus("");
  };

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
        body: JSON.stringify({ 
          encryptedText: encrypted,
          key: Number(userKey)
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setStatus(`✅ Diary saved! Entry ID: ${data.id} | Your key: ${userKey}`);
      setDiaryText("");
      loadEntries();
      
      // Reset for next entry
      setTimeout(() => {
        handleReset();
      }, 5000);
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

    if (decryptKey.length !== 4 || !/^\d{4}$/.test(decryptKey)) {
      setStatus("⚠️ Key must be exactly 4 digits!");
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

            {!keyConfirmed ? (
              // Step 1: Set Encryption Key
              <div className="space-y-6">
                <div className="bg-yellow-900 bg-opacity-50 border-2 border-yellow-500 rounded-lg p-4">
                  <p className="text-yellow-200 text-sm text-center">
                    🔑 <strong>Step 1:</strong> Choose your 4-digit encryption key
                  </p>
                </div>

                <div>
                  <label className="block text-purple-200 font-semibold mb-3 text-center">
                    Enter Your 4-Digit Encryption Key:
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength="4"
                    className="w-full p-4 bg-black bg-opacity-30 border-2 border-purple-500 rounded-xl text-white text-center text-3xl font-mono tracking-widest placeholder-purple-300 focus:border-purple-400 focus:outline-none"
                    placeholder="0000"
                    value={userKey}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) {
                        setUserKey(value);
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && userKey.length === 4) {
                        handleKeyConfirm();
                      }
                    }}
                  />
                  <p className="text-purple-300 text-xs mt-2 text-center">
                    Choose a memorable 4-digit number (1000-9999)
                  </p>
                </div>

                <button
                  onClick={handleKeyConfirm}
                  disabled={userKey.length !== 4}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-lg shadow-lg"
                >
                  ✅ Confirm Key & Continue
                </button>

                <div className="bg-purple-950 bg-opacity-50 border border-purple-600 rounded-lg p-4">
                  <p className="text-purple-200 text-sm">
                    ⚠️ <strong>Remember this key!</strong> You'll need it to decrypt your entry later.
                  </p>
                </div>
              </div>
            ) : (
              // Step 2: Write Diary
              <div className="space-y-6">
                <div className="bg-green-900 bg-opacity-50 border-2 border-green-400 rounded-lg p-4">
                  <p className="text-green-200 text-sm text-center">
                    🔑 <strong>Your Encryption Key:</strong> <span className="text-2xl font-mono tracking-widest">{userKey}</span>
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-2 w-full text-green-300 hover:text-green-100 text-xs underline"
                  >
                    Change Key
                  </button>
                </div>

                <textarea
                  className="w-full h-64 p-4 bg-black bg-opacity-30 border-2 border-purple-500 rounded-xl text-white placeholder-purple-300 focus:border-purple-400 focus:outline-none resize-none"
                  placeholder="Write your private thoughts here..."
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  disabled={loading}
                  autoFocus
                />

                <button
                  onClick={handleSave}
                  disabled={loading || !diaryText.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-lg shadow-lg"
                >
                  {loading ? "⏳ Encrypting..." : "💾 Encrypt & Send to Server"}
                </button>

                <div className="bg-purple-950 bg-opacity-50 border border-purple-600 rounded-lg p-4">
                  <p className="text-purple-200 text-sm">
                    🔒 <strong>Caesar Cipher (Shift: {shift})</strong> - Your text will be encrypted with key: {userKey}
                  </p>
                </div>
              </div>
            )}
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
                  🔑 4-Digit Decryption Key:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength="4"
                  className="w-full p-4 bg-black bg-opacity-30 border-2 border-indigo-500 rounded-xl text-white text-center text-2xl font-mono tracking-widest placeholder-indigo-300 focus:border-indigo-400 focus:outline-none"
                  placeholder="0000"
                  value={decryptKey}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 4) {
                      setDecryptKey(value);
                    }
                  }}
                  disabled={loading}
                />
                <p className="text-indigo-300 text-xs mt-2 text-center">
                  Enter the 4-digit key you used when saving
                </p>
              </div>

              <button
                onClick={handleDecrypt}
                disabled={loading || !selectedId || decryptKey.length !== 4}
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
                  <strong className="text-white">Choose Your Key</strong>
                  <p className="text-sm">Set your own 4-digit encryption key</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <strong className="text-white">Write & Encrypt</strong>
                  <p className="text-sm">Client encrypts diary with Caesar cipher</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <strong className="text-white">Send to Server</strong>
                  <p className="text-sm">Encrypted data transmitted securely</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">4️⃣</span>
                <div>
                  <strong className="text-white">Server Stores</strong>
                  <p className="text-sm">Server stores encrypted content</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">5️⃣</span>
                <div>
                  <strong className="text-white">Request Decrypt</strong>
                  <p className="text-sm">Enter your 4-digit key to decrypt</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">6️⃣</span>
                <div>
                  <strong className="text-white">Verify & Access</strong>
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