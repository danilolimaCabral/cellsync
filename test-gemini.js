const fetch = require('node-fetch');

// Chave fornecida pelo usuário
const API_KEY = process.env.GOOGLE_API_KEY || "SUA_CHAVE_AQUI";

// URL da API do Google (formato OpenAI compatibility)
const URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

async function testGemini() {
  console.log("Testando conexão com Google Gemini...");
  console.log(`URL: ${URL}`);
  console.log(`Model: gemini-1.5-flash`);

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gemini-1.5-flash",
        messages: [
          { role: "user", content: "Olá, responda apenas com 'Funcionou!'" }
        ],
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n[ERRO] Status: ${response.status} ${response.statusText}`);
      console.error(`Detalhes: ${errorText}`);
    } else {
      const data = await response.json();
      console.log("\n[SUCESSO] Resposta da IA:");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("\n[ERRO DE REDE]", error);
  }
}

testGemini();
