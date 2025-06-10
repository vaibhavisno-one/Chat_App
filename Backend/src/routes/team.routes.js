import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createTeam, joinTeam, getTeamMembers } from "../controllers/team.controller.js";

const router = express.Router();

router.post("/", protectRoute, createTeam); // POST /teams (changed from /teams to / in this router)
router.post("/join", protectRoute, joinTeam);
router.get("/:teamId/members", protectRoute, getTeamMembers);

export default router;
