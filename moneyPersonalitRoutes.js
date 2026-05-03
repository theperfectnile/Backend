const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  submitSurvey,
  getResult
} = require("../controllers/moneyPersonalityController");

router.post("/submit", auth, submitSurvey);
router.get("/result", auth, getResult);

module.exports = router;