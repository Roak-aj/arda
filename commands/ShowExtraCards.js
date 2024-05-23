// extraCardCommand.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const UserExtraCard = require('../models/ExtraCard.js');
const Card = require('../models/Card.js');

const { applyRarityColor } = require('../models/cardUtils.js');

async function extraCardCommand(message, userId) {
  try {
    const user = userId ? userId : `<@${message.author.id}>`;
    const userExtraCard = await UserExtraCard.findOne({ userId: user });

    if (!userExtraCard || userExtraCard.cardIdsAndCounts.length === 0) {
      return message.reply(`${user} doesn't have any extra cards yet.`);
    }

    const cardIds = userExtraCard.cardIdsAndCounts.map((item) => item.cardId);
    const cards = await Card.find({ cardId: { $in: cardIds } });

    let currentCardIndex = 0;

    const { embed, row } = await showUserExtraCards(message, userExtraCard, cards, currentCardIndex);

    const sentMessage = await message.reply({ embeds: [embed], components: [row] });

    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
      try {
        currentCardIndex = handleButtonInteraction(interaction, currentCardIndex, userExtraCard.cardIdsAndCounts.length);
        const { embed, row } = await showUserExtraCards(interaction.message, userExtraCard, cards, currentCardIndex);
        await interaction.deferUpdate();
        await interaction.editReply({ embeds: [embed], components: [row] });
      } catch (error) {
        console.error('Error updating card interaction', error);
      }
    });

    collector.on('end', () => sentMessage.edit({ components: [] }));
  } catch (err) {
    console.error('Error showing user extra cards', err);
    message.reply('An error occurred while fetching the extra cards.');
  }
}

function handleButtonInteraction(interaction, currentCardIndex, totalCards) {
  if (interaction.customId === 'previous') {
    return Math.max(0, currentCardIndex - 1);
  } else if (interaction.customId === 'next') {
    return Math.min(totalCards - 1, currentCardIndex + 1);
  }
  return currentCardIndex;
}

async function showUserExtraCards(message, userExtraCard, cards, currentCardIndex) {
  const currentCardId = userExtraCard.cardIdsAndCounts[currentCardIndex].cardId;
  const card = cards.find((c) => c.cardId === currentCardId);
  const count = userExtraCard.cardIdsAndCounts.find((item) => item.cardId === currentCardId).count;

  const embed = new EmbedBuilder()
    .setColor('DarkRed')
    .setTitle(`Extra Cards for ${message.author.username}`)
    .setDescription(`\`\`\`ansi
    Card \u001b[1;36m${currentCardIndex + 1} of ${userExtraCard.cardIdsAndCounts.length}\`\`\``)
    .addFields(
      { name: 'Card ID', value: `**${card.cardId}**`, inline: true },
      { name: 'Rarity', value: `__**${card.rarity}**__`, inline: true },
      { name: 'Count', value: `__**${count}**__`, inline: true }
    )
    .setImage(card.imageUrl);

  const rarityColor = applyRarityColor(card.rarity);

  if (embed.fields && embed.fields.length > 0) {
    embed.fields.update('Rarity', updateRarityField(rarityColor));
    embed.fields.update('Count', updateCountField);
  }

  const previousButton = createButton('Previous', currentCardIndex === 0, 'previous');
  const nextButton = createButton('Next', currentCardIndex === userExtraCard.cardIdsAndCounts.length - 1, 'next');
  const row = new ActionRowBuilder().addComponents(previousButton, nextButton);

  return { embed, row };
}

function createButton(label, isDisabled, customId) {
  return new ButtonBuilder()
    .setStyle(ButtonStyle.Primary)
    .setLabel(label)
    .setDisabled(isDisabled)
    .setCustomId(customId);
}

function updateRarityField(rarityColor) {
  return (field) => {
    const coloredValue = field.value.replace(/(\*\*)(.*?)(\*\*)/gs, `$1${rarityColor}$2${'\\u001b[0m'}$3`);
    return { ...field, value: `\`\`\`css\n${coloredValue}\`\`\``, inline: true };
  };
}

function updateCountField(field) {
  return {
    ...field,
    value: `\`\`\`fix\n${field.value}\`\`\``,
    inline: true,
  };
}

module.exports = extraCardCommand;