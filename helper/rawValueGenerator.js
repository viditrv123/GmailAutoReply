'use strict'

import { EMAIL_CONSTANTS } from '../constants'

const rawValueGenerator = (toReceiver, subjectDetails) => {
  return Buffer.from(
           `To: ${toReceiver}\r\n` +
           `Subject: Re: ${subjectDetails}\r\n` +
           '\r\n' +
           EMAIL_CONSTANTS.VACCATION_MESSAGE
  ).toString('base64')
}

export default rawValueGenerator
