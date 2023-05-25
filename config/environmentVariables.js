import dotenv from 'dotenv'

dotenv.config()

const ENVIRONMENT_VARIABLE = {
  EMAIL_AUTO_REPLY_CRON_TIME: process.env.EMAIL_AUTO_REPLY_CRON_TIME,
  SCOPES: process.env.SCOPES,
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  REDIRECT_URI: process.env.REDIRECT_URI
}

export default ENVIRONMENT_VARIABLE
