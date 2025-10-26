const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, InteractionType } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', async () => {
    console.log('Bot is online!');

    // Register the slash command
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

    const command = new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask the AI a question (Gemini)')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Your question for the AI')
                .setRequired(true)
        );

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: [command.toJSON()] },
        );
        console.log('Successfully registered slash (/ask) command.');
    } catch (error) {
        console.error(error);
    }
});

// Handle message events (classic)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== process.env.CHANNEL_ID) return;

    try {
        const result = await model.generateContent(message.content);
        const aiResponse = result.response.text();

        await message.reply(aiResponse);
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
