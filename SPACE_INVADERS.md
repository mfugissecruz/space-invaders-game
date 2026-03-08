# Space Invaders — Game Bootstrap Prompt

<!-- Dev Agency já instalada. Este prompt cria o jogo do zero. -->
<!-- Uso: claude < SPACE_INVADERS_GAME.md -->

You are a senior prompt engineer bootstrapping a Space Invaders game
inside an existing Dev Agency. The agency (agents, skills, ralph, hooks)
is already configured. Your job is to:

1. Write PROJECT.md
2. Write MEMORY.md with all tasks seeded
3. Initialize git and commit the scaffold
4. Spawn the planner to begin execution

Do not ask questions. Do not summarize. Execute all phases sequentially.

---

## PHASE 1 — Write PROJECT.md

Create this file at the project root as `PROJECT.md`:

```
# PROJECT.md — Space Invaders

**Version**: 0.1.0
**Status**: In Development

Space Invaders clássico com servidor autoritativo Node.js + WebSocket.
Visual 16-bit estilo Atari/CGA. Lógica 100% server-side, cliente renderiza estado.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js >=18 (ESM) |
| HTTP + WS server | Fastify 4 + @fastify/websocket |
| Game loop | setInterval 60ms server-side |
| Frontend | Vue 3.5 (Composition API + script setup) |
| Build | Vite 6 |
| Rendering | HTML5 Canvas 2D — pixel art, sem anti-aliasing |
| Styling | CSS puro |
| Package manager | npm workspaces |

---

## Architecture

```

Browser (Vue 3 + Canvas)
│ ws://localhost:3000/ws
▼
Fastify Server
├── GameEngine.js — estado puro, física, colisões (sem I/O)
├── GameLoop.js — setInterval 60ms, chama tick + broadcast
└── WSHandler.js — conexões, roteamento de inputs (sem lógica de jogo)

```

Servidor autoritativo. Cliente só renderiza estado recebido e envia inputs.

---

## Directory Structure

```

game/
├── server/
│ ├── index.js — Fastify entry, WS route
│ ├── GameEngine.js — estado, física, colisões, pontuação
│ ├── GameLoop.js — tick loop + broadcast
│ └── WSHandler.js — gestão de conexões + input routing
├── client/
│ ├── index.html
│ ├── vite.config.js
│ └── src/
│ ├── main.js
│ ├── App.vue
│ ├── composables/
│ │ ├── useWebSocket.js
│ │ └── useInput.js
│ └── components/
│ ├── GameCanvas.vue
│ └── GameHUD.vue
├── package.json — workspaces: ["server","client"]
└── PROJECT.md

````

---

## Game Rules

### Entidades
- **Player**: 1 nave, X∈[8,216], Y fixo=240, tiro único no ar por vez
- **Invaders**: grid 11×5 = 55 aliens. Tipo por linha: linha 0→30pts, linhas 1–2→20pts, linhas 3–4→10pts
- **Bullets**: player bullet sobe (dy=−4/tick), invader bullet desce (dy=+3/tick)
- **Shields**: 4 bunkers em Y=200. Blocos 3×2, HP 3 por bloco
- **UFO**: aparece aleatoriamente Y=20, percorre X 0→224, pontos aleatórios

### Movimento dos Invaders
- Direção inicial: direita
- Ao atingir borda (X<8 ou X>208): inverter direção + descer 8px
- stepMs base = 500ms. Aceleração: stepMs = max(60, 500 − (55 − alive) × 8)

### Inputs (client → server)
| action | efeito |
|--------|--------|
| move_left | player.x −= 2 (clamped 8–216) |
| move_right | player.x += 2 (clamped 8–216) |
| fire | cria player bullet se nenhum ativo |
| start | reinicia jogo se status = gameover ou waiting |

### Pontuação
| Entidade | Pontos |
|----------|--------|
| Invader linha 0 (topo) | 30 |
| Invader linhas 1–2 | 20 |
| Invader linhas 3–4 (base) | 10 |
| UFO | random [50, 100, 150, 200, 300] |

### Condições de Fim
- **Game Over**: player perde 3 vidas OU qualquer invader atinge Y≥220
- **Level Clear**: todos invaders eliminados → novo nível, stepMs base −50ms (mín 100ms)

---

## WebSocket Protocol

### Client → Server
```json
{ "type": "input", "action": "move_left|move_right|fire|start" }
````

### Server → Client (broadcast a cada tick)

```json
{
  "type": "state",
  "tick": 1234,
  "status": "waiting|playing|gameover",
  "score": 0,
  "level": 1,
  "player": { "x": 112, "y": 240, "lives": 3 },
  "invaders": [{ "id": 0, "x": 10, "y": 30, "row": 0, "alive": true }],
  "bullets": [{ "id": 0, "x": 50, "y": 100, "owner": "player|invader" }],
  "shields": [
    {
      "id": 0,
      "x": 30,
      "y": 200,
      "blocks": [
        [3, 3, 3],
        [3, 3, 3]
      ]
    }
  ],
  "ufo": { "active": false, "x": 0, "points": 0 }
}
```

### Server → Client (eventos pontuais)

```json
{
  "type": "event",
  "name": "invader_killed|player_hit|gameover|level_clear|ufo_killed",
  "data": {}
}
```

---

## Rendering Spec

- Canvas lógico: 224×256px escalado 3× (672×768px físicos)
- `imageSmoothingEnabled = false` — pixel art puro
- Paleta CGA (máx 16 cores):

| Elemento     | Cor     |
| ------------ | ------- |
| Background   | #000000 |
| Player       | #55FF55 |
| Invader topo | #FF5555 |
| Invader meio | #FFFF55 |
| Invader base | #5555FF |
| UFO          | #FF55FF |
| Bullet       | #FFFFFF |
| Shield       | #55FFFF |
| HUD text     | #AAAAAA |

---

## Coding Conventions

- ESM puro — `"type": "module"` em todos os package.json
- GameEngine: classe pura, sem I/O, sem WS, testável isoladamente
- Coordenadas sempre em pixels lógicos (224×256) — escala só no render
- Timings sempre em ms
- Sem TypeScript, sem Tailwind, sem UI libs
- Canvas: requestAnimationFrame no cliente, cancelAnimationFrame no unmount

---

## Verification

```yaml
checks:
  - label: Server syntax
    command: node --check server/index.js && node --check server/GameEngine.js && node --check server/GameLoop.js && node --check server/WSHandler.js
  - label: Client build
    command: cd client && npm run build
