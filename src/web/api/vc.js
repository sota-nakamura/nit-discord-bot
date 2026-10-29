const { MessageFlags } = require("discord.js");
const TemporaryVC = require("../../models/TemporaryVC");
const createVCConfigContainer = require("../../utils/components/tempvc");
const router = require("express").Router();
const ttsList = require("../../../config/ttsList.json");
async function getPrefs (req, res) {
    const channelId = req.params.channelId;
    const userId = req.params.userId;
    if (!channelId && !userId) {
        return res.status(404).json({ error_name: "MISSING_PARAMETER", error: "パラメータが足りません。" });
    } else if (channelId) {
        const vc = await TemporaryVC.getVC(channelId);
        const preferences = await TemporaryVC.getPrefs(vc.creator_id);
        return res.status(200).json({
            preferences,
            tts: ttsList
        });
    } else if (userId) {
        const preferences = await TemporaryVC.getPrefs(userId);
        if (!preferences) {
            return res.status(404).json({ error_name: "PREFERENCES_NOT_FOUND", error: "設定が見つかりませんでした。" });
        }
        return res.status(200).json({
            preferences,
            tts: ttsList
        });
    }
}

async function savePrefs (req, res) {
    try {
        const channelId = req.params.channelId;
        const { userId, name, memberLimit, notifyLog, readMessage, voiceType } = req.body;

        const parsedMemberLimit = Number(memberLimit) || 0;
        const parsedNotifyLog = notifyLog ? 1 : 0;
        const parsedReadMessage = readMessage ? 1 : 0;
        const selectedVoiceType = voiceType || "f1";

        // 1. DBに設定を保存
        await TemporaryVC.savePrefs(
            userId,
            name,
            parsedMemberLimit,
            parsedNotifyLog,
            parsedReadMessage,
            selectedVoiceType
        );

        const currentPreferences = {
            user_id: userId,
            name,
            member_limit: parsedMemberLimit,
            notify_log: parsedNotifyLog,
            read_message: parsedReadMessage,
            voice_type: selectedVoiceType
        };

        if(channelId) {
            const client = req.app.get("discordClient");
            if (client) {
                const channel = client.channels.cache.get(channelId) || await client.channels.fetch(channelId).catch(() => null);
                if (channel) {
                    if (channel.isVoiceBased()) {
                        await channel.edit({
                            name: name || channel.name,
                            userLimit: parsedMemberLimit
                        }).catch(err => console.error("[setprefs channel.edit Error]:", err));
                    }

                    const messages = await channel.messages.fetch({ limit: 10 }).catch(() => null);
                    if (messages) {
                        const controlMessage = messages.find(m => m.author.id === client.user.id);
                        if (controlMessage) {
                            const updatedContainer = createVCConfigContainer(channelId, userId, currentPreferences);
                            await controlMessage.edit({
                                components: [updatedContainer],
                                flags: MessageFlags.IsComponentsV2
                            }).catch(err => console.error("[setprefs controlMessage.edit Error]:", err));
                        }
                    }
                }
            }
        }

        res.status(200).json({
            message: "Settings saved successfully",
            preference: currentPreferences
        });
    } catch (err) {
        console.error("[setprefs Error]:", err);
        res.status(500).json({ error: "Failed to save settings", details: err.message });
    }
}
router.get("/channels/:channelId", getPrefs);
router.get("/preferences/:userId", getPrefs);
router.post("/channels/:channelId", savePrefs);
router.post("/preferences", savePrefs);

module.exports = router;