const logger = require("../../logger");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// CREATE ACCOUNT
exports.createAccount = async (req, res) => {
  try {
    const { name } = req.body;
    const companyId = req.user.companyId;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const account = await prisma.account.create({
      data: {
        name,
        companyId
      }
    });

    res.json({ message: "Account created", account });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to create account" });
  }
};

// GET ALL ACCOUNTS FOR COMPANY
exports.getAccounts = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const accounts = await prisma.account.findMany({
      where: { companyId }
    });

    res.json(accounts);

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Failed to retrieve accounts" });
  }
};
