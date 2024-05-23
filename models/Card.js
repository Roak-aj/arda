const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  cardId: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
  rarity: { type: String, required: true },
  xp: { type: Number, default: 0 },
});

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;