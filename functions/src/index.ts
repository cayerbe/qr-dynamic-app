import { onRequest } from "firebase-functions/v2/https";
import express, { Request, Response } from "express";

// ✅ Initialize Express
const app = express();
app.use(express.json());

// ✅ Test Route (Should return: "🔥 Firebase API is working!")
app.get("/", (req: Request, res: Response) => {
  res.status(200).send("🔥 Firebase API is working!");
});

// ✅ Sample Register Endpoint
app.post("/register", (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  return res.status(200).json({ message: "User registered successfully!" });
});

// ✅ Export Express App as Firebase Function
export const api = onRequest(app);
