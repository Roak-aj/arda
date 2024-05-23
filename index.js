const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, IntentsBitField, EmbedBuilder, REST, Routes} = require('discord.js');
require('dotenv').config();
const leaderboardCommand = require('./commands/leaderboardCommand.js');
const { handleTryTradeCommand } = require('./commands/TradeCard.js');
const extraCardCommand = require('./commands/ShowExtraCards.js');
const { isAdmin } = require('discord.js');
const { showUserCards } = require('./models/cardUtils.js');
const tryLuckCommand = require('./commands/tryLuck.js');
const Card = require('./models/Card.js')
const UserCard = require('./models/UserCard');
const CardForBattle = require('./models/cardForBattleSchema.js');
const putUpForBattle = require('./commands/putupforbattle.js');
const removeFromBattle = require('./commands/removefrombattle.js');
const battle = require('./commands/battle.js');
require('./database');



const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
		IntentsBitField.Flags.GuildIntegrations,
	]
})

client.on('ready', (c) => {
	console.log(`${c.user.tag} is up and running!`);
})


//createmsg commands
client.on('messageCreate', async (message) => {
	// create a card account for user if account doesn't exists and gives card
	if (message.content === '!arda get') {
		try {
		  const userId = `<@${message.author.id}>`;
		  const newUserCard = new UserCard({ userId, cardIds: [] });
		  await newUserCard.save();
		  message.reply('Your account has been created!');
		} catch (err) {
		  if (err.code === 11000) {
			message.reply('You already have an account!');
		  } else {
			console.error('Failed to create user account', err);
			message.reply('An error occurred while creating your account.');
		  }
		}
	  }
	
	// insert card details admin
	if (message.content.startsWith('!arda insert')) {
		// Check if the user is an admin
		const member = message.member;
		const isAdmin = member.permissions.has('ADMINISTRATOR');
	
		if (isAdmin) {
		  try {
			const [, , imageUrl, rarity, xp, cardId] = message.content.split(' ');
	
			const newCard = new Card({
			  cardId,
			  imageUrl,
			  rarity,
			  xp: Number(xp),
			});
	
			await newCard.save();
			message.reply(`New card created with ID: ${cardId}`);
		  } catch (err) {
			console.error('Failed to create new card', err);
			message.reply('An error occurred while creating the card.');
		  }
		} else {
		  message.reply('You must have the "Administrator" permission to use this command.');
		}
	  }
	
	// Show cards
	if (message.content === '!arda cards') {
		try {
		  const userId = `<@${message.author.id}>`;
		  const userCard = await UserCard.findOne({ userId });
	
		  if (!userCard || userCard.cardIds.length === 0) {
			return message.reply("You don't have any cards in your collection yet.");
		  }
	
		  const cards = await Card.find({ cardId: { $in: userCard.cardIds } });
		  let currentCardIndex = 0; // Initialize currentCardIndex here
		  const { embed, row } = showUserCards(message, userCard, cards, currentCardIndex);
	
		  const sentMessage = await message.reply({ embeds: [embed], components: [row] });
	
		  const filter = (interaction) => interaction.user.id === message.author.id;
		  const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });
	
		  collector.on('collect', async (interaction) => {
			try {
			  if (interaction.customId === 'previous') {
				currentCardIndex = Math.max(0, currentCardIndex - 1);
			  } else if (interaction.customId === 'next') {
				currentCardIndex = Math.min(userCard.cardIds.length - 1, currentCardIndex + 1);
			  }
	
			  const currentCardId = userCard.cardIds[currentCardIndex];
			  const card = cards.find((c) => c.cardId === currentCardId);
			  const { embed, row } = showUserCards(interaction.message, userCard, cards, currentCardIndex);
	
			  await interaction.deferUpdate();
			  await interaction.editReply({ embeds: [embed], components: [row] });
			} catch (error) {
			  console.error('Error updating card interaction', error);
			}
		  });
	
		  collector.on('end', () => {
			sentMessage.edit({ components: [] });
		  });
		} catch (err) {
		  console.error('Error showing user cards', err);
		  message.reply('An error occurred while fetching your card collection. Try! using !arda get command to create a collection first.');
		}
	}

	// Show ExtraCard
	if (message.content.startsWith('!arda showextra')) {

		const [, , userId] = message.content.split(' ');
		console.log(userId);

		extraCardCommand(message, userId);
	}

	// give cards to users
	if (message.content.startsWith('!arda give')) {
		const member = message.member;
		const isAdmin = member.permissions.has('ADMINISTRATOR');
	
		if (isAdmin) {
		const [, , cardId, userId] = message.content.split(' ');
	
		if (!cardId || !userId) {
			return message.reply('Please provide a card ID and a user ID.');
		}
	
		try {
			const card = await Card.findOne({ cardId });
			
			if (!card) {
			return message.reply('Card not found or you incorrectly used the command try `!arda give <cardId> <user>`');
			}
	
			const user = await UserCard.findOne({ userId });
	
			if (!user) {
				const newUser = new UserCard({ userId, cardIds: [cardId] });
				await newUser.save();
				message.reply(`Card ${cardId} has been added to the new user's collection.`);
			} else {
				
				// Check if the user already has the card
				
				if (user.cardIds.includes(cardId)) {
					return message.reply(`The user ${userId} already has the card ${cardId} in their collection.`);
				}
	
				// Add the card to the user's existing card collection
				await UserCard.findOneAndUpdate(
					{ userId },
					{ $push: { cardIds: cardId } }
				);
				message.reply(`Card ${cardId} has been added to the user's collection.`);
			}
		} catch (err) {
			console.error('Error giving card', err);
			message.reply('An error occurred while giving the card.');
		}
		} else {
		message.reply('You must have the "Administrator" permission to use this command.');
		}
	}
	
	// try trade command
	if (message.content.startsWith('!arda trade')) {
		const [, ,cardId, tradeWithUserId, cardIdExpectCard]= message.content.split(' ');
		console.log(cardId, tradeWithUserId, cardIdExpectCard);
		await handleTryTradeCommand(message, cardId, tradeWithUserId, cardIdExpectCard);
	}
	// Try Luck command
	if (message.content === '!arda tryluck') {
		await tryLuckCommand(message, UserCard, Card);
	}

	// putupforbattle and removefrombattle commands
	if (message.content.startsWith('!arda putupforbattle')) {
		const [, , cardId, yesOrNo] = message.content.split(' ');
		await putUpForBattle(message, cardId, yesOrNo, UserCard, CardForBattle);
	} else if (message.content.startsWith('!arda removefrombattle')) {
		const [, , cardId] = message.content.split(' ');
		await removeFromBattle(message, cardId, UserCard, CardForBattle);
	}

	// card battle
	if (message.content.startsWith('!arda battle')) {
		const [, , user, cardId, seriousOrFun] = message.content.split(' ');
		await battle(message, user, cardId, seriousOrFun);
	  }
	
	// leaderboard
	if (message.content.startsWith('!arda leaderboard')) {
		await leaderboardCommand(message);
	  }



	
});


client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  let currentCardIndex = 0; // Initialize currentCardIndex here

  const userId = interaction.user.id;
  const userCard = await UserCard.findOne({ userId });

  if (!userCard || userCard.cardIds.length === 0) {
    try {
		console.log('someone else interacted.')
    //   await interaction.deferReply();
    } catch (error) {
      console.error('Error replying to interaction', error);
    }
    return;
  }

  const cards = await Card.find({ cardId: { $in: userCard.cardIds } });

  try {
    if (interaction.customId === 'previous') {
      currentCardIndex = Math.max(0, currentCardIndex - 1);
    } else if (interaction.customId === 'next') {
      currentCardIndex = Math.min(userCard.cardIds.length - 1, currentCardIndex + 1);
    }

    const currentCardId = userCard.cardIds[currentCardIndex];
    const card = cards.find((c) => c.cardId === currentCardId);
    const { embed, row } = showUserCards(interaction.message, userCard, cards, currentCardIndex);

    await interaction.deferUpdate();
    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (error) {
    console.error('Error updating card interaction', error);
  }
});

client.login(process.env.TOKEN);