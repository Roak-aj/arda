// leaderboard.js
const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  battlesWon: { type: Number, default: 0 },
  battlesLost: { type: Number, default: 0 },
  cardsWon: { type: Number, default: 0 },
  cardsLost: { type: Number, default: 0 },
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

// Function to update leaderboard when a user wins a battle
const updateLeaderboardOnWin = async (userId) => {
  const leaderboardEntry = await Leaderboard.findOneAndUpdate(
    { userId },
    { $inc: { battlesWon: 1, cardsWon: 1 } },
    { new: true, upsert: true }
  );
  return leaderboardEntry;
};

// Function to update leaderboard when a user loses a battle
const updateLeaderboardOnLoss = async (userId) => {
  const leaderboardEntry = await Leaderboard.findOneAndUpdate(
    { userId },
    { $inc: { battlesLost: 1, cardsLost: 1 } },
    { new: true, upsert: true }
  );
  return leaderboardEntry;
};

module.exports = {
  Leaderboard,
  updateLeaderboardOnWin,
  updateLeaderboardOnLoss,
};