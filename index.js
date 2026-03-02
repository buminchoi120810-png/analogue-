const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Events
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites
  ]
});

const WELCOME_CHANNEL_ID = '1477661225813803039'; // 👈 환영 보낼 채널
const VERIFY_CHANNEL_ID = '1477661440331481253';

let invites = new Map();
let inviteCount = new Map();

client.once(Events.ClientReady, async () => {
  console.log(`${client.user.tag} 로그인 완료`);

  for (const guild of client.guilds.cache.values()) {
    const guildInvites = await guild.invites.fetch();
    invites.set(guild.id, guildInvites);
  }
});

// 🔹 초대 코드 업데이트
client.on(Events.InviteCreate, async (invite) => {
  const guildInvites = await invite.guild.invites.fetch();
  invites.set(invite.guild.id, guildInvites);
});

// 🔹 서버 입장 이벤트
client.on(Events.GuildMemberAdd, async (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  const newInvites = await member.guild.invites.fetch();
  const oldInvites = invites.get(member.guild.id);

  const usedInvite = newInvites.find(inv =>
    oldInvites.get(inv.code)?.uses < inv.uses
  );

  invites.set(member.guild.id, newInvites);

  let inviter = '알 수 없음';
  let total = 0;

  if (usedInvite && usedInvite.inviter) {
    inviter = `<@${usedInvite.inviter.id}>`;

    total = inviteCount.get(usedInvite.inviter.id) || 0;
    total++;
    inviteCount.set(usedInvite.inviter.id, total);
  }

  const embed = new EmbedBuilder()
    .setTitle('🎉 ANALOGUE STUDIO에 오신 걸 환영합니다!')
    .setDescription(
      `${member} 님 Analogue Studio 에 오신것을 환영합니다!\n\n` +
      `👉 <#${VERIFY_CHANNEL_ID}> 채널에서 인증을 진행해주세요.\n\n` +
      `👤 초대한사람: ${inviter}\n` +
      `🔥 누적초대횟수: ${total}`
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(0x2b2d31)
    .setTimestamp();

  channel.send({ embeds: [embed] });
});

client.login(process.env.TOKEN);
