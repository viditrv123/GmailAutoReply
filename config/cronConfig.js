'use strict'

import cron from 'node-cron'
import { emailAutoReplyCron } from '../crons'
import { delayTimer } from '../helper'
import ENVIRONMENT_VARIABLE from './environmentVariables'

const enableCrons = () => {
  const delay = delayTimer(45, 120)
  console.log('Email Auto Reply cron starting .....')
  cron.schedule(ENVIRONMENT_VARIABLE.EMAIL_AUTO_REPLY_CRON_TIME.replace('delay', delay), () => {
    emailAutoReplyCron()
  })
}

export default enableCrons
