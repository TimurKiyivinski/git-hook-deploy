const env = require('./env')

const express = require('express')
const bodyParser = require('body-parser')
const shell = require('shelljs')

const sha256 = require('sha.js')('sha256')
const hash = value => sha256.update(value, 'utf8').digest('hex')

;(function () {
  const app = express()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))

  app.get('/', (req, res) => res.json({
    err: false,
    message: 'git-hook-deploy'
  }))

  env.map(site => {
    // Use a hash as webhook endpoint
    const id = hash(`${site.name}:${site.path}`)
    console.log(`[ADD] ${site.name} [ENDPOINT] /deploy/${id}`)

    app.post(`/deploy/${id}`, (req, res) => {
      if (req.body) {
        // Filter webhook for appropriate value
        const failures = site.actions
          .filter(action => req.body[action.key])
          .filter(action => req.body[action.key] === action.value)
          .map(action => {
            // Run commands
            shell.cd(site.path)
            const codes = action.commands
              .map(command => shell.exec(command).code)
              .filter(code => code !== 0)
              .map(code => {
                console.error(`[SITE] ${site.name} [ERROR] ${code}`)
                return code
              })

            return codes.length === 0
          })
          .filter(code => code) // This should be true if no error occured

        // There should be no failures returned
        res.json({
          err: failures.length === 0
        })
      } else {
        res.json({
          err: true,
          message: 'No body defined'
        })
      }
    })
  })

  app.listen(process.env.PORT || 9000)
})()
