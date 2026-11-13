const fs = require('fs');

async function testOmniVision() {
  const apiKey = "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";
  const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";

  const imgData = fs.readFileSync('scripts/small_flower.jpg');
  const imageB64 = imgData.toString('base64');

  const payload = {
    model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe what you see in this image." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageB64}` } }
        ]
      }
    ],
    max_tokens: 1024,
    temperature: 0.6,
    top_p: 0.95
  };

  try {
    const res = await fetch(invokeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    console.log("Omni HTTP status:", res.status);
    const data = await res.json();
    console.log("Omni Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Omni error:", err);
  }
}

testOmniVision();

