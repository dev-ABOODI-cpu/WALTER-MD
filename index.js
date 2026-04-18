/**
 * Knight Bot - A WhatsApp Bot
 * Copyright (c) 2026 Dev ABOODI
 * 
 * This program is free software: you can redistribute it and/or modify
 * under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - System developed and modified by Dev ABOODI
 */

require('./settings')

const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, sleep, reSize } = require('./lib/myfunc')

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")

const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")

const store = require('./lib/lightweight_store')

store.readFromFile()

const settings = require('./settings')

setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// ================== OWNER DATA ==================
const OWNER_NAME = "Dev ABOODI"
const OWNER_NUMBER = "249112727808"
const BOT_NUMBER = "249113388050"

// ================== GLOBAL BOT INFO ==================
global.botname = "KNIGHT BOT"
global.themeemoji = "•"

let phoneNumber = BOT_NUMBER
let owner = OWNER_NUMBER

const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

const rl = process.stdin.isTTY
    ? readline.createInterface({ input: process.stdin, output: process.stdout })
    : null

const question = (text) => {
    if (rl) {
        return new Promise(resolve => rl.question(text, resolve))
    } else {
        return Promise.resolve(phoneNumber)
    }
}

// ================== START BOT FUNCTION ==================
async function startXeonBotInc() {
    try {
        let { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(`./session`)
        const msgRetryCounterCache = new NodeCache()

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: !pairingCode,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache
        })

        sock.ev.on('creds.update', saveCreds)
        store.bind(sock.ev)

        // ================== MESSAGE HANDLER ==================
        sock.ev.on('messages.upsert', async chatUpdate => {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return

            try {
                await handleMessages(sock, chatUpdate, true)
            } catch (err) {
                console.error(err)
            }
        })

        // ================== CONNECTION HANDLER ==================
        sock.ev.on('connection.update', async (update) => {
            const { connection } = update

            if (connection === "open") {
                console.log(chalk.green(`\n==============================`))
                console.log(chalk.green(`✔ BOT CONNECTED SUCCESSFULLY`))
                console.log(chalk.green(`==============================`))

                console.log(chalk.yellow(`BOT NAME   : ${global.botname}`))
                console.log(chalk.yellow(`OWNER NAME : ${OWNER_NAME}`))
                console.log(chalk.yellow(`OWNER NUM  : ${OWNER_NUMBER}`))
                console.log(chalk.yellow(`BOT NUM    : ${BOT_NUMBER}`))
                console.log(chalk.green(`STATUS     : ONLINE`))
            }

            if (connection === "close") {
                console.log(chalk.red(`Connection closed. Restarting...`))
                startXeonBotInc()
            }
        })

        return sock

    } catch (error) {
        console.error("Error:", error)
        setTimeout(startXeonBotInc, 5000)
    }
}

// ================== START ==================
startXeonBotInc()

// ================== ERROR HANDLING ==================
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})

// ================== AUTO RELOAD ==================
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    delete require.cache[file]
    require(file)
})