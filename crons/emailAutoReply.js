'use strict'

import { emailAutoReply } from '../models'

const emailAutoReplyCron = async () => {
  try {
    const googleClient = await emailAutoReply.authorize()
    await emailAutoReply.emailAutoReplyHandler(googleClient)
    console.log('Email successfully triggered')
  } catch (err) {
    console.error('Error occured while triggering the email' + err)
  }
}

export default emailAutoReplyCron
