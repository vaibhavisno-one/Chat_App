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

    let updatedUser;
    try {
      updatedUser = await User.findByIdAndUpdate(ownerId, { team: newTeam._id }, { new: true });
      if (!updatedUser || updatedUser.team?.toString() !== newTeam._id.toString()) {
        console.error(`Failed to update user ${ownerId} with team ${newTeam._id}. User's team is now ${updatedUser?.team}`);
        await Team.findByIdAndDelete(newTeam._id);
        return res.status(500).json({ message: "Failed to update user with new team information. Team creation rolled back." });
      }
    } catch (error) {
      console.error(`Error updating user ${ownerId} with team ${newTeam._id}:`, error.message);
      try {
        await Team.findByIdAndDelete(newTeam._id);
        console.log(`Successfully deleted team ${newTeam._id} after failed user update.`);
      } catch (deleteError) {
        console.error(`Failed to delete team ${newTeam._id} after failed user update:`, deleteError.message);
      }
      // Rethrow the original error to be caught by the outer catch block
      throw error;
    }

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
      await User.findByIdAndUpdate(userId, { team: teamToJoin._id }); // Ensure user's team field is updated
      return res.status(200).json(teamToJoin);
    }

    // Path B: User is not yet a member, add them to the team.
    const updatedTeam = await Team.findByIdAndUpdate(teamToJoin._id, { $addToSet: { members: userId } }, { new: true });

    if (!updatedTeam) {
      // This case should be rare if teamToJoin was just fetched, but good for robustness
      return res.status(404).json({ message: "Team not found during update operation." });
    }

    let updatedUser;
    try {
      updatedUser = await User.findByIdAndUpdate(userId, { team: updatedTeam._id }, { new: true });
      if (!updatedUser || updatedUser.team?.toString() !== updatedTeam._id.toString()) {
        console.error(`Failed to update user ${userId} with team ${updatedTeam._id}. User's team is now ${updatedUser?.team}`);
        // Rollback: remove user from team members
        await Team.findByIdAndUpdate(updatedTeam._id, { $pull: { members: userId } });
        return res.status(500).json({ message: "Failed to update user with new team. Join team operation rolled back." });
      }
    } catch (error) {
      console.error(`Error updating user ${userId} with team ${updatedTeam._id}:`, error.message);
      // Rollback: remove user from team members
      try {
        await Team.findByIdAndUpdate(updatedTeam._id, { $pull: { members: userId } });
        console.log(`Successfully removed user ${userId} from team ${updatedTeam._id} after failed user update.`);
      } catch (rollbackError) {
        console.error(`Failed to rollback user ${userId} from team ${updatedTeam._id}:`, rollbackError.message);
      }
      throw error; // Rethrow original error
    }

    res.status(200).json(updatedTeam);

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
