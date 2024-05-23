const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function applyRarityColor(rarity) {
  switch (rarity.toLowerCase()) {
    case 'legendary':
      return '\u001b[1;40;33m'; // Red
    case 'epic':
      return '#9370db'; // Purple
    case 'rare':
      return '\u001b[1;40;34m'; // Blue
    case 'uncommon':
      return '\u001b[1;40;32m'; // Green
    default:
      return '\u001b[1;40;31m'; // Gray
  }
}

function showUserCards(message, userCard, cards, currentCardIndex) {
  const currentCardId = userCard.cardIds[currentCardIndex];
  const card = cards.find((c) => c.cardId === currentCardId);
  const rarityColor = applyRarityColor(card.rarity);
  const embed = new EmbedBuilder()
    .setColor('DarkRed')
    .setTitle(`${message.author.username}'s Card Collection`)
    .setDescription(`\`\`\`ansi
    Card \u001b[1;36m${currentCardIndex + 1} of ${userCard.cardIds.length}\`\`\``)
    .addFields(
      { name: 'Card ID', value:`\`\`\`ansi
      ${rarityColor}${card.cardId}\u001b[0m
      \`\`\``, inline: false },
      { name: 'Rarity', value: `__**${card.rarity}**__`, inline: true },
      { name: 'XP', value: `__**${card.xp}**__`, inline: true }
    )
    .setImage(card.imageUrl);

  

  // // Check if embed.fields is defined and non-empty
  // if (embed.fields && embed.fields.length > 0) {
  //   // Update rarity field with color
  //   embed.fields.update('Rarity', (field) => {
  //     const coloredValue = field.value.replace(/(\*\*)(.*?)(\*\*)/gs, `$1${rarityColor}$2${'\\u001b[0m'}$3`);
  //     return { ...field, value: `\`\`\`css\n${coloredValue}\`\`\``, inline: true };
  //   });

  //   // Update XP field with code block
  //   embed.fields.update('XP', (field) => ({
  //     ...field,
  //     value: `\`\`\`fix\n${field.value}\`\`\``,
  //     inline: true,
  //   }));
  // }

  const previousButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Primary)
    .setLabel('Previous')
    .setDisabled(currentCardIndex === 0)
    .setCustomId('previous');

  const nextButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Primary)
    .setLabel('Next')
    .setDisabled(currentCardIndex === userCard.cardIds.length - 1)
    .setCustomId('next');

  const row = new ActionRowBuilder().addComponents(previousButton, nextButton);

  return { embed, row };
}

module.exports = {
  showUserCards,
  applyRarityColor,
};