const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000')
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

var handleFile = './handle.js'

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)

      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const fn = () => {
    require(handleFile)
  }

  // Use hmr only in development mode
  if (dev) {
    const path = require('path')
    const hmr = require('node-hmr')

    var watchDir = './'

    hmr(() => {
      try {
        fn()
      } catch (e) {
        console.error(e)
        const moduleId = path.resolve(watchDir, handleFile)
        require.cache[moduleId] = { id: moduleId }
      }
    }, { watchDir: watchDir, watchFilePatterns: [handleFile] })
  } else
    fn()

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})