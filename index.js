import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'close') {
            const shouldReconnect =
                (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut)
            if (shouldReconnect) {
                startBot()
            }
        } else if (connection === 'open') {
            console.log('Bot connected successfully ✅')
        }
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message) return

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text

        if (text === 'hi') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Hello 👋 I am your WhatsApp bot!' })
        }
    })
}

startBot()
