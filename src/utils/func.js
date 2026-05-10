async function getRoleId(guild, id) {
    const role = await guild.roles.fetch(id);
    return role;
}

module.exports = {
    getRoleId
};