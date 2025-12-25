import { Router } from "express";
import { loginUser, registerUser } from "../controllers/auth.controller.ts";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;