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
