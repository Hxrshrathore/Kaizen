const fs = require('fs');

async function testPaliGemma() {
  const apiKey = "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";
  const invokeUrl = "https://ai.api.nvidia.com/v1/vlm/google/paligemma";

  const imgData = fs.readFileSync('scripts/small_flower.jpg');
  const imageB64 = imgData.toString('base64');

  const payload = {
    model: "google/paligemma",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "caption en" },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageB64}` } }
        ]
      }
    ],
    max_tokens: 128,
    temperature: 0.2,
    top_p: 0.70,
    stream: false
  };

  try {
    const res = await fetch(invokeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });
    console.log("PaliGemma HTTP status:", res.status);
    const data = await res.json();
    console.log("PaliGemma Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("PaliGemma error:", err);
  }
}

testPaliGemma();
