// Backend/src/controllers/team.controller.js

import Team from "../models/team.model.js";
import User from "../models/user.model.js";
import { generateTeamCode } from "../lib/utils.js";

export const createTeam = async (req, res) => {
  try {
    const { name } = req.body;
    const ownerId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Team name is required" });
    }

    let teamCode;
    let existingTeamByCode;
    do {
      teamCode = generateTeamCode();
      existingTeamByCode = await Team.findOne({ code: teamCode });
    } while (existingTeamByCode);

    const newTeam = new Team({
      name,
      code: teamCode,
      owner: ownerId,
      members: [ownerId],
    });

    await newTeam.save();

    await User.findByIdAndUpdate(ownerId, { team: newTeam._id });

    res.status(201).json({
      _id: newTeam._id,
      name: newTeam.name,
      code: newTeam.code,
      owner: newTeam.owner,
      members: newTeam.members,
      createdAt: newTeam.createdAt,
      updatedAt: newTeam.updatedAt,
    });

  } catch (error) {
    console.error("Error in createTeam controller:", error.message);
    if (error.code === 11000) {
        return res.status(500).json({ message: "Failed to generate a unique team code, please try again." });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const joinTeam = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;

    if (!code) {
      return res.status(400).json({ message: "Team code is required" });
    }

    const teamToJoin = await Team.findOne({ code });

    if (!teamToJoin) {
      return res.status(404).json({ message: "Team not found with this code" });
    }

    if (teamToJoin.members.includes(userId)) {
      await User.findByIdAndUpdate(userId, { team: teamToJoin._id });
      return res.status(200).json(teamToJoin);
    }

    teamToJoin.members.push(userId);
    await teamToJoin.save();

    await User.findByIdAndUpdate(userId, { team: teamToJoin._id });

    res.status(200).json(teamToJoin);

  } catch (error) {
    console.error("Error in joinTeam controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id; // Current user

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Optional: Check if the requesting user is a member of the team they are trying to view.
    // This is a good security practice.
    if (!team.members.includes(userId)) {
        return res.status(403).json({ message: "You are not a member of this team." });
    }

    // Populate member details
    const populatedTeam = await Team.findById(teamId).populate({
        path: "members",
        select: "_id fullName profilePic email", // Specify fields to include
    });

    if (!populatedTeam) { // Should not happen if team was found above, but good practice
        return res.status(404).json({ message: "Team not found when populating members." });
    }

    res.status(200).json(populatedTeam.members);

  } catch (error) {
    console.error("Error in getTeamMembers controller:", error.message);
    if (error.kind === 'ObjectId' && error.path === '_id') { // Error for invalid ObjectId format
        return res.status(400).json({ message: "Invalid team ID format." });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};
