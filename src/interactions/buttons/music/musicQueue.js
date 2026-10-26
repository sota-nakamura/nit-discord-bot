const { executeQueue } = require("../../../commands/music/queue");
module.exports = {
    customId: "music_queue",
    execute: executeQueue
};
