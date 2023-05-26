'use strict'

import { emailAutoReplyCron } from '../crons'
import { delayTimer } from '../helper'

const enableCrons = async () => {
  console.log('Email Auto Reply cron starting .....')
  let startCron
  const delay = delayTimer(10, 20)
  const timeout = delay * 1000
  clearInterval(startCron)
  await emailAutoReplyCron()
  startCron = setInterval(async () => {
    console.log(delay)
    await enableCrons()
  }, timeout)
}

export default enableCrons
