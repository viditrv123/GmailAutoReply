'use strict'
import dotenv from 'dotenv'
import express from 'express'
import enableCrons from './config/cronConfig'

dotenv.config()

const app = express()
app.use(express.json())

const port = 8000

app.listen(port, () => {
  console.log(`App running on port ${port}`)
})

enableCrons()
