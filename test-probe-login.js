import fetch from 'node-fetch';

async function testProbeLogin() {
  // Substituir pelo email gerado no passo anterior
  const email = 'probe_1764854483997@cellsync.com'; 
  const password = 'probe_password_123';

  const url = 'https://www.cellsync.com.br/api/trpc/auth.login?batch=1';
  const payload = {
    "0": {
      "json": {
        "email": email,
        "password": password
      }
    }
  };

  console.log(`Testando login de sonda para: ${email}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Resposta:', text);

  } catch (error) {
    console.error('Erro:', error);
  }
}

testProbeLogin();
