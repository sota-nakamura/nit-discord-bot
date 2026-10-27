const TemporaryVC = require("../../models/TemporaryVC");
const router = require("express").Router();

router.get("/getprefs/:channelId", async (req, res, next) => {
    console.log(req.params.channelId)
    const existsVC = await TemporaryVC.existsVC(req.params.channelId);
    if (!existsVC) {
        return res.status(404).json({ error: "Voice channel not found" });
    }
    const preference = await TemporaryVC.getPrefs(req.params.channelId);
    res.json({
        preference: preference ? preference : {
            user_id: "",
            name: "",
            member_limit: 0,
            notify_log: false,
            read_message: false,
            voice_type: ""
        },
        ttl: [{
            label: "女性1 (ゆっくり/AquesTalk)",
            value: "f1"
        },
        {
            label: "女性2 (ゆっくり/AquesTalk)",
            value: "f2"
        },
        {
            label: "男性1 (ゆっくり/AquesTalk)",
            value: "m1"
        },
        {
            label: "男性2 (ゆっくり/AquesTalk)",
            value: "m2"
        },
        {
            label: "中性 (ゆっくり/AquesTalk)",
            value: "imd1"
        },
        {
            label: "機械1 (ゆっくり/AquesTalk)",
            value: "jgr"
        },
        {
            label: "機械2 (ゆっくり/AquesTalk)",
            value: "dvd"
        },
        {
            label: "ロボット (ゆっくり/AquesTalk)",
            value: "r1"
        },
        {
            label: "七海 (Edge TTS 女性)",
            value: "ja-JP-NanamiNeural"
        },
        {
            label: "圭太 (Edge TTS 男性)",
            value: "ja-JP-KeitaNeural"
        },
        {
            label: "葵 (Edge TTS 女性)",
            value: "ja-JP-AoiNeural"
        },
        {
            label: "大地 (Edge TTS 男性)",
            value: "ja-JP-DaichiNeural"
        },
        {
            label: "真夕 (Edge TTS 女性)",
            value: "ja-JP-MayuNeural"
        },
        {
            label: "直樹 (Edge TTS 男性)",
            value: "ja-JP-NaokiNeural"
        },
        {
            label: "志織 (Edge TTS 女性)",
            value: "ja-JP-ShioriNeural"
        }
        ],
    });
});

module.exports = router;