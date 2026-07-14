
function start15MinScheduler(task) {
    const fifteenMinutesInMs = 15 * 60 * 1000;

    async function scheduleNext() {
        if (task.onlyProduction && process.env.NODE_ENV !== "production") {
            return;
        } else {
            const now = Date.now();
            const nextMark = Math.ceil(now / fifteenMinutesInMs) * fifteenMinutesInMs;
            let delay = nextMark - now;

            if (delay < 1000) {
                delay += fifteenMinutesInMs;
            }

            const nextExecutionTime = new Date(now + delay);
            console.log(`[Scheduler] 次の定期実行予定: ${task.name} ${nextExecutionTime.toLocaleString('ja-JP')} (残り ${Math.floor(delay / 60000)}分 ${Math.floor((delay % 60000) / 1000)}秒)`);

            setTimeout(async () => {
                try {
                    console.log(`[Scheduler] 定期処理を実行します...(${task.name}) (実行時刻: ${new Date().toLocaleString('ja-JP')})`);
                    await task.process();
                } catch (error) {
                    console.error(`[Scheduler] 定期処理: ${task.name} の実行中にエラーが発生しました: ${task.name}`, error);
                }
                scheduleNext();
            }, delay);
        }
    }

    scheduleNext();
}

function createScheduledTask(task) {
    const time = task.time;
    const delay = time - Date.now();
    if (delay < 0) return;
    console.log(`[ScheduledTask] 予定処理を作成します...(${task.name}) (実行時刻: ${new Date(time).toLocaleString('ja-JP')})`);
    setTimeout(async () => {
        try {
            console.log(`[ScheduledTask] 予定処理を実行します...(${task.name}) (実行時刻: ${new Date(time).toLocaleString('ja-JP')})`);
            await task.process();
        } catch (error) {
            console.error(`[ScheduledTask] 予定処理: ${task.name} の実行中にエラーが発生しました: ${task.name}`, error);
        }
    }, delay);
}

module.exports = { start15MinScheduler, createScheduledTask };
