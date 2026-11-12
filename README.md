# Iluminação · Home Manager

App web minimalista (estilo Apple Home, com glassmorphism) para controlar a iluminação
da automação Home Manager pelos **Comandos HTTP**:

```
http://300504.homemanager.com.br:9090/HomeWeb/command.do?id=[ID]&valor=[VALOR]
```

## Como funciona

```
Celular/navegador ──HTTPS──▶ Cloudflare Worker ──HTTP :9090──▶ Home Manager
     (public/)                 (src/worker.js)                 command.do
```

O navegador não consegue chamar `http://...:9090` direto de um site HTTPS (bloqueio de
*mixed content* e CORS). Por isso o Worker serve a interface e repassa os comandos.
Ele só aceita os IDs listados em `public/devices.js` e valores válidos
(dimmer `0–100` em passos de 5; RGB `nível_cor`, ex. `50_r`).

**Uso:** toque no bloco = liga/desliga · toque na seta `›` ou segure = painel com
slider de intensidade (e cores, nos RGB) · “Ligar/Desligar tudo” age no filtro atual.

## Editar dispositivos

Tudo fica em `public/devices.js` (nome, grupo, tipo). Os IDs vêm da “Lista de Dispositivos”
da Home Manager.

## Publicar no Cloudflare

Pré-requisito: Node 18+ e uma conta Cloudflare (o plano gratuito serve).

```bash
npm install
npx wrangler login
npx wrangler secret put APP_PIN     # PIN pedido no app (recomendado!)
npx wrangler deploy
```

O app fica em `https://hm-iluminacao.<sua-conta>.workers.dev`. Para usar domínio próprio:
painel Cloudflare → Workers & Pages → hm-iluminacao → Settings → Domains & Routes.

Alternativa sem terminal: painel Cloudflare → Workers & Pages → Create → **Import a
repository** → selecione este repositório do GitHub (deploy automático a cada push).
Depois adicione o secret `APP_PIN` em Settings → Variables and Secrets.

No iPhone: abra o link no Safari → Compartilhar → **Adicionar à Tela de Início**.

## Rodar localmente

```bash
npm install
npm run dev          # http://localhost:8787
```

Abra `http://localhost:8787/?demo` para ver a interface sem enviar comandos.

## Segurança

Sem `APP_PIN`, qualquer pessoa com o link pode acender/apagar as luzes. Configure o PIN
e não divulgue a URL. Se o host `homemanager.com.br` passar a usar proxy da Cloudflare,
a porta 9090 pode deixar de ser aceita pelo Worker — nesse caso altere `HM_BASE` no
`wrangler.jsonc`.