```

```

---

## PHASE 2 — Write MEMORY.md

Create this file at the project root as `MEMORY.md`:

```

# MEMORY.md

<!-- MACHINE-READABLE CONTROL BLOCK — do not reformat -->

```json
{
  "ralph_ready": false,
  "all_tasks_completed": false,
  "active_agent": null,
  "iteration": 0,
  "last_updated": "2026-03-08",
  "last_commit": null
}
```

## In Progress

- (none)

## Done

- (none)

## Backlog

- [ ] Task 1: Monorepo setup — `package.json` raiz (workspaces: server + client), `server/package.json` (fastify@4 + @fastify/websocket, type:module), `client/package.json` (vue@3.5 + vite@6 + @vitejs/plugin-vue, type:module), rodar `npm install`
- [ ] Task 2: Fastify server + WS + stubs — `server/index.js` (Fastify listen :3000, rota GET /ws), `server/WSHandler.js` (Map de clientes, register/unregister/broadcast/handleInput), `server/GameEngine.js` (stub: construtor + getState() retorna objeto vazio)
- [ ] Task 3: GameEngine core — grid 11×5 invaders com row/col/id/x/y/alive, movimento lateral + descida ao bater na borda, aceleração por aliens restantes (stepMs), player x/y/lives, status waiting → playing via input start — `server/GameEngine.js`
- [ ] Task 4: GameEngine combat — player bullet (único no ar), invader bullet (random da fileira de baixo a cada 1–2s), colisões AABB (bullet×invader, bullet×player, bullet×shield), shields com blocos HP, pontuação, UFO (aparição aleatória, movimento, pontos) — `server/GameEngine.js`
- [ ] Task 5: GameLoop + integração — `server/GameLoop.js` (setInterval 60ms, chama engine.tick() + wsHandler.broadcast(state)), integrar GameEngine + GameLoop + WSHandler em `server/index.js`, game over e level clear no engine — `server/GameLoop.js` + `server/index.js`
- [ ] Task 6: Vue 3 client base — `client/index.html`, `client/vite.config.js` (server.proxy /ws → ws://localhost:3000), `client/src/main.js`, `client/src/App.vue` (monta useWebSocket + useInput + GameCanvas + GameHUD), `client/src/composables/useWebSocket.js` (connect/reconnect/send), `client/src/composables/useInput.js` (keydown → send action) — `client/src/`
- [ ] Task 7: GameCanvas.vue — Canvas 224×256 scale 3×, loop requestAnimationFrame, desenha: fundo preto, player (rect verde), invaders (rect por tipo/linha), bullets (rect branco), shields (blocos com HP → opacidade), UFO (rect magenta) — `client/src/components/GameCanvas.vue`
- [ ] Task 8: GameHUD.vue — score e level no topo, vidas no rodapé (ícones de nave), overlay "PRESS ENTER TO START" em status=waiting, overlay "GAME OVER score: N" com instrução restart em status=gameover — `client/src/components/GameHUD.vue`
- [ ] Task 9: Polish — flash de hit (rect branco 2 frames sobre entidade atingida), animação UFO entrada/saída, sons opcionais via AudioContext (beep 8-bit no fire/kill/hit), garantir reconnect automático do WS, testar level clear → level 2 — `client/src/App.vue` + `server/GameEngine.js`

## Next

> Task 1: Monorepo setup

````

---

## PHASE 3 — Git init e commit

Run these commands exactly, in order:

```bash
git init
git add -A
git commit -m "chore: space invaders scaffold — PROJECT.md + MEMORY.md"
````

---

## PHASE 4 — Spawn planner

After the git commit, invoke the planner agent with this exact prompt:

```
@planner Você está iniciando a execução do projeto Space Invaders.

Leia @MEMORY.md e @PROJECT.md antes de qualquer ação.

A próxima task é a Task 1: Monorepo setup.

Sua missão nesta task:
- Spawnar backend-dev para criar package.json raiz com workspaces ["server","client"]
- server/package.json: name space-invaders-server, type module, dependencies fastify@4 e @fastify/websocket
- client/package.json: name space-invaders-client, type module, devDependencies vite@6 @vitejs/plugin-vue vue@3.5
- Após os arquivos criados, rodar: npm install (na raiz)

Siga o protocolo completo: planner → backend-dev → verifier → documenter.
Ao atribuir a task, defina ralph_ready: true no JSON control block do MEMORY.md.
```

---

Quando todas as fases estiverem completas, confirme com:

```
Space Invaders bootstrap completo.
PROJECT.md ✓  MEMORY.md ✓  git init ✓  planner spawned ✓
Execute: bash ralph.py — para o loop autônomo das 9 tasks.
```
