'use strict'

import cron from 'node-cron'
import { emailAutoReplyCron } from '../crons'
import { delayTimer } from '../helper'

const enableCrons = () => {
  const delay = delayTimer(45, 120)
  console.log(delay)
  console.log('Email Auto Reply cron starting .....')
  cron.schedule(`*/${delay} * * * * *`, () => {
    emailAutoReplyCron()
  })
}

export default enableCrons
