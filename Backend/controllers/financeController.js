const FinanceEntry = require("./models/FinanceEntry");

exports.addEntry = async (req, res) => {
  try {
    const userId = req.user.id;

    const entry = await FinanceEntry.create({
      userId,
      ...req.body
    });

    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: "Error saving entry" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const userId = req.user.id;

    const entries = await FinanceEntry.find({ userId }).sort({ year: 1 });

    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: "Error loading history" });
  }
};

exports.summary = async (req, res) => {
  try {
    const userId = req.user.id;

    const latest = await FinanceEntry.findOne({ userId }).sort({ year: -1 });

    if (!latest) {
      return res.json({
        monthlyIncome: 0,
        monthlyExpenses: 0,
        netSavings: 0,
        portfolioValue: 0
      });
    }

    res.json({
      monthlyIncome: latest.income,
      monthlyExpenses: latest.expenses,
      netSavings: latest.income - latest.expenses,
      portfolioValue: latest.portfolio
    });
  } catch (err) {
    res.status(500).json({ message: "Error loading summary" });
  }
};

exports.analyze = async (req, res) => {
  try {
    const userId = req.user.id;

    const entries = await FinanceEntry.find({ userId });

    if (entries.length < 2) {
      return res.json({ message: "Not enough data for insights" });
    }

    const last = entries[entries.length - 1];
    const prev = entries[entries.length - 2];

    const diff = last.expenses - prev.expenses;
    const percent = ((diff / prev.expenses) * 100).toFixed(1);

    let message = "Your spending is stable.";

    if (diff > 0) message = `Your spending increased by ${percent}%`;
    if (diff < 0) message = `Your spending decreased by ${Math.abs(percent)}%`;

    res.json({ message });
  } catch (err) {
    res.status(500).json({ message: "Error analyzing insights" });
  }
};
