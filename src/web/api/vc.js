const { MessageFlags } = require("discord.js");
const TemporaryVC = require("../../models/TemporaryVC");
const createVCConfigContainer = require("../../utils/components/tempvc");
const router = require("express").Router();
const ttsList = require("../../../config/ttsList.json");

async function getPrefs(req, res, next) {
    try {
        const channelId = req.params.channelId;
        const userId = req.params.userId;

        if (!channelId && !userId) {
            return next({
                status: 400,
                name: "MISSING_PARAMETER",
                message: "パラメータが足りません。"
            });
        }

        if (channelId) {
            const vc = await TemporaryVC.getVC(channelId);
            if (!vc) {
                return next({
                    status: 404,
                    name: "VC_NOT_FOUND",
                    message: "対象のボイスチャンネルが見つかりませんでした。"
                });
            }
            const preferences = await TemporaryVC.getPrefs(vc.creator_id);
            if (!preferences) {
                return next({
                    status: 404,
                    name: "PREFERENCES_NOT_FOUND",
                    message: "設定が見つかりませんでした。"
                });
            }
            return res.status(200).json({
                preferences,
                tts: ttsList
            });
        }

        if (userId) {
            const preferences = await TemporaryVC.getPrefs(userId);
            if (!preferences) {
                return next({
                    status: 404,
                    name: "PREFERENCES_NOT_FOUND",
                    message: "設定が見つかりませんでした。"
                });
            }
            return res.status(200).json({
                preferences,
                tts: ttsList
            });
        }
    } catch (err) {
        console.error("[getPrefs Error]:", err);
        next(err);
    }
}

async function savePrefs(req, res, next) {
    try {
        const channelId = req.params.channelId;
        let userId;
        const { name, memberLimit, notifyLog, readMessage, voiceType } = req.body;

        userId = req.body.userId;

        if (!userId) {
            return next({
                status: 400,
                name: "MISSING_PARAMETER",
                message: "ユーザーIDが指定されていません。"
            });
        }

        const parsedMemberLimit = Number(memberLimit) || 0;
        const parsedNotifyLog = notifyLog ? 1 : 0;
        const parsedReadMessage = readMessage ? 1 : 0;
        const selectedVoiceType = voiceType || "f1";


        const newPreferences = {
            user_id: userId,
            name,
            member_limit: parsedMemberLimit,
            notify_log: parsedNotifyLog,
            read_message: parsedReadMessage,
            voice_type: selectedVoiceType
        };

        if (channelId) {
            const vc = await TemporaryVC.getVC(channelId);
            const creatorId = vc ? vc.creator_id : null;
            const targetUserId = (creatorId && userId !== creatorId && userId == process.env.BOT_OWNER_ID)
                ? creatorId
                : userId;

            newPreferences.user_id = targetUserId;

            // 保存前の設定を取得（savePrefsでキャッシュが上書きされる前に取得する）
            const currentPreferences = (await TemporaryVC.getPrefs(targetUserId)) || {};

            await TemporaryVC.savePrefs(
                targetUserId,
                name,
                parsedMemberLimit,
                parsedNotifyLog,
                parsedReadMessage,
                selectedVoiceType
            );

            // edit channel config embed
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
                            const updatedContainer = createVCConfigContainer(channelId, targetUserId, newPreferences);
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
            preference: newPreferences
        });
    } catch (err) {
        console.error("[setprefs Error]:", err);
        next(err);
    }
}

router.get("/channels/:channelId", getPrefs);
router.get("/preferences/:userId", getPrefs);
router.post("/channels/:channelId", savePrefs);
router.post("/preferences", savePrefs);

module.exports = router;
