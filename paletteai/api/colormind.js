export default async function handler(req, res) {
  try {
    const body = req.body && Object.keys(req.body).length
      ? req.body
      : { model: 'default', input: ['N', 'N', 'N', 'N', 'N'] }

    const upstream = await fetch('https://colormind.io/api/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const text = await upstream.text()
    res.status(upstream.status).send(text)
  } catch (err) {
    res.status(500).json({ error: 'Upstream request failed' })
  }
}
