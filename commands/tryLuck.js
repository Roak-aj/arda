const Discord = require('discord.js');
const mongoose = require('mongoose');
const { updateCardCount, hasCardId } = require('./extraCardCommand.js');

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

// TriedLuck Schema
const triedLuckSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    lastTryTimestamp: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

const TriedLuck = mongoose.model('TriedLuck', triedLuckSchema);

const COOLDOWN_DURATION = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

const tryLuckCommand = async (message, UserCard, Card) => {
    try {
        const userId = `<@${message.author.id}>`;

        // Check if the user has already tried their luck and if 5 hours have passed
        const triedLuckEntry = await TriedLuck.findOne({ userId });

        if (triedLuckEntry && Date.now() - triedLuckEntry.lastTryTimestamp.getTime() < COOLDOWN_DURATION) {
            const remainingTime = COOLDOWN_DURATION - (Date.now() - triedLuckEntry.lastTryTimestamp.getTime());
            const formattedRemainingTime = formatTimeString(remainingTime);
            return message.reply(`You have already tried your luck. Please try again in ${formattedRemainingTime} hours.`);
        }

        // User can try their luck

        // Find or create the user's card collection
        let userCard = await UserCard.findOne({ userId });

        if (!userCard) {
            userCard = new UserCard({ userId, cardIds: [] });
            await userCard.save();
        }

        // Get all available cards from the database
        const availableCards = await Card.find({});

        // If there are no cards available, inform the user
        if (availableCards.length === 0) {
            return message.reply("There are no cards available in the database.");
        }

        

        // Select a random card based on rarity
        let randomCard;
        const randomValue = Math.random();
        if (randomValue <= 0.5) {
            const cardsOfRarity = availableCards.filter(card => card.rarity === 'common');
            if (cardsOfRarity.length > 0) {
                randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            }
        } else if (randomValue > 0.5 && randomValue <= 0.8) {
            const cardsOfRarity = availableCards.filter(card => card.rarity === 'uncommon');
            if (cardsOfRarity.length > 0) {
                randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            }
        } else if (randomValue >= 0.80 && randomValue <= 0.87) {
            const cardsOfRarity = availableCards.filter(card => card.rarity === 'rare');
            if (cardsOfRarity.length > 0) {
                randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            }
        } else if (randomValue >= 0.88 && randomValue < 0.89){
            const cardsOfRarity = availableCards.filter(card => card.rarity === 'legendary');
            if (cardsOfRarity.length > 0) {
                randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            }
        }
        
        // if (randomValue <= cumulativeProbability) {
        //     const cardsOfRarity = availableCards.filter(card => card.rarity === rarity);
        //     if (cardsOfRarity.length > 0) {
        //         randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
        //     }
        //     break;
        // }
        // If no card was selected, inform the user
        if (!randomCard) {
            const cardsOfRarity = availableCards.filter(card => card.rarity === 'common');
            if (cardsOfRarity.length > 0) {
                randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
            }
        }

        const rarityColor = applyRarityColor(randomCard.rarity);
        // Create an embed message with a simulated card switching effect
        const switchingEmbeds = [];
        const shuffledCards = availableCards.sort(() => Math.random() - 0.5); // Shuffle the cards

        for (let i = 0; i < 10; i++) { // Switch cards 10 times
            const randomCardIndex = Math.floor(Math.random() * shuffledCards.length);
            const cardToSwitch = shuffledCards[randomCardIndex];

            const switchingEmbed = new Discord.EmbedBuilder()
                .setTitle('Trying your luck...')
                .setDescription(`Card ID: \`${cardToSwitch.cardId}\`\nRarity: \`${cardToSwitch.rarity}\`\nXP: \`${cardToSwitch.xp}\``)
                .setImage(cardToSwitch.imageUrl)
                .setColor(0x0099FF)
                .setFooter({ text: 'Arda Card Game', iconURL: 'https://cdn.discordapp.com/app-icons/1238935048737263746/180ff1a5f72df398e54def24f563af5c.png?size=512' });

            switchingEmbeds.push(switchingEmbed);
        }

        const finalEmbed = new Discord.EmbedBuilder()
            .setTitle('Your New card!')
            .setDescription(`Card ID: \`${randomCard.cardId}\``)
            .addFields({name:'Rarity', value: `
            \`\`\`ansi
            ${rarityColor}${randomCard.rarity}\u001b[0m\`\`\``, inline: true},
            {name: 'XP', value: `\`\`\`ansi
            \u001b[1;36m${randomCard.xp}\`\`\``, inline: true})
            .setImage(randomCard.imageUrl)
            .setColor('#8B0000');

        // Send the switching embeds and the final embed
        const sentMessage = await message.reply({ embeds: switchingEmbeds });

        for (let i = 0; i < switchingEmbeds.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 200)); // Wait for 200ms before switching card
            await sentMessage.edit({ embeds: [switchingEmbeds[i]] });
        }

        await sentMessage.edit({ embeds: [finalEmbed] });

        const hasCard = userCard.cardIds.includes(randomCard.cardId);

        // Check if the user already has the random card
        if (hasCard) {
            await updateCardCount(userId, randomCard.cardId, 'add');
            console.log("updatedExtraCard...");
            message.reply(`Congratulations ${userId}!
            \`\`\`ansi
            You received the card: ${rarityColor}${randomCard.cardId}\u001b[0m and the card has been added to your extra cards collection\`\`\``);
        }
        if (!hasCard) {
            // Add the random card to the user's card collection
            userCard.cardIds.push(randomCard.cardId);
            await userCard.save();
            message.reply(`Congratulations ${userId}!
            \`\`\`ansi
            You received the card: ${rarityColor}${randomCard.cardId}\u001b[0m\`\`\``);
        }

        // // Update the TriedLuck collection with the user's new try timestamp
        // await TriedLuck.findOneAndUpdate(
        //     { userId },
        //     { lastTryTimestamp: new Date() },
        //     { upsert: true, new: true }
        // );
    } catch (err) {
        console.error('Error trying luck', err);
        message.reply('An error occurred while trying your luck.');
    }
};

// Helper function to format time string
function formatTimeString(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hoursString = hours.toString().padStart(2, '0');
    const minutesString = minutes.toString().padStart(2, '0');
    const secondsString = seconds.toString().padStart(2, '0');

    return `${hoursString}:${minutesString}:${secondsString}`;
}

module.exports = tryLuckCommand;