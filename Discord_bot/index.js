const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const fs = require('fs');

const aiResponse = require('./utils/aiResponse.js');

dotenv.config();

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const systemPrompt = aiResponse.buildSystemPrompt(config);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log('walter white is online!');
    console.log(`System prompt loaded: ${systemPrompt.substring(0, 100)}...`);
});

const processedMessages = new Set();

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!message.mentions.has(client.user)) return;

    if (processedMessages.has(message.id)) return;
    processedMessages.add(message.id);

    if (processedMessages.size > 100) {
        const oldIds = Array.from(processedMessages).slice(0, processedMessages.size - 100);
        oldIds.forEach(id => processedMessages.delete(id));
    }

    try {
        console.log(`Processing message from ${message.author.username}: "${message.content}"`);

        const response = await aiResponse.generateAIResponse(
            message.content,
            model,
            systemPrompt
        );

        await message.reply(response);

        console.log(`✅ Responded to ${message.author.username}`);

    } catch (error) {
        console.error('Error:', error);
        await message.reply('Sorry, I had an error processing your message.');
    }
});

// slash commmands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ask') {
        await interaction.deferReply(); 

        const question = interaction.options.getString('question');
        try {
            const result = await model.generateContent(question);
            const aiResponse = result.response.text();
            await interaction.editReply(aiResponse);
        } catch (error) {
            console.error('Error:', error);
            await interaction.editReply('Sorry, I had an error processing your message.');
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
