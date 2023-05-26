'use strict'

import fs from 'fs'
import path from 'path'
import process from 'process'
import { authenticate } from '@google-cloud/local-auth'
import { google } from 'googleapis'
import { rawValueGenerator } from '../helper/index.js'
import { AUTHENTICATION_CONSTANTS, LABEL_CONSTANTS } from '../constants/index.js'
import CONFIG from '../config/index.js'

const { ENVIRONMENT_VARIABLE: { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SCOPES } } = CONFIG

const TOKEN_PATH = path.join(process.cwd(), AUTHENTICATION_CONSTANTS.FILE_NAMES.TOKEN)

const CREDENTIALS_PATH = path.join(process.cwd(), AUTHENTICATION_CONSTANTS.FILE_NAMES.CREDENTIALS)

const fileContent = fs.readFileSync(AUTHENTICATION_CONSTANTS.FILE_NAMES.CREDENTIALS, 'utf8')

// & & Parse the JSON into a JavaScript object

const data = JSON.parse(fileContent)

// & Modify the value of data in the JavaScript object

data.installed.client_id = CLIENT_ID
data.installed.client_secret = CLIENT_SECRET
data.installed.redirect_uris.pop()
data.installed.redirect_uris.push(REDIRECT_URI)

// & Convert the JavaScript object back to JSON

const updatedContent = JSON.stringify(data)

// & Write the updated JSON back to the file

fs.writeFileSync(AUTHENTICATION_CONSTANTS.FILE_NAMES.CREDENTIALS, updatedContent)

// & Function for fetching saved the credentials

const loadSavedCredentialsIfExist = async () => {
  try {
    const content = fs.readFileSync(TOKEN_PATH)
    const credentials = JSON.parse(content)
    return google.auth.fromJSON(credentials)
  } catch (err) {
    return null
  }
}

// & Function for saving the credentials for future use

const saveCredentials = async (client) => {
  try {
    const content = fs.readFileSync(CREDENTIALS_PATH)
    const keys = JSON.parse(content)
    const key = keys.installed || keys.web
    const payload = JSON.stringify({
      type: AUTHENTICATION_CONSTANTS.USER_TYPE,
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token
    })
    fs.writeFileSync(TOKEN_PATH, payload)
  } catch (err) {
    console.error('Error occured while saving the credentials' + err)
    throw err
  }
}

// & Function for authorization with the help of credentials fetched from Google Cloud Console

const authorize = async () => {
  try {
    let client = await loadSavedCredentialsIfExist()

    // & If we already have client then preventing further execution involving client creation

    if (client) {
      return client
    }

    // & If we don't have client then proceeding to create one

    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH
    })

    // & Saving the credentials for future use

    if (client.credentials) {
      await saveCredentials(client)
    }
    return client
  } catch (err) {
    console.error('Error occured while authorization' + err)
    throw err
  }
}

// & Function wrapping all the executions taking place for email reply

const emailAutoReplyHandler = async (auth) => {
  try {
    fs.readFileSync(AUTHENTICATION_CONSTANTS.FILE_NAMES.TOKEN, 'utf8')
    const gmail = google.gmail({ version: 'v1', auth })
    const gmailData = await gmail.users.messages.list({ userId: AUTHENTICATION_CONSTANTS.DEFAULT_USER })
    const { data: { messages } } = gmailData

    let threadInfo = await Promise.all(
      messages.map(async (details) => {
        const res = await gmail.users.threads.get({ userId: AUTHENTICATION_CONSTANTS.DEFAULT_USER, id: details.threadId })
        return res.data
      })
    )

    // & Only fetching those threads which are of length 1 and are unread as well

    threadInfo = threadInfo.filter((detaials) => detaials.messages.length === 1 && detaials.messages[0].labelIds.includes('UNREAD'))

    if (threadInfo.length === 0) {
      return 0
    }

    let labelDetais = await checkLableExists(auth)

    // & If label already exists then no need to make another label else create a new label

    if (!labelDetais) {
      labelDetais = await createLabel(auth)
    }

    await Promise.all(threadInfo.map(async (details) => {
      await addLabel(auth, details.id, labelDetais.id)
    }))

    await multipleMessageManager(auth, threadInfo)
    return threadInfo.length
  } catch (err) {
    console.error('Error occured in the email handler' + err)
    throw err
  }
}

