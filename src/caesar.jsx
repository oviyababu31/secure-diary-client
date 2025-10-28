import React, { useState } from "react";

function CaesarCipher() {
  const [text, setText] = useState("");
  const [shift, setShift] = useState(3);
  const [encrypted, setEncrypted] = useState("");
  const [noteId, setNoteId] = useState("");

  // --- Caesar Encrypt ---
  const caesarEncrypt = (str, shift) => {
    return str
      .split("")
      .map((char) => {
        if (/[a-z]/.test(char)) {
          return String.fromCharCode(((char.charCodeAt(0) - 97 + shift) % 26) + 97);
        } else if (/[A-Z]/.test(char)) {
          return String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 26) + 65);
        } else {
          return char;
        }
      })
      .join("");
  };

  // --- Caesar Decrypt ---
  const caesarDecrypt = (str, shift) => caesarEncrypt(str, 26 - shift);

  // --- Save Encrypted Text to Server ---
  const handleSave = async () => {
    const encryptedText = caesarEncrypt(text, Number(shift));
    setEncrypted(encryptedText);

    try {
      const response = await fetch("http://localhost:5000/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedText }),
      });
      const data = await response.json();
      setNoteId(data.id);
      alert("Encrypted note saved! ID: " + data.id);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Error saving note!");
    }
  };

  // --- Get & Decrypt from Server ---
  const handleDecrypt = async () => {
    if (!noteId) {
      alert("No note ID found!");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/get/${noteId}`);
      const data = await response.json();

      if (data.encryptedText) {
        const decrypted = caesarDecrypt(data.encryptedText, Number(shift));
        alert("Decrypted text:\n" + decrypted);
      } else {
        alert("No encrypted note found on server!");
      }
    } catch (err) {
      console.error("Decryption failed:", err);
      alert("Error decrypting note!");
    }
  };

  return (
    <div style={{ margin: "40px" }}>
      <h1>Secure E-Diary</h1>
      <textarea
        rows="10"
        cols="80"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your diary entry here..."
      />
      <br />
      <input
        type="number"
        value={shift}
        onChange={(e) => setShift(e.target.value)}
        min="1"
        max="25"
      />
      <button onClick={handleSave}>Save Encrypted</button>
      <button onClick={handleDecrypt}>Decrypt</button>

      {encrypted && (
        <p>
          <strong>Encrypted:</strong> {encrypted}
        </p>
      )}
    </div>
  );
}

export default CaesarCipher;
