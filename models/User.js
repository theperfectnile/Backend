const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // ⭐ Subscription fields
  subscription: { type: String, default: "free" }, // free | pro
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  subscriptionStatus: { type: String, default: "inactive" }, // active | past_due | canceled
  renewalDate: { type: Date, default: null }
},
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
