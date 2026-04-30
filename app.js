require('dotenv').config();
const {
    Client,
    Events,
    GatewayIntentBits,
    Collection,
    MessageFlags,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    SectionBuilder,
    ContainerBuilder,
    ButtonStyle,
    ButtonBuilder,
    SeparatorBuilder,
    TextDisplayBuilder,
    ModalBuilder,
    ChannelType,
    PermissionFlagsBits,
    ActivityType
} = require('discord.js');
const token = process.env.TOKEN;
const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

// SQLite データベースの初期化
const db = new Database('database.db');
db.prepare('CREATE TABLE IF NOT EXISTS temporary_vcs (channel_id TEXT PRIMARY KEY, creator_id TEXT)').run();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}
client.on(Events.ClientReady, async () => {
    client.user.setPresence({
        status: "online",
        activities: [{ name: "実は世界進出を狙っている", type: ActivityType.Custom }]
    });
});
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                }
            } catch (e) {
                console.error('Failed to send error reply:', e);
            }
        }
    } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('channelName_')) {
            const channelId = interaction.customId.split('_')[1];

            // データベースから作成者を取得
            const row = db.prepare('SELECT creator_id FROM temporary_vcs WHERE channel_id = ?').get(channelId);
            const creatorId = row ? row.creator_id : null;

            if (interaction.user.id !== creatorId) {
                return interaction.reply({ content: '作成者のみがチャンネル設定を変更できます。', flags: MessageFlags.Ephemeral });
            }

            const modal = new ModalBuilder()
                .setCustomId('channelNameModal_' + channelId)
                .setTitle('チャンネル名を設定してください');

            const channelNameInput = new TextInputBuilder()
                .setCustomId('channelNameInput')
                .setLabel("新しいチャンネル名を入力")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('例: ○○のゲーム配信')
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(channelNameInput);
            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('channelNameModal_')) {
            const channelId = interaction.customId.split('_')[1];

            // データベースから作成者を取得
            const row = db.prepare('SELECT creator_id FROM temporary_vcs WHERE channel_id = ?').get(channelId);
            const creatorId = row ? row.creator_id : null;

            if (interaction.user.id !== creatorId) {
                return interaction.reply({ content: '作成者のみが名前を変更できます。', flags: MessageFlags.Ephemeral });
            }

            try {
                const channel = await interaction.guild.channels.fetch(channelId);
                if (channel) {
                    const newName = interaction.fields.getTextInputValue('channelNameInput');
                    await channel.setName(newName);
                    await interaction.reply({ content: `チャンネル名を **${newName}** に変更しました。`, flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'チャンネルが見つかりませんでした。', flags: MessageFlags.Ephemeral });
                }
            } catch (error) {
                console.error('チャンネルの取得または名前の変更に失敗しました:', error);
                if (!interaction.replied) {
                    await interaction.reply({ content: 'チャンネル名の変更中にエラーが発生しました。', flags: MessageFlags.Ephemeral });
                }
            }
        }
    }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const userTag = newState.member.user.tag;
    const oldChannel = oldState.channel ? oldState.channel.name : "None";
    const newChannel = newState.channel ? newState.channel.name : "None";

    if (newState.channelId === "1499398070230712410" && oldState.channelId !== newState.channelId && newState.channel.members.size === 1) {
        try {
            const newChannel = await newState.guild.channels.create({
                name: `${newState.member.user.displayName}のVC`,
                type: ChannelType.GuildVoice,
                parent: newState.channel.parent,
                permissionOverwrites: [
                    {
                        id: newState.member.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                    },
                ],
            });

            // データベースに記録
            db.prepare('INSERT INTO temporary_vcs (channel_id, creator_id) VALUES (?, ?)').run(newChannel.id, newState.member.user.id);

            await newState.member.voice.setChannel(newChannel.id);
            const channelConfigContainer = new ContainerBuilder()
                .setAccentColor(0x0099ff)
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            '## :tools: 一時的なVCを生成しました \n - 一時的なVCはすべてのユーザーが退出すると削除されます。\n - 作成者のみが下のボタンからチャンネル名を変更できます。',
                        ),
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                )
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder()
                                .setContent('### チャンネル名の変更')
                        )
                        .setButtonAccessory(
                            new ButtonBuilder()
                                .setCustomId(`channelName_${newChannel.id}`)
                                .setLabel('設定')
                                .setStyle(ButtonStyle.Primary)
                        )
                )
            await newChannel.send({
                mentions: {
                    users: [newState.member.user.id],
                    everyone: false,
                    repliedUser: false
                },
                components: [channelConfigContainer],
                flags: MessageFlags.IsComponentsV2,
                withResponse: true
            });
        } catch (error) {
            console.error('VCへのメッセージ送信に失敗しました:', error);
        }
    }

    if (oldState.channelId && oldState.channelId !== newState.channelId) {
        // get channel object
        let oldChannel = oldState.channel;
        if (!oldChannel) {
            try {
                oldChannel = await oldState.guild.channels.fetch(oldState.channelId);
            } catch (e) {
                console.error('退出したチャンネルの取得に失敗しました:', e);
            }
        }

        if (oldChannel && oldChannel.members.size === 0) {
            if (oldState.channelId === "1499398070230712410") return;

            try {
                // ボットが作成したVCであれば削除する
                const row = db.prepare('SELECT 1 FROM temporary_vcs WHERE channel_id = ?').get(oldState.channelId);
                if (row) {
                    await oldChannel.delete();
                    //delete from DB
                    db.prepare('DELETE FROM temporary_vcs WHERE channel_id = ?').run(oldState.channelId);
                }
            } catch (error) {
                console.error('VCの削除に失敗しました:', error);
            }
        }
    }
});

client.login(token);