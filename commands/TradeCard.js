const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');

const UserExtraCard = require('../models/ExtraCard.js');

const { updateCardCount, hasCardId } = require('./extraCardCommand.js');

// Helper function to check if a user has a card in their UserExtraCard collection
async function userHasExtraCard(userId, cardId) {
  const userExtraCard = await UserExtraCard.findOne({ userId });

  if (!userExtraCard) return false;

  const cardIdCount = userExtraCard.cardIdsAndCounts.find(item => item.cardId === cardId);

  return cardIdCount ? cardIdCount.count > 0 : false;
}

// Main function to handle the !arda tryluck command
async function handleTryTradeCommand(message, cardId, tradeWithUserId, cardIdExpectCard) {
  const userId = `<@${message.author.id}>`;

  console.log(userId);

  // Check if the user has the card they want to trade
  const userHasCard = await userHasExtraCard(userId, cardId);

  if (!userHasCard) {
    return message.reply(`You don't have an extra card with ID ${cardId} to trade.`);
  }

  // Check if the other user has the card the initial user wants
  const otherUserHasCard = await userHasExtraCard(tradeWithUserId, cardIdExpectCard);

  if (!otherUserHasCard) {
    return message.reply(`${tradeWithUserId} doesn't have an extra card with ID ${cardIdExpectCard} to trade.`);
  }

  // Create and send the trade confirmation embed with buttons
  const tradeEmbed = new EmbedBuilder()
    .setTitle('Trade Confirmation')
    .setDescription(`${message.author} wants to trade their card with ID ${cardId} for your card with ID ${cardIdExpectCard}. Do you accept?`)
    .setColor('Random');

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('accept')
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('decline')
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger)
    );

  try {
    const sentEmbed = await message.reply({ embeds: [tradeEmbed], components: [row] });

    // Wait for the other user's response (button click)
    const filter = (i) => i.customId === 'accept' || i.customId === 'decline';

    const collector = sentEmbed.createMessageComponentCollector({ filter, time: 30000 });

    collector.on('collect', async (i) => {
      try {
        // Check if the initial user is trying to interact with the embed
        if (i.user.id === message.author.id) {
          await i.reply("You cannot interact with this embed as it's for the other user to accept or decline your trade offer.");
          return;
        }

        if (i.customId === 'accept') {
          // Remove the card from the other user's UserExtraCard collection
          await updateCardCount(tradeWithUserId, cardIdExpectCard, 'remove');

          // Add or increment the card in the initial user's UserExtraCard collection
          await updateCardCount(userId, cardIdExpectCard, 'add');

          // Remove the card from the initial user's UserExtraCard collection
          await updateCardCount(userId, cardId, 'remove');

          // Add or increment the card in the other user's UserExtraCard collection
          await updateCardCount(tradeWithUserId, cardId, 'add');

          await sentEmbed.edit({ embeds: [tradeEmbed.setDescription('Trade successful!')], components: [] });
        } else {
          await sentEmbed.edit({ embeds: [tradeEmbed.setDescription('Trade declined.')], components: [] });
        }
      } catch (error) {
        console.log(error);
      }
    });

    collector.on('end', async (collected) => {
      if (!collected.size) {
        try {
          await sentEmbed.edit({ embeds: [tradeEmbed.setDescription('Trade request timed out.')], components: [] });
        } catch (error) {
          console.log(error);
        }
      }
    });
  } catch (error) {
    console.error('Error occurred:', error);
    // You can add additional error handling logic here, if needed
  }
}

module.exports = {
  handleTryTradeCommand
};