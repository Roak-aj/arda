const removeFromBattle = async (message, cardId, UserCard, CardForBattle) => {
    const userId = `<@${message.author.id}>`;
  
    try {
      const userCardData = await UserCard.findOne({ userId });
  
      if (!userCardData) {
        return message.reply('You need to create an account first by using the `!arda get` command.');
      }
  
      const cardForBattleData = await CardForBattle.findOne({ userId });
  
      if (!cardForBattleData) {
        return message.reply('You haven\'t put any cards up for battle yet.');
      }
  
      const cardIndex = cardForBattleData.cardsForBattle.findIndex((card) => card.cardId === cardId);
  
      if (cardIndex === -1) {
        return message.reply('This card is not currently put up for battle.');
      }
  
      cardForBattleData.cardsForBattle.splice(cardIndex, 1);
      await cardForBattleData.save();
  
      return message.reply(`Card ${cardId} has been removed from the battle list.`);
    } catch (error) {
      console.error(error);
      return message.reply('An error occurred while removing the card from the battle list.');
    }
  };
  
  module.exports = removeFromBattle