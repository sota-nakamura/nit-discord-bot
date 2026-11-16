const LoLAccount = require("../../models/LoLAccount");
const { getPuuid } = require("../../utils/riotApi");

const router = require("express").Router();

router.get("/get/:id", async (req, res, next) => {
    const lolAccounts = await LoLAccount.get(req.params.id);
    if (!lolAccounts || lolAccounts.length === 0) {
        return next({
            status: 404,
            name: "LOL_ACCOUNT_NOT_FOUND",
            message: "LoLアカウントが見つかりません"
        });
    }
    return res.json(lolAccounts);
});

router.post("/save", async (req, res, next) => {
    const userId = req.body.userId;
    const riotId = req.body.riotId;
    const name = riotId.split("#")[0];
    const tagLine = riotId.split("#")[1];
    const puuid = await getPuuid(name, tagLine);
    if (!puuid) {
        return next({
            status: 404,
            name: "PUUID_NOT_FOUND",
            message: "Riot IDが見つかりません"
        });
    }
    const result = await LoLAccount.register(userId, name, tagLine, puuid);
    if (!result) {
        return next({
            status: 500,
            name: "LOL_ACCOUNT_SAVE_FAILED",
            message: "LoLアカウントの保存に失敗しました"
        });
    }
    return res.json(result);
});

module.exports = router;
