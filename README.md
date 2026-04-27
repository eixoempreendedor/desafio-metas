# Desafio Empreendedor — Painel de Metas

App de monitoramento das turmas do Desafio Empreendedor. Cada consultor cadastra
suas turmas (cidade, número, meta, data de início) e atualiza a quantidade de
matriculados toda semana. Toda segunda-feira de manhã, um cron dispara um
relatório consolidado via WhatsApp (Z-API).

**Stack:** Next.js 15 (App Router) · Supabase (Postgres) · Tailwind · Vercel +
Vercel Cron · Z-API.

---

## 🚀 Setup local (10 min)

### 1. Supabase

1. Crie projeto em https://supabase.com/dashboard (free tier).
2. Em **SQL Editor**, rode `supabase/schema.sql`.
3. Em seguida rode `supabase/seed.sql` (cria os 7 consultores).
4. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. `.env.local`

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

Para gerar `CRON_SECRET`: `openssl rand -hex 32`.

Z-API: reuse a mesma instância do `zapi-monitor` (Railway → Variables).

### 3. Rodar

```bash
npm install   # já executado se você clonou após setup
npm run dev
```

Abra http://localhost:3000 — dashboard público.
Abra http://localhost:3000/c/curti-a8f3k2x9 — página do consultor (Luiz Curti).

---

## 🔗 Links dos consultores (mande no privado de cada um via WhatsApp)

| Consultor          | Link                                          |
| ------------------ | --------------------------------------------- |
| Luiz Curti         | `/c/curti-a8f3k2x9`                           |
| Fábio Valois       | `/c/valois-b7n9p1m4`                          |
| Sérgio Leão        | `/c/leao-c4m8q5r2`                            |
| Jefferson          | `/c/jefferson-d2p7w6t3`                       |
| Marley             | `/c/marley-e1q9v8s5`                          |
| Renata Brito       | `/c/brito-f9w3z6n8`                           |
| Renata Guimarães   | `/c/guimaraes-g5y2x4k7`                       |

> Em produção, prefixe com sua URL Vercel:
> `https://desafio-metas.vercel.app/c/curti-a8f3k2x9`

---

## 🤖 Relatório semanal (Z-API)

- **Cron:** segunda-feira 8h BRT (= `0 11 * * 1` UTC, configurado em
  `vercel.json`).
- **Destino:** `ZAPI_DESTINATION` no env. Fase 1: número do Luiz. Fase 2: group
  ID `120363...@g.us`.
- **Dry-run:** `ZAPI_DRY_RUN=true` no env loga a mensagem no console em vez de
  enviar.

### Endpoints

| Endpoint                                  | Descrição                                       |
| ----------------------------------------- | ----------------------------------------------- |
| `GET /api/relatorio/preview`              | Retorna a mensagem formatada (sem enviar).      |
| `GET /api/cron/relatorio`                 | Gera + envia. Auth: `Bearer ${CRON_SECRET}`.    |
| `GET /api/cron/relatorio?dry=1`           | Gera mas não envia (mesmo com auth).            |
| `GET /api/cron/relatorio?destino=5561...` | Override do destino (para testes).              |

### Testar localmente

```bash
# Preview (não envia)
curl http://localhost:3000/api/relatorio/preview

# Disparo manual via Z-API (rode com ZAPI_DRY_RUN=false e credenciais válidas)
curl -H "Authorization: Bearer $CRON_SECRET" \
     http://localhost:3000/api/cron/relatorio
```

---

## ☁️ Deploy (Vercel)

1. `git init && git add . && git commit -m "init"`
2. Crie repo em github.com/eixoempreendedor/desafio-metas (privado)
3. `git remote add origin git@github.com:eixoempreendedor/desafio-metas.git && git push -u origin main`
4. Em vercel.com → **Add New** → **Project** → importe o repo.
5. **Environment Variables**: cole tudo do `.env.local` (incluindo `CRON_SECRET`).
6. Deploy. O cron começa a rodar automaticamente toda segunda 11h UTC.

---

## 🗂️ Estrutura

```
src/
  app/
    page.tsx                    ← dashboard público (/)
    c/[token]/
      page.tsx                  ← página do consultor (/c/{token})
      actions.ts                ← server actions (criar/atualizar turma)
    api/
      cron/relatorio/route.ts   ← endpoint do cron (Z-API)
      relatorio/preview/route.ts← preview da mensagem
  lib/
    supabase.ts                 ← client com service_role
    zapi.ts                     ← envio Z-API (mesmo padrão do zapi-monitor)
    relatorio.ts                ← gera mensagem semanal
    week.ts                     ← util ISO week
    types.ts
supabase/
  schema.sql                    ← tabelas + RLS
  seed.sql                      ← 7 consultores com tokens
vercel.json                     ← cron schedule
```

---

## 🎯 Roadmap

- [ ] Group ID Z-API quando o canal estiver pronto
- [ ] Botão "Reenviar relatório agora" pra Luiz (rota admin protegida)
- [ ] Histórico semanal por turma (gráfico de evolução)
- [ ] Notificação pros consultores que não atualizaram na semana
