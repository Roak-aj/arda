// Define the probability of getting tails
const probabilityOfTails = 0.10;

// Function to simulate a coin flip
function flipCoin() {
  // Generate a random number between 0 and 1
  const randomNumber = Math.random();

  // If the random number is greater than the probability of getting tails,
  // it means we got heads
  if (randomNumber > probabilityOfTails) {
    return "Heads";
  } else {
    // Otherwise, we got tails
    return "Tails";
  }
}

// Simulate the coin flip
const result = flipCoin();
console.log(`The coin flip result is: ${result}`);