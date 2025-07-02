router.get("/users", async (req, res) => {
  try {
    const { verificationStatus } = req.query;
    const filter = verificationStatus ? { verificationStatus } : {};
    const users = await User.find(filter);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