// & Function iterating throw multiple message threads and triggering replies

const multipleMessageManager = async (auth, thread = []) => {
  try {
    thread.map(async (threadInfo) => {
      const newDetails = getSenderDetails(threadInfo.messages)
      const subjectDetails = getSubject(threadInfo.messages)

      // & Only take the 0th element as we already checked for length = 1

      const raw = await createMail(threadInfo.messages[0], newDetails, subjectDetails)
      await sendMail(auth, raw)
    })
  } catch (err) {
    console.error('Encountered an error while iterating throw thread in message manager' + err)
    throw err
  }
}

// & Function to check if our Vacation label exists in the gmail

const checkLableExists = async (auth) => {
  try {
    const gmail = google.gmail({ version: 'v1', auth })
    const lables = await gmail.users.labels.list({ userId: AUTHENTICATION_CONSTANTS.DEFAULT_USER })
    const vacationLabelDetails = lables.data.labels.filter(labelDetails => labelDetails.name === 'VACATION')

    // & if 0th element exists then the it will be truthy value else undefined making it a falsy value

    return vacationLabelDetails[0]
  } catch (err) {
    console.error('Error occured while checking for existing labels' + err)
    throw err
  }
}

// & Function to create our Vacation Label

const createLabel = async (auth) => {
  try {
    const gmail = google.gmail({ version: 'v1', auth })
    const lables = await gmail.users.labels.create({
      userId: AUTHENTICATION_CONSTANTS.DEFAULT_USER,
      id: LABEL_CONSTANTS.VACCATION.ID,
      resource: {
        name: LABEL_CONSTANTS.VACCATION.ID,
        color: {
          backgroundColor: LABEL_CONSTANTS.VACCATION.BG_COLOR,
          textColor: LABEL_CONSTANTS.VACCATION.TEXT_COLOR
        }
      }
    })
    const { data } = lables
    return data
  } catch (err) {
    console.error('Error occured while creating labels' + err)
    throw err
  }
}

// & Function to add the label to the thread

const addLabel = async (auth, id, labelId) => {
  try {
    const gmail = google.gmail({ version: 'v1', auth })
    const lables = await gmail.users.threads.modify({
      userId: AUTHENTICATION_CONSTANTS.DEFAULT_USER,
      id,
      resource: {
        addLabelIds: [labelId]
      }
    })
    return lables
  } catch (err) {
    console.error('Error occured while adding the labels to the thread' + err)
    throw err
  }
}

// & Function to create reply body for our mail

const createMail = async (message, toReceiver, subjectDetails) => {
  try {
    const reply = {
      threadId: message.threadId,
      requestBody: {
        raw: rawValueGenerator(toReceiver, subjectDetails, message.threadId),
        threadId: message.threadId
      }
    }
    return reply
  } catch (err) {
    console.error('Error occured while creating email body' + err)
    throw err
  }
}

// & Function responsible for triggering the mail

const sendMail = async (auth, message) => {
  try {
    const gmail = google.gmail({ version: 'v1', auth })
    const messageRes = await gmail.users.messages.send({
      userId: AUTHENTICATION_CONSTANTS.DEFAULT_USER,
      requestBody: message.requestBody
    })
    return messageRes
  } catch (err) {
    console.error('Error occured while sending the replt to email' + err)
    throw err
  }
}

// & Function responsible for extracting senders details

const getSenderDetails = (message) => {
  try {
    const senderHeaders = message[0].payload.headers.filter(header => header.name === 'From')
    return senderHeaders[0].value
  } catch (err) {
    console.error('Error occured while try to get senders details' + err)
    throw err
  }
}

// & Function responsible for extracting subject of the mail

const getSubject = (message) => {
  try {
    const subjectHeaders = message[0].payload.headers.filter(header => header.name === 'Subject')
    return subjectHeaders[0].value
  } catch (err) {
    console.error('Error occured while finding the Subject of the mail' + err)
    throw err
  }
}

const emailAutoReply = {
  authorize,
  emailAutoReplyHandler
}

export default emailAutoReply
