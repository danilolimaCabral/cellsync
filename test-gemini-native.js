const fetch = require('node-fetch');

const API_KEY = process.env.GOOGLE_API_KEY || "SUA_CHAVE_AQUI";
const MODEL = "gemini-1.5-flash";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

async function testNative() {
  console.log("Testando API Nativa do Google...");
  console.log(`URL: ${URL}`);

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Olá, responda apenas com 'Funcionou Nativo!'" }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n[ERRO] Status: ${response.status}`);
      console.error(errorText);
    } else {
      const data = await response.json();
      console.log("\n[SUCESSO] Resposta:");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error(error);
  }
}

testNative();
