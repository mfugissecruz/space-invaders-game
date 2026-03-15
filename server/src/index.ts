import 'dotenv/config'
import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import { WSHandler } from './WSHandler.js'
import { GameEngine } from './GameEngine.js'
import { GameLoop }   from './GameLoop.js'

const PORT    = Number(process.env['PORT']    ?? 3000)
const WS_PATH = String(process.env['WS_PATH'] ?? '/ws')

const fastify = Fastify({ logger: { level: 'info' } })
await fastify.register(websocket)

const engine  = new GameEngine()
const handler = new WSHandler()
const loop    = new GameLoop(engine, handler)

fastify.get(WS_PATH, { websocket: true }, (connection, _request) => {
  const socket = connection.socket
  handler.register(socket)
  socket.on('message', (raw: Buffer | string) => handler.handleInput(raw.toString(), engine))
  socket.on('close',   ()                      => handler.unregister(socket))
})

fastify.get('/health', async () => ({ status: 'ok' }))

fastify.post('/attract/start', async () => {
  loop.startAttract()
  return { status: 'attract_started' }
})

fastify.post('/attract/stop', async () => {
  loop.stopAttract()
  return { status: 'attract_stopped' }
})

loop.start()
await fastify.listen({ port: PORT, host: '0.0.0.0' })
