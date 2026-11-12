const TemporaryVC = require("../../models/TemporaryVC");
const { updateVCConfig } = require("../../utils/components/tempvc");
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
        const { userId, name, memberLimit, notifyLog, readMessage, voiceType } = req.body;

        if (!userId) {
            return next({
                status: 400,
                name: "MISSING_PARAMETER",
                message: "ユーザーIDが指定されていません。"
            });
        }

        const client = req.app.get("discordClient");
        const newPreferences = await updateVCConfig(client, channelId, userId, {
            name,
            member_limit: memberLimit,
            notify_log: notifyLog,
            read_message: readMessage,
            voice_type: voiceType
        });

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
