# Space Invaders

**Defenda a Terra. Elimine a invasao. Nao deixe nenhum chegar.**

---

## Como jogar

| Tecla | Acao |
|-------|------|
| Seta esquerda | Mover nave para a esquerda |
| Seta direita | Mover nave para a direita |
| Espaco | Atirar |
| Enter | Iniciar / reiniciar partida |

---

## Objetivo

Destrua todos os 55 invaders antes que qualquer um deles chegue ate a sua nave.
Se um alien cruzar a linha de perigo — fim de jogo na hora, sem aviso.

---

## Inimigos

Cinco fileiras de invasores descem em bloco, acelerando conforme voce os abate.

| Posicao na grade | Pontos |
|-----------------|--------|
| Fileira do topo (linha 0) | 30 pts |
| Fileiras do meio (linhas 1 e 2) | 20 pts |
| Fileiras da base (linhas 3 e 4) | 10 pts |

De vez em quando aparece um **UFO** voando pelo topo da tela.
Acerte-o para ganhar um bonus surpresa: 50, 100, 150, 200 ou 300 pontos — a sorte decide.

---

## Sua nave

- Voce tem **3 vidas**. Cada tiro de invader que acerta tira uma vida.
- Pode ter no maximo **3 balas suas no ar ao mesmo tempo**.
- Os invaders tambem atiram — fique em movimento.

---

## Defesas

Ha **4 bunkers** entre voce e os invasores.
Cada bunker e formado por blocos com **3 pontos de resistencia**.
Os blocos absorvem tiros — tanto dos inimigos quanto seus.
Use-os como escudo, mas saiba que eles se desgastam com o tempo.

---

## Perigo

Se qualquer invader descer ate a linha Y 220 (proximo da sua nave), e **game over imediato** — independente das suas vidas restantes.
Nao deixe a frente de batalha chegar ate voce.

---

## Pontuacao

Quanto mais alto na grade, mais vale o alien. Priorize o topo.
O UFO vale bonus aleatorio e aparece sem hora marcada — fique de olho.

| Alvo | Pontos |
|------|--------|
| Invader topo | 30 |
| Invader meio | 20 |
| Invader base | 10 |
| UFO | 50 / 100 / 150 / 200 / 300 (aleatorio) |

Ao limpar a tela inteira, voce avanca de nivel — os invasores voltam mais rapidos.

---

## Como rodar

### Com Docker (recomendado — zero configuração)

```bash
docker compose up
```

Abra `http://localhost:8080` no navegador. Pronto.

> Requer apenas [Docker Desktop](https://docs.docker.com/get-docker/) instalado.

---

### Desenvolvimento local

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. O servidor roda em `localhost:3000`.

Dependências: Node.js 20+ e npm 10+.
