const UserExtraCard = require('../models/ExtraCard.js');

const updateCardCount = async (userId, cardId, operation) => {
  try {
    let user = await UserExtraCard.findOne({ userId });

    if (!user) {
      user = new UserExtraCard({ userId, cardIdsAndCounts: [] });
    }

    const cardIdAndCount = user.cardIdsAndCounts.find(c => c.cardId === cardId);

    if (operation === 'add') {
      if (cardIdAndCount) {
        cardIdAndCount.count++;
      } else {
        user.cardIdsAndCounts.push({ cardId, count: 1 });
      }
    } else if (operation === 'remove') {
      if (cardIdAndCount) {
        cardIdAndCount.count--;
        if (cardIdAndCount.count === 0) {
          user.cardIdsAndCounts = user.cardIdsAndCounts.filter(c => c.cardId !== cardId);
        }
      }
    } else {
      throw new Error('Invalid operation');
    }

    const updatedUser = await user.save();
    return updatedUser;
  } catch (error) {
    throw new Error(`Failed to update card count: ${error.message}`);
  }
};

const hasCardId = async (userId, cardId) => {
  try {
    const user = await UserExtraCard.findOne({ userId });

    if (!user) {
      return false;
    }

    const cardIdAndCount = user.cardIdsAndCounts.find(c => c.cardId === cardId && c.count > 0);
    return !!cardIdAndCount;
  } catch (error) {
    throw new Error(`Failed to check for card: ${error.message}`);
  }
};

module.exports = {
  updateCardCount,
  hasCardId
};