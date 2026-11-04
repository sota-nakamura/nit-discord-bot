const LoLAccount = require("../../models/LoLAccount");

const router = require("express").Router();

router.get("/:id", async (req, res, next) => {
    const lolAccount = await LoLAccount.get(req.params.id);
    if (!lolAccount) {
        return next({
            status: 404,
            name: "LOL_ACCOUNT_NOT_FOUND",
            message: "LoLアカウントが見つかりません"
        });
    }
    res.json(lolAccount);
});

module.exports = router;
