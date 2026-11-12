const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    EmbedBuilder,
    MessageFlags,
    inlineCode
} = require("discord.js");

const TemporaryVC = require("../../models/TemporaryVC");
const ttsList = require("../../../config/ttsList.json");

function createVCConfigContainer(channelId, userId, preference) {
    const voiceLabel = ttsList.find(t => t.value === preference.voice_type)?.label || preference.voice_type || "未設定";

    return new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `## :tools: 一時的なVCを作成しました \n 一時的なVCはすべてのユーザーが退出すると削除されます。\n 作成者: <@${userId}>`,
                ),
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
                "### 現在のチャンネル設定\n" +
                `**チャンネル名**: ${inlineCode(preference.name || "未設定")}\n` +
                `**最大参加人数**: ${inlineCode(preference.member_limit === 0 ? "制限なし" : preference.member_limit + "人")}\n` +
                `**読み上げ設定**: ${inlineCode(preference.read_message === 1 ? "オン" : "オフ")}\n` +
                `**参加・退出通知設定**: ${inlineCode(preference.notify_log === 1 ? "オン" : "オフ")}\n` +
                `**読み上げボイス**: ${inlineCode(voiceLabel)}`
            )
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
        )
        .addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel("ブラウザで設定")
                        .setStyle(ButtonStyle.Link)
                        .setURL(`${process.env.DASHBOARD_URL}/settings/vc?channelId=${channelId}`),
                    new ButtonBuilder()
                        .setLabel("Discord上で設定")
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId(`channelPref_${channelId}`)
                )
        );
}

async function updateVCConfig(client, channelId, userId, preference) {
    const parsedMemberLimit = Number(preference.member_limit) || 0;
    const parsedNotifyLog = preference.notify_log ? 1 : 0;
    const parsedReadMessage = preference.read_message ? 1 : 0;
    const rawVoiceType = Array.isArray(preference.voice_type) ? preference.voice_type[0] : preference.voice_type;
    const selectedVoiceType = rawVoiceType || "f1";

    let targetUserId = userId;
    if (channelId) {
        const vc = await TemporaryVC.getVC(channelId);
        const creatorId = vc ? vc.creator_id : null;
        if (creatorId) {
            targetUserId = (userId !== creatorId && userId == process.env.BOT_OWNER_ID)
                ? creatorId
                : creatorId;
        }
    }

    const newPreferences = {
        user_id: targetUserId,
        name: preference.name,
        member_limit: parsedMemberLimit,
        notify_log: parsedNotifyLog,
        read_message: parsedReadMessage,
        voice_type: selectedVoiceType
    };

    // 保存前の設定を取得（savePrefsでキャッシュが上書きされる前に取得する）
    const currentPreferences = (await TemporaryVC.getPrefs(targetUserId)) || {};

    await TemporaryVC.savePrefs(
        targetUserId,
        preference.name,
        parsedMemberLimit,
        parsedNotifyLog,
        parsedReadMessage,
        selectedVoiceType
    );

    if (channelId && client) {
        const channel = client.channels.cache.get(channelId) || await client.channels.fetch(channelId).catch(() => null);
        if (channel) {
            if (channel.isVoiceBased()) {
                await channel.edit({
                    name: preference.name || channel.name,
                    userLimit: parsedMemberLimit
                }).catch(err => console.error("[updateVCConfig channel.edit Error]:", err));
            }

            const messages = await channel.messages.fetch({ limit: 10 }).catch(() => null);
            if (messages) {
                const controlMessage = messages.find(m => m.author.id === client.user.id);
                if (controlMessage) {
                    const updatedContainer = createVCConfigContainer(channelId, targetUserId, newPreferences);
                    await controlMessage.edit({
                        components: [updatedContainer],
                        flags: MessageFlags.IsComponentsV2
                    }).catch(err => console.error("[updateVCConfig controlMessage.edit Error]:", err));
                }
            }

            const keyLabels = {
                name: "チャンネル名",
                member_limit: "最大参加人数",
                notify_log: "参加・退出通知設定",
                read_message: "読み上げ設定",
                voice_type: "読み上げボイス"
            };

            // check the preference diff
            const diff = [];

            for (const key of Object.keys(keyLabels)) {
                if (JSON.stringify(currentPreferences[key]) !== JSON.stringify(newPreferences[key])) {
                    diff.push({
                        key,
                        oldValue: currentPreferences[key],
                        newValue: newPreferences[key]
                    });
                }
            }

            const formatValue = (key, val) => {
                if (val === undefined || val === null || val === "") return "未設定";
                if (key === "member_limit") return val === 0 ? "制限なし" : `${val}人`;
                if (key === "notify_log" || key === "read_message") return val === 1 ? "オン" : "オフ";
                if (key === "voice_type") {
                    const voice = ttsList.find(t => t.value === val);
                    return voice ? voice.label : val;
                }
                return String(val);
            };

            if (diff.length > 0) {
                const embed = new EmbedBuilder()
                    .setTitle("チャンネル設定を更新しました")
                    .setColor(0x0099ff)
                    .addFields(diff.map(({ key, oldValue, newValue }) => {
                        return {
                            name: keyLabels[key] || key,
                            value: inlineCode(`${formatValue(key, oldValue)} -> ${formatValue(key, newValue)}`)
                        };
                    }));
                await channel.send({
                    embeds: [embed]
                });
            } else {
                await channel.send("チャンネル設定を更新しました");
            }
        }
    }

    return newPreferences;
}

module.exports = {
    createVCConfigContainer,
    updateVCConfig
};