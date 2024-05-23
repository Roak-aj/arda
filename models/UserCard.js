const mongoose = require('mongoose');

const userCardSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  cardIds: [{ type: String}],
});

const UserCard = mongoose.model('UserCard', userCardSchema);

module.exports = UserCard;