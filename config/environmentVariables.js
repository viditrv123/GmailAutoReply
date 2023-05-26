import dotenv from 'dotenv'

dotenv.config()

const ENVIRONMENT_VARIABLE = {
  SCOPES: (process.env.SCOPES).split('|'),
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  REDIRECT_URI: process.env.REDIRECT_URI
}

export default ENVIRONMENT_VARIABLE
