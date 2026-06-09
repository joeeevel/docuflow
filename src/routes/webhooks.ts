import { Router } from "express";
import { env } from "../config/env.js";

const router = Router();

router.post("/stripe", async (req, res, next) => {
  try {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).json({ error: "Missing stripe signature" });
      return;
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

export default router;
