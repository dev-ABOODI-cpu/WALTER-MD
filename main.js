// 🧹 Fix for ENOSPC / temp overflow in hosted panels
const fs = require('fs');
const path = require('path');

// Redirect temp storage away from system /tmp
const customTemp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

// Auto-cleaner every 3 hours
setInterval(() => {
    fs.readdir(customTemp, (err, files) => {
        if (err) return;
        for (const file of files) {
            const filePath = path.join(customTemp, file);
            fs.stat(filePath, (err, stats) => {
                if (!err && Date.now() - stats.mtimeMs > 3 * 60 * 60 * 1000) {
                    fs.unlink(filePath, () => { });
                }
            });
        }
    });
    console.log('🧹 Temp folder auto-cleaned');
}, 3 * 60 * 60 * 1000);

const settings = require('./settings');
require('./config.js');

const { isBanned } = require('./lib/isBanned');
const isOwnerOrSudo = require('./lib/isOwner');
const { isSudo } = require('./lib/index');

const {
    autotypingCommand,
    handleAutotypingForMessage,
    showTypingAfterCommand
} = require('./commands/autotyping');

const { autoreadCommand, handleAutoread } = require('./commands/autoread');

// Commands
const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/help');
const banCommand = require('./commands/ban');
const { promoteCommand } = require('./commands/promote');
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const { handleTicTacToeMove } = require('./commands/tictactoe');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const { handleAntilinkCommand } = require('./commands/antilink');
const { handleAntitagCommand } = require('./commands/antitag');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
const jokeCommand = require('./commands/joke');
const quoteCommand = require('./commands/quote');
const factCommand = require('./commands/fact');
const weatherCommand = require('./commands/weather');
const newsCommand = require('./commands/news');
const kickCommand = require('./commands/kick');
const simageCommand = require('./commands/simage');
const attpCommand = require('./commands/attp');

const { startHangman, guessLetter } = require('./commands/hangman');
const { startTrivia, answerTrivia } = require('./commands/trivia');

const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');

// ===================== MAIN HANDLER =====================
async function handleMessages(sock, messageUpdate) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || chatId;

        const rawText =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            '';

        const userMessage = rawText.trim().toLowerCase();

        // store typing / autoread
        await handleAutoread(sock, message);

        if (!userMessage.startsWith('.')) {
            await handleAutotypingForMessage(sock, chatId, userMessage);
            return;
        }

        // ================= COMMANDS =================
        switch (true) {

            case userMessage === '.ping':
                await pingCommand(sock, chatId, message);
                break;

            case userMessage === '.menu':
                await helpCommand(sock, chatId, message);
                break;

            case userMessage.startsWith('.kick'):
                await kickCommand(sock, chatId, senderId, message);
                break;

            case userMessage.startsWith('.mute'):
                await muteCommand(sock, chatId, senderId, message);
                break;

            case userMessage === '.unmute':
                await unmuteCommand(sock, chatId, senderId);
                break;

            case userMessage.startsWith('.ban'):
                await banCommand(sock, chatId, message);
                break;

            case userMessage.startsWith('.unban'):
                const unbanCommand = require('./commands/unban');
                await unbanCommand(sock, chatId, message);
                break;

            case userMessage.startsWith('.tagall'):
                await tagAllCommand(sock, chatId, senderId, message);
                break;

            case userMessage.startsWith('.sticker'):
                await stickerCommand(sock, chatId, message);
                break;

            case userMessage.startsWith('.warn'):
                await warnCommand(sock, chatId, senderId, message);
                break;

            case userMessage.startsWith('.warnings'):
                await warningsCommand(sock, chatId, message);
                break;

            case userMessage.startsWith('.tts'):
                await ttsCommand(sock, chatId, rawText.slice(4));
                break;

            case userMessage.startsWith('.simage'):
                await simageCommand(sock, message, chatId);
                break;

            case userMessage.startsWith('.attp'):
                await attpCommand(sock, chatId, message);
                break;

            case userMessage === '.owner':
                await ownerCommand(sock, chatId);
                break;

            case userMessage.startsWith('.delete'):
                await deleteCommand(sock, chatId, message, senderId);
                break;

            case userMessage.startsWith('.tag'):
                await tagCommand(sock, chatId, senderId, rawText, message);
                break;

            case userMessage.startsWith('.hidetag'):
                await hideTagCommand(sock, chatId, senderId, rawText, message);
                break;

            case userMessage.startsWith('.menu') || userMessage === '.help':
                await helpCommand(sock, chatId, message);
                break;

            case userMessage.startsWith('.joke'):
                await jokeCommand(sock, chatId, message);
                break;

            case userMessage.startsWith('.quote'):
                await quoteCommand(sock, chatId, message);
                break;

            case userMessage.startsWith('.fact'):
                await factCommand(sock, chatId, message);
                break;

            case userMessage.startsWith('.weather'):
                await weatherCommand(sock, chatId, message, rawText);
                break;

            case userMessage.startsWith('.news'):
                await newsCommand(sock, chatId);
                break;

            case userMessage.startsWith('.tictactoe'):
                await handleTicTacToeMove(sock, chatId, senderId, rawText);
                break;

            case userMessage.startsWith('.guess'):
                await guessLetter(sock, chatId, rawText.split(' ')[1]);
                break;

            case userMessage.startsWith('.hangman'):
                await startHangman(sock, chatId);
                break;

            case userMessage.startsWith('.trivia'):
                await startTrivia(sock, chatId);
                break;

            case userMessage.startsWith('.answer'):
                await answerTrivia(sock, chatId, rawText);
                break;

            case userMessage.startsWith('.simp'):
                const simpCommand = require('./commands/simp');
                await simpCommand(sock, chatId, message);
                break;

            case userMessage.startsWith('.stupid'):
                const stupidCommand = require('./commands/stupid');
                await stupidCommand(sock, chatId, message);
                break;

            case userMessage.startsWith('.removebg'):
                const removebgCommand = require('./commands/removebg');
                await removebgCommand(sock, chatId, message);
                break;

            case userMessage.startsWith('.play'):
                const playCommand = require('./commands/play');
                await playCommand(sock, chatId, message);
                break;

            default:
                break;
        }

        await showTypingAfterCommand(sock, chatId);

    } catch (err) {
        console.log('Error:', err);
    }
}

module.exports = { handleMessages };