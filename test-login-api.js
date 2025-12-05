import fetch from 'node-fetch';

async function testLogin() {
  const url = 'https://www.cellsync.com.br/api/trpc/auth.login?batch=1';
  const payload = {
    "0": {
      "json": {
        "email": "admin@cellsync.com",
        "password": "admin_master_2025"
      }
    }
  };

  console.log(`Testando login em: ${url}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.cellsync.com.br',
        'Referer': 'https://www.cellsync.com.br/login'
      },
      body: JSON.stringify(payload)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    console.log('Resposta bruta:', text);

    try {
      const json = JSON.parse(text);
      console.log('Resposta JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Resposta não é JSON válido.');
    }

  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

testLogin();
