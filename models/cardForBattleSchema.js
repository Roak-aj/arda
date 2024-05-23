const mongoose = require('mongoose');

const cardForBattleSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    cardsForBattle: [
      {
        cardId: { type: String, required: true },
        forFun: { type: Boolean, required: true },
      },
    ],
  });
  
const CardForBattle = mongoose.model('CardForBattle', cardForBattleSchema);

module.exports = CardForBattle;