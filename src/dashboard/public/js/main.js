document.addEventListener("DOMContentLoaded", () => {
    const pingEl = document.getElementById("stat-ping");
    const uptimeEl = document.getElementById("stat-uptime");
    const guildsEl = document.getElementById("stat-guilds");
    const commandsEl = document.getElementById("stat-commands");

    function formatUptime(uptimeMs) {
        const uptimeSeconds = Math.floor(uptimeMs / 1000);
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    async function fetchStatus() {
        try {
            const res = await fetch("/api/status");
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();

            if (pingEl) pingEl.textContent = data.ping >= 0 ? `${data.ping} ms` : "計測中";
            if (uptimeEl) uptimeEl.textContent = formatUptime(data.uptime);
            if (guildsEl) guildsEl.textContent = data.guildCount;
            if (commandsEl) commandsEl.textContent = data.commandCount;
        } catch (err) {
            console.error("Failed to fetch status:", err);
        }
    }

    // 30秒ごとに自動更新
    setInterval(fetchStatus, 1000);
});
