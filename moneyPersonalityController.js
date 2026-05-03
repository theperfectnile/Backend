const MoneyPersonality = require("../models/MoneyPersonality");

exports.submitSurvey = async (req, res) => {
  try {
    const { answers } = req.body;

    const score = answers.reduce((sum, val) => sum + Number(val), 0);

    let personalityType = "The Planner";

    if (score <= 10) personalityType = "The Saver";
    else if (score <= 20) personalityType = "The Spender";
    else if (score <= 30) personalityType = "The Investor";
    else personalityType = "The Avoider";

    const result = await MoneyPersonality.create({
      userId: req.user.id,
      answers,
      personalityType,
      score
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error submitting survey" });
  }
};

exports.getResult = async (req, res) => {
  try {
    const result = await MoneyPersonality.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 });

    if (!result) {
      return res.json({ message: "No survey results yet" });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error loading results" });
  }
};