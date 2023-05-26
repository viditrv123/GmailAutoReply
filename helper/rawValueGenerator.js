'use strict'

import { EMAIL_CONSTANTS } from '../constants'

const rawValueGenerator = (toReceiver, subjectDetails, threadId) => {
  const headers = {
    To: toReceiver,
    Subject: `Re: ${subjectDetails}`,
    References: threadId
  }

  const headersString = Object.keys(headers)
    .map(key => `${key}: ${headers[key]}`)
    .join('\r\n')

  const body = EMAIL_CONSTANTS.VACCATION_MESSAGE

  const rawMessage = `${headersString}\r\n\r\n${body}`

  return Buffer.from(rawMessage).toString('base64')
}

export default rawValueGenerator
