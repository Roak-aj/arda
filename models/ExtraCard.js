const mongoose = require('mongoose');

const cardIdsAndCountsSchema = new mongoose.Schema({
  cardId: { type: String, required: true },
  count: { type: Number, default: 0 }
});

const userExtraCardSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  cardIdsAndCounts: [cardIdsAndCountsSchema]
}, {
  timestamps: true
});

const UserExtraCard = mongoose.model('UserExtraCard', userExtraCardSchema);

module.exports = UserExtraCard;