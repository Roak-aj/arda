// card battle healthbar static generation embed
if (message.content === '!battle') {
    let player1Health = MAX_HEALTH;
    let player2Health = MAX_HEALTH;

    const battleEmbed = new Discord.EmbedBuilder()
      .setTitle('Card Battle')
      .setDescription(`${generateHealthBar(player1Health)} VS ${generateHealthBar(player2Health)}`);

    const battleMessage = await message.channel.send({ embeds: [battleEmbed] });

    const interval = setInterval(() => {
      const player1Damage = Math.floor(Math.random() * 3) + 1; // Random damage between 1 and 3
      const player2Damage = Math.floor(Math.random() * 3) + 1; // Random damage between 1 and 3

      player1Health = Math.max(0, player1Health - player2Damage);
      player2Health = Math.max(0, player2Health - player1Damage);

      const newDescription = `${generateHealthBar(player1Health)} VS ${generateHealthBar(player2Health)}`;
      battleEmbed.setDescription(newDescription);

      battleMessage.edit({ embeds: [battleEmbed] });

      if (player1Health === 0 || player2Health === 0) {
        clearInterval(interval);
        battleEmbed.setDescription(`${generateHealthBar(player1Health)} VS ${generateHealthBar(player2Health)}\n\nBattle ended!`);
        battleMessage.edit({ embeds: [battleEmbed] });
      }
    }, 1000); // Update every 1 second
  }

  function generateHealthBar(health) {
	return `${'🟩'.repeat(health)}${'⬜'.repeat(MAX_HEALTH - health)}`;
  }