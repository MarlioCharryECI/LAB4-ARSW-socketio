import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

const store = new Map()
const keyOf = (a, n) => `${a}/${n}`

app.get('/api/blueprints/:author/:name', (req, res) => {
  const { author, name } = req.params
  const points = store.get(keyOf(author, name)) ?? []
  res.json({ author, name, points })
})

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

io.on('connection', (socket) => {
  console.log('[IO] conectado:', socket.id)

  socket.on('join-room', (room) => {
    socket.join(room)
    console.log('[IO] join:', room)
  })

  socket.on('draw-event', ({ room, point, author, name }) => {
    if (!room || !author || !name || !point) return
    const k = keyOf(author, name)
    const list = store.get(k) ?? []
    list.push({ x: point.x, y: point.y })
    store.set(k, list)
    io.to(room).emit('blueprint-update', { author, name, points: list })
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => console.log(`Socket.IO up on :${PORT}`))