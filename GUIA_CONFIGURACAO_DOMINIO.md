> # 🚀 Guia Completo: Configurando seu Domínio Personalizado no CellSync
> 
> **Data:** 03 de Dezembro de 2025
> **Status:** 🟢 **Pronto para Configuração**
> 
> ---
> 
> ## ✅ Sim, o CellSync está 100% pronto para usar seu domínio!
> 
> Após uma análise completa, confirmo que a aplicação está totalmente preparada para ser acessada através de um domínio personalizado (ex: `app.suaempresa.com.br`).
> 
> Este guia detalha o passo a passo para você mesmo realizar a configuração.
> 
> ---
> 
> ## 📝 Passo a Passo para Configuração
> 
> Siga as 3 etapas abaixo para conectar seu domínio ao CellSync.
> 
> ### Etapa 1: Adicionar o Domínio no Railway
> 
> 1.  **Acesse as Configurações do Serviço:**
>     *   Vá para o seu projeto no Railway: [https://railway.app/project/007b56c1-c85b-4e3d-93a1-acbd3d777e06](https://railway.app/project/007b56c1-c85b-4e3d-93a1-acbd3d777e06)
>     *   Clique no serviço **cellsync**.
>     *   Vá para a aba **Settings**.
> 
> 2.  **Adicione o Domínio Personalizado:**
>     *   Role a página até a seção **Networking**.
>     *   Clique no botão **+ Custom Domain**.
>     *   Digite o domínio que você deseja usar (ex: `app.cellsync.com.br`) e clique em **Add Domain**.
> 
> 3.  **Copie o Registro CNAME:**
>     *   O Railway irá gerar um valor de registro **CNAME**. Ele será algo parecido com `shining-wave-1234.up.railway.app`.
>     *   **Copie este valor.** Você precisará dele na próxima etapa.
> 
> ![Exemplo de CNAME no Railway](https://i.imgur.com/exemplo-cname.png) 
> *Exemplo visual de onde encontrar o CNAME no Railway.*
> 
> ---
> 
> ### Etapa 2: Configurar o DNS no seu Provedor
> 
> Agora, você precisa acessar o painel de controle do seu provedor de domínio (GoDaddy, HostGator, Registro.br, etc.) e criar um novo registro DNS.
> 
> 1.  **Acesse a Gestão de DNS:**
>     *   Encontre a seção de "Gerenciamento de DNS", "Editor de Zona DNS" ou similar.
> 
> 2.  **Crie um Registro CNAME:**
>     *   **Tipo:** `CNAME`
>     *   **Nome (ou Host):** A parte do seu subdomínio. Por exemplo, se o seu domínio é `app.suaempresa.com.br`, o nome será `app`.
>     *   **Valor (ou Aponta para):** Cole o valor CNAME que você copiou do Railway na etapa anterior.
>     *   **TTL (Time to Live):** Pode deixar o padrão (geralmente 1 hora ou automático).
> 
> | Campo | Exemplo de Valor |
> | :--- | :--- |
> | **Tipo** | `CNAME` |
> | **Nome** | `app` |
> | **Valor** | `shining-wave-1234.up.railway.app` |
> 
> 3.  **Aguarde a Propagação:**
>     *   A propagação do DNS pode levar de alguns minutos a algumas horas. O Railway mostrará o status do domínio como "Pending" até que a configuração seja validada.
>     *   Quando estiver pronto, o status mudará para **"Active"** e o Railway emitirá um **certificado SSL automaticamente** para seu domínio. 🔒
> 
> ---
> 
> ### Etapa 3: Atualizar as Variáveis de Ambiente (MUITO IMPORTANTE)
> 
> Para que os links de pagamento do Stripe e os QR Codes dos recibos funcionem corretamente com o novo domínio, você **precisa** atualizar duas variáveis de ambiente no Railway.
> 
> 1.  **Acesse as Variáveis:**
>     *   No painel do serviço **cellsync** no Railway, vá para a aba **Variables**.
> 
> 2.  **Crie/Atualize as Seguintes Variáveis:**
>     *   Clique em **+ New Variable** e adicione as duas variáveis abaixo, substituindo `https://app.suaempresa.com.br` pelo seu domínio **com `https://`**.
> 
> | Nome da Variável | Valor a ser Inserido (Exemplo) |
> | :--- | :--- |
> | `VITE_APP_URL` | `https://app.suaempresa.com.br` |
> | `VITE_FRONTEND_FORGE_API_URL` | `https://app.suaempresa.com.br` |
> 
> 3.  **Aguarde o Redeploy:**
>     *   Após salvar as novas variáveis, o Railway iniciará um novo deploy automaticamente. Aguarde a conclusão.
> 
> ---
> 
> ## ✅ Checklist Pós-Configuração
> 
> Após seguir todos os passos, valide se tudo está funcionando:
> 
> - [ ] **Acesso:** Tente acessar o CellSync pelo seu novo domínio (`https://app.suaempresa.com.br`).
> - [ ] **Cadeado SSL:** Verifique se o site carrega com um cadeado de segurança (HTTPS).
> - [ ] **Teste de Checkout:** Vá para a página de planos e clique em "Assinar Agora". Verifique se a página de checkout do Stripe abre corretamente.
> - [ ] **Teste de QR Code:** Se possível, gere um recibo de venda e verifique se o QR Code aponta para o seu novo domínio.
> 
> ---
> 
> ## ❓ Solução de Problemas (Troubleshooting)
> 
> - **Domínio não ativa no Railway:** Verifique se o registro CNAME foi digitado corretamente no seu provedor de DNS. Use uma ferramenta como o [DNS Checker](https://dnschecker.org/) para confirmar se o CNAME está propagado.
> - **Links do Stripe não funcionam:** Confirme se as variáveis `VITE_APP_URL` e `VITE_FRONTEND_FORGE_API_URL` foram criadas **exatamente** como no guia e se o deploy foi concluído após a alteração.
> 
> **Se precisar de ajuda, estou à disposição!**
