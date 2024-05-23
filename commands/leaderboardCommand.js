// leaderboardCommand.js
const { EmbedBuilder, Colors } = require('discord.js');
const UserCard = require('../models/UserCard.js');
const { Leaderboard } = require('../models/leaderboardSchema.js');

const leaderboardCommand = async (message) => {
  const leaderboardData = await Leaderboard.find().lean();
  const userCardData = await UserCard.find().lean();
  const leaderboard = leaderboardData
    .map((leader) => ({
      ...leader,
      totalBattles: leader.battlesWon + leader.battlesLost,
      cardCount: userCardData.find((user) => user.userId === leader.userId)?.cardIds.length || 0,
    }))
    .sort((a, b) => b.totalBattles - a.totalBattles);

  if (leaderboard.length === 0) {
    const noLeaderboardEmbed = new EmbedBuilder()
      .setColor(Colors.Gold)
      .setTitle('🏆🐐Leaderboard🏆🐐')
      .setDescription('```There is no one on the leaderboard (SERIOUS BATTLES ONLY*) yet.```');
    return message.reply({ embeds: [noLeaderboardEmbed] });
  }

  const topLeaderboard = leaderboard.slice(0, 5);
  const userRank = leaderboard.findIndex((leader) => leader.userId === message.author.id) + 1;
  const leaderboardEmbed = new EmbedBuilder()
    .setColor(Colors.Gold)
    .setTitle('🏆🐐Leaderboard🏆🐐')
    .setDescription(
      topLeaderboard
        .map(
          (leader, index) =>
          `**#${index + 1}** 🎖️${leader.userId}
          \`\`\`ansi
          \u001b[0;40m\u001b[1;32m 🎖️Total Battles: ${leader.totalBattles}\u001b[0m\n
          \u001b[0;40m\u001b[1;32m battles won: 🎖️ ${leader.battlesWon} \u001b[0m\n
          \u001b[0;40m\u001b[1;32m battles lost: 👎 ${leader.battlesLost} \u001b[0m
          \`\`\``
        )
        .join('\n\n'),
    );

  if (userRank > 5) {
    const userEntry = leaderboard.find((leader) => leader.userId === message.author.id);
    leaderboardEmbed.addFields(
      { name: 'Your Rank', value: `**#${userRank}**`, inline: true },
      {
        name: 'Total Battles',
        value: `${userEntry.totalBattles} (${userEntry.battlesWon} :green_circle: / ${userEntry.battlesLost} :red_circle:)`,
        inline: true,
      },
      {
        name: 'Total Cards',
        value: `${userEntry.cardCount} (${userEntry.cardsWon} :green_circle: / ${userEntry.cardsLost} :red_circle:)`,
        inline: true,
      },
    );
  }

  message.reply({ embeds: [leaderboardEmbed] });
};

module.exports = leaderboardCommand;