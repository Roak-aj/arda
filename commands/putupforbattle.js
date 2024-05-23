const { EmbedBuilder } = require('discord.js');

const putUpForBattle = async (message, cardId, yesOrNo, UserCard, CardForBattle) => {
  const userId = `<@${message.author.id}>`;

  try {
    const userCardData = await UserCard.findOne({ userId });

    if (!userCardData) {
      return message.reply('You need to create an account first by using the `!arda get` command.');
    }

    if (!userCardData.cardIds.includes(cardId)) {
      return message.reply('You don\'t have this card in your collection or you didn\'t specify a cardId.');
    }

    const isForFun = yesOrNo.toLowerCase() === 'fun';
    let cardForBattleData = await CardForBattle.findOne({ userId });

    if (!cardForBattleData) {
      cardForBattleData = new CardForBattle({ userId, cardsForBattle: [] });
    }

    const existingCard = cardForBattleData.cardsForBattle.find((card) => card.cardId === cardId);

    if (existingCard) {
      existingCard.forFun = isForFun;
    } else {
      cardForBattleData.cardsForBattle.push({ cardId, forFun: isForFun });
    }

    await cardForBattleData.save();

    const battleType = isForFun ? 'Fun Battle' : 'Serious Battle';
    const embed = new EmbedBuilder()
      .setTitle('Card Put Up for Battle')
      .setDescription(`**Card ID: \`${cardId}\`\nBattle Type: \`${battleType}\`**`);

    return message.reply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    return message.reply(`\`\`\`ansi\u001b[1;40;31m
      An error occurred while putting up the card for battle.\`\`\``);
  }
};

module.exports = putUpForBattle