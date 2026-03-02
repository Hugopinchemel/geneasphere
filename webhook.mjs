import {createServer} from 'node:http'
import {createHmac, timingSafeEqual} from 'node:crypto'
import {exec} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {dirname, join} from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PORT = process.env.WEBHOOK_PORT || 9000
const SECRET = process.env.WEBHOOK_SECRET
const DEPLOY_SCRIPT = join(__dirname, 'deploy.sh')

if (!SECRET) {
  console.error('WEBHOOK_SECRET environment variable is required')
  process.exit(1)
}

function verifySignature(payload, signature) {
  if (!signature?.startsWith('sha256=')) return false
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex')
  const provided = signature.slice('sha256='.length)
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'))
  } catch {
    return false
  }
}

function runDeploy(res) {
  console.log(`[${new Date().toISOString()}] Deploy triggered`)
  exec(`bash ${DEPLOY_SCRIPT}`, {cwd: __dirname}, (err, stdout, stderr) => {
    if (err) {
      console.error('Deploy failed:', stderr)
    } else {
      console.log('Deploy succeeded:', stdout)
    }
  })
  // Respond immediately — deploy runs in background
  res.writeHead(202, {'Content-Type': 'application/json'})
  res.end(JSON.stringify({status: 'deploy started'}))
}

const server = createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(404)
    return res.end('Not found')
  }

  const chunks = []
  req.on('data', chunk => chunks.push(chunk))
  req.on('end', () => {
    const body = Buffer.concat(chunks)
    const signature = req.headers['x-hub-signature-256']

    if (!verifySignature(body, signature)) {
      console.warn(`[${new Date().toISOString()}] Invalid signature — rejected`)
      res.writeHead(401)
      return res.end('Unauthorized')
    }

    // Optional: only deploy on push to master
    try {
      const payload = JSON.parse(body.toString())
      const branch = payload.ref?.replace('refs/heads/', '')
      if (branch && branch !== 'master') {
        res.writeHead(200)
        return res.end(`Skipped branch: ${branch}`)
      }
    } catch { /* non-JSON body is fine, just deploy */
    }

    runDeploy(res)
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Webhook server listening on 127.0.0.1:${PORT}/deploy`)
})
