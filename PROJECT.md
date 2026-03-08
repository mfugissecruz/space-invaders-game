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
```

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
```

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
