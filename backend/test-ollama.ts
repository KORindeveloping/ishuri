import fetch from 'node-fetch'; // Just in case, though Node 20 has native fetch

async function test() {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma3:4b',
        messages: [{ role: 'user', content: 'hello' }],
        stream: false
      })
    });
    const text = await response.text();
    console.log("Ollama response:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
