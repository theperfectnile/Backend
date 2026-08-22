// premium.js
const PREMIUM_KEY = "vaultwise_premium";

// Check if user is premium
function isPremiumUser() {
  return localStorage.getItem(PREMIUM_KEY) === "true";
}

// Enable premium
function enablePremium() {
  localStorage.setItem(PREMIUM_KEY, "true");
}

// Disable premium
function disablePremium() {
  localStorage.setItem(PREMIUM_KEY, "false");
}