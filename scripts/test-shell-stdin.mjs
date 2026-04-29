#!/usr/bin/env node
import WebSocket from '/Users/og/Documents/Projects/AlternateFutures/package-cloud-cli/node_modules/ws/wrapper.mjs'
import Conf from '/Users/og/Documents/Projects/AlternateFutures/package-cloud-cli/node_modules/conf/dist/source/index.js'

const serviceId = process.argv[2]
if (!serviceId) { console.error('usage: node test-shell-stdin.mjs <serviceId>'); process.exit(1) }

const conf = new Conf.default({ projectName: 'alternate-futures', configName: 'global' })
const token = conf.get('personalAccessToken')
if (!token) { console.error('no PAT in conf'); process.exit(1) }

const ws = new WebSocket(`wss://api.alternatefutures.ai/ws/shell?serviceId=${serviceId}`)
let ready = false
let buf = ''

ws.on('open', () => {
  console.log('[client] open, sending auth')
  ws.send(JSON.stringify({ type: 'auth', token }))
})

ws.on('message', (data, isBinary) => {
  if (!ready) {
    try {
      const msg = JSON.parse(data.toString())
      console.log('[client] control msg:', msg)
      if (msg.type === 'ready') {
        ready = true
        console.log('[client] READY — sending test commands in 500ms')
        setTimeout(() => {
          console.log('[client] sending: echo TYPING_TEST\\n')
          ws.send(Buffer.from('echo TYPING_TEST\n'))
        }, 500)
        setTimeout(() => {
          console.log('[client] sending: pwd\\n')
          ws.send(Buffer.from('pwd\n'))
        }, 1500)
        setTimeout(() => {
          console.log('[client] sending each char of "id" individually + newline')
          ws.send(Buffer.from('i'))
          setTimeout(() => ws.send(Buffer.from('d')), 50)
          setTimeout(() => ws.send(Buffer.from('\n')), 100)
        }, 2500)
        setTimeout(() => {
          console.log('[client] sending exit')
          ws.send(Buffer.from('exit\n'))
        }, 4000)
        setTimeout(() => { console.log('[client] timeout, closing'); ws.close() }, 8000)
      } else if (msg.type === 'error') {
        console.error('[client] ERROR:', msg.message)
      }
    } catch {}
    return
  }
  const text = data.toString('utf8')
  buf += text
  process.stdout.write(`<< ${JSON.stringify(text)}\n`)
})

ws.on('close', (code, reason) => {
  console.log(`[client] closed code=${code} reason=${reason}`)
  console.log('--- full server output ---')
  console.log(buf)
  process.exit(0)
})

ws.on('error', (err) => { console.error('[client] ws error:', err.message); process.exit(1) })
