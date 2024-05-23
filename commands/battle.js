const { EmbedBuilder, AttachmentBuilder} = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const UserCard = require('../models/UserCard');
const CardForBattle = require('../models/cardForBattleSchema');
const Card = require('../models/Card');
const { updateLeaderboardOnWin, updateLeaderboardOnLoss } = require('../models/leaderboardSchema.js');
const { updateCardCount, hasCardId } = require('./extraCardCommand.js');

const MAX_HEALTH = 10;

const calculatePowerPoints = (card) => {
  const { xp, rarity } = card;
  const rarityPoints = {
    'common': 5,
    'uncommon': 10,
    'rare': 25,
    'epic': 30,
    'legendary': 35,
  };

  const powerPoints = Math.floor(xp / 200) * 10 + rarityPoints[rarity];
  return powerPoints;
};

const generateHealthBar = (health) => {
  return `${'🟩'.repeat(health)}${'⬜'.repeat(MAX_HEALTH - health)}`;
};

const battle = async (message, user, cardId, seriousOrFun) => {
  try {
    const initiatorUserId = `<@${message.author.id}>`;
    const initiatorUserCard = await UserCard.findOne({ userId: initiatorUserId });

    if (!initiatorUserCard || initiatorUserCard.cardIds.length === 0) {
      return message.reply("You need to create an account and get some cards first by using the `!arda get` and `!arda tryluck` commands.");
    }

    const opponentUserId = user;
    const opponentUserCard = await UserCard.findOne({ userId: opponentUserId });
    if (!opponentUserCard || opponentUserCard.cardIds.length === 0) {
      return message.reply(`${user} doesn't have any cards in their collection.`);
    }

    const opponentCardForBattleData = await CardForBattle.findOne({ userId: opponentUserId });

    if (!opponentCardForBattleData || opponentCardForBattleData.cardsForBattle.length === 0) {
      return message.reply(`${user} doesn't have any cards put up for battle.`);
    }
    const isSeriousBattle = seriousOrFun.toLowerCase() === 'serious';

    const opponentCard = opponentCardForBattleData.cardsForBattle.find(
      (card) => card.forFun !== isSeriousBattle
    );

    if (!opponentCard) {
      return message.reply(`${user} doesn't have any cards put up for a ${seriousOrFun} battle.`);
    }

    const initiatorCard = await Card.findOne({ cardId });

    const opponentCardData = await Card.findOne({ cardId: opponentCard.cardId });

    const initiatorPowerPoints = calculatePowerPoints(initiatorCard);
    const opponentPowerPoints = calculatePowerPoints(opponentCardData);
    
    const totalPowerPoints = initiatorPowerPoints + opponentPowerPoints;
    
    const opponentProbability = (opponentPowerPoints / totalPowerPoints);

    const winner = Math.random() < opponentProbability ? 'opponent' : 'initiator';
    const combinedImage = await createCombinedImage(initiatorCard.imageUrl, opponentCardData.imageUrl);

    let player1Health = MAX_HEALTH;
    let player2Health = MAX_HEALTH;

    const battleEmbed = new EmbedBuilder()
      .setTitle('Card Battle')
      .setDescription(`\`\`\`YOU: ${generateHealthBar(player1Health <= 0 ? 0 : player1Health)}\`\`\`\n\`\`\`OPP: ${generateHealthBar(player2Health <= 0 ? 0 : player2Health)}\`\`\``)
      .setImage(`attachment://battle.png`);

    const battleMessage = await message.channel.send({ embeds: [battleEmbed], files: [combinedImage] });
    console.log(winner);

    const interval = setInterval(() => {

      if (winner === 'initiator') {
          // Generate a random value between 0 and 1
          const randomValue = Math.random();
          const probability = 0.60;
          // Check the probability range and return the corresponding value
          if (randomValue < probability) {
            // Return a value from 1 to 5 based on the probability
            let depletion = Math.floor(randomValue / probability * 2) + 1;
            player2Health -= depletion;
          } else {
            // Return a value from 1 to 5 based on the remaining probability
            let depletion = Math.floor((randomValue - probability) / (1 - probability) * 2) + 1;
            let winningValue = player1Health - depletion;

            if (winningValue <= 0){
              player1Health = player1Health;
            }else{
              player1Health -= depletion;
            }
          }

      } else {
        // Generate a random value between 0 and 1
        const randomValue = Math.random();
        const probability = 0.60;
        // Check the probability range and return the corresponding value
        if (randomValue < probability) {
          // Return a value from 1 to 5 based on the probability
          let depletion = Math.floor(randomValue / probability * 2) + 1;
          player1Health -= depletion;
        } else {
          // Return a value from 1 to 5 based on the remaining probability
          let depletion = Math.floor((randomValue - probability) / (1 - probability) * 2) + 1;
          let winningValue = player1Health - depletion;

          if (winningValue <= 0){
            player2Health = player2Health;
          }else{
            player2Health -= depletion;
          }
        }
      }

      battleEmbed.setDescription(`\`\`\`YOU: ${generateHealthBar(player1Health <= 0 ? 0 : player1Health)}\`\`\`\n\`\`\`OPP: ${generateHealthBar(player2Health <= 0 ? 0 : player2Health)}\`\`\``);

      battleMessage.edit({ embeds: [battleEmbed] });

      if (player1Health <= 0 || player2Health <= 0) {
        clearInterval(interval);
        
        battleEmbed.setDescription(`\`\`\`YOU: ${generateHealthBar(player1Health <= 0 ? 0 : player1Health)}\`\`\`\n\`\`\`OPP: ${generateHealthBar(player2Health <= 0 ? 0 : player2Health)}\`\`\``);

        battleMessage.edit({ embeds: [battleEmbed] });
        

        if (winner === 'initiator') {
          if (isSeriousBattle) {
            (async () => {
              //check if opponent has an extra card.
              let hasExtraCard = hasCardId(opponentUserId, opponentCard.cardId);
              if (hasExtraCard) {
                updateCardCount(opponentUserId, opponentCard.cardId, 'remove');
              }else{
                await UserCard.updateOne({ userId: opponentUserId }, { $pull: { cardIds: opponentCard.cardId } });
              }
              await CardForBattle.updateOne({ userId: opponentUserId }, { $pull: { cardsForBattle: { cardId: opponentCard.cardId } } });
              UserCard.findOne({ initiatorUserId, cardIds: opponentCard.cardId})
                .then((doc) => {
                  if (doc) {
                    updateCardCount(initiatorUserId, opponentCard.cardId, 'add');
                  }
                  if (!doc) {
                    (async () => {await UserCard.updateOne({ userId: initiatorUserId }, { $push: { cardIds: opponentCard.cardId } });})()
                  }
                })
                .catch((err) => {
                  console.error('Error occurred:', err);
                });
              
              await updateLeaderboardOnWin(initiatorUserId);
              await updateLeaderboardOnLoss(opponentUserId);

              message.reply(`You won the battle, ${message.author}! The card ${cardId} has been credited to your collection and removed from ${user}'s collection.`);
              
            })();
          } else {
            (async () => {
              
              message.reply(`Congratulations ${message.author}! You won the battle and ${user} lost this battle.`);
            })();
          }  
        } else {
          if (isSeriousBattle) {
            (async () => {
              let hasExtraCard = hasCardId(initiatorUserId, initiatorCard.cardId);
              if (hasExtraCard) {
                updateCardCount(initiatorUserId, initiatorCard.cardId, 'remove');
              }else{
                await UserCard.updateOne({ userId: initiatorUserId }, { $pull: { cardIds: initiatorCard.cardId } });
              }
              await CardForBattle.updateOne({ userId: initiatorUserId }, { $pull: { cardsForBattle: { cardId: initiatorCard.cardId } } });
              

              UserCard.findOne({ opponentUserId, cardIds: initiatorCard.cardId})
                .then((doc) => {
                  if (doc) {
                    updateCardCount(opponentUserId, initiatorCard.cardId, 'add');
                  }
                  if (!doc) {
                    (async () => {await UserCard.updateOne({ userId:  opponentUserId}, { $push: { cardIds: initiatorCard.cardId } });})()
                  }
                })
                .catch((err) => {
                  console.error('Error occurred:', err);
                });
              
              await updateLeaderboardOnWin(opponentUserId);
              await updateLeaderboardOnLoss(initiatorUserId);

              message.reply(`You lost the battle, ${message.author}! The card ${cardId} has been removed from your collection and added to ${user} collection.`);
              
            })();
          } else {
            (async () => {
              message.reply(`Congratulations ${user} ! You won the battle and ${initiatorUserId} lost this battle.`);
            })();
          }
        }
      }
    }, 1000); // Update every 1 second
  } catch (error) {
    console.error('Error during battle:', error);
    message.reply('An error occurred during the battle.');
  }
};

async function createCombinedImage(image1Url, image2Url) {
  try {
    const canvas = createCanvas(1400, 900);
    const ctx = canvas.getContext('2d');

    const image1 = await loadImage(image1Url);
    const image2 = await loadImage(image2Url);

    ctx.drawImage(image1, 0, 0, 600, 900);
    ctx.drawImage(image2, 700, 0, 600, 900);

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'battle.png' });
    return attachment;
  } catch (error) {
    console.error('Error creating combined image:', error);
    throw error;
  }
}




module.exports = battle;