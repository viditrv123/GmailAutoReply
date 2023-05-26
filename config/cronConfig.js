'use strict'

import { emailAutoReplyCron } from '../crons'
import { delayTimer } from '../helper'

const enableCrons = async () => {
  console.log('Email Auto Reply cron starting .....')
  let startCron
  const delay = delayTimer(45, 120)
  const timeout = delay * 1000
  clearInterval(startCron)
  await emailAutoReplyCron()
  console.log('Delay for the execution of next mail is' + delay)
  startCron = setInterval(async () => {
    await enableCrons()
  }, timeout)
}

export default enableCrons
