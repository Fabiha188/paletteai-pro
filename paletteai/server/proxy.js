import express from 'express'

const app  = express()
const PORT = process.env.PORT || 3001

app.use(express.json({ limit: '1mb' }))

// Allow all origins so the browser can reach this proxy in dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',  '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// Forward palette generation requests to Colormind
app.post('/api/colormind', async (req, res) => {
  try {
    const body = (req.body && Object.keys(req.body).length)
      ? req.body
      : { model: 'default', input: ['N', 'N', 'N', 'N', 'N'] }

    const upstream = await fetch('https://colormind.io/api/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    const text = await upstream.text()
    res.status(upstream.status).send(text)
  } catch (err) {
    console.error('Proxy error:', err.message)
    res.status(500).json({ error: 'Upstream request failed' })
  }
})

app.listen(PORT, () => {
  console.log(`Colormind proxy running at http://localhost:${PORT}/api/colormind`)
})
