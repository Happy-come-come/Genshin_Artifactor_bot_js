module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`起動完了：ログイン中=> ${client.user.tag}`);
    },
};
