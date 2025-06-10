// Frontend/src/pages/TeamsPage.jsx
import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const TeamsPage = () => {
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createdTeamCode, setCreatedTeamCode] = useState(null);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [isLoadingJoin, setIsLoadingJoin] = useState(false);

  const { setCurrentTeam, authUser } = useAuthStore();
  const navigate = useNavigate();

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error("Team name is required.");
      return;
    }
    setIsLoadingCreate(true);
    setCreatedTeamCode(null);
    try {
      const res = await axiosInstance.post("/teams", { name: teamName });
      toast.success(`Team "${res.data.name}" created successfully!`);
      setCreatedTeamCode(res.data.code);
      setCurrentTeam(res.data); // Update auth store with the new team
      setTeamName("");
      // Optionally redirect or update UI further
      // navigate("/"); // Example redirect
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create team.");
      console.error("Create team error:", error);
    } finally {
      setIsLoadingCreate(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast.error("Team code is required.");
      return;
    }
    setIsLoadingJoin(true);
    try {
      const res = await axiosInstance.post("/teams/join", { code: joinCode });
      toast.success(`Successfully joined team "${res.data.name}"!`);
      setCurrentTeam(res.data); // Update auth store with the joined team
      setJoinCode("");
      navigate("/"); // Redirect to home page after joining a team
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to join team.");
      console.error("Join team error:", error);
    } finally {
      setIsLoadingJoin(false);
    }
  };

  // If user is already in a team, perhaps show different UI or a message
  if (authUser?.team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 pt-16">
        <div className="card w-full max-w-md bg-base-100 shadow-xl p-6">
          <h1 className="text-2xl font-bold text-center mb-4">Your Team</h1>
          <p className="text-center mb-2">You are currently a member of team: <strong>{authUser.team.name}</strong>.</p>
          <p className="text-center text-sm mb-1">Team Code: <span className="font-mono bg-base-300 px-2 py-1 rounded">{authUser.team.code}</span></p>
          <p className="text-center text-sm">Owner: {authUser.team.owner === authUser._id ? "You" : "Another user"}</p>
          <button onClick={() => navigate("/")} className="btn btn-primary w-full mt-4">
            Go to Chat
          </button>
           {/* TODO: Add a "Leave Team" button later if needed */}
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 pt-16">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl justify-center">Create a Team</h2>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label htmlFor="teamName" className="label">
                <span className="label-text">Team Name</span>
              </label>
              <input
                type="text"
                id="teamName"
                placeholder="Enter team name"
                className="input input-bordered w-full"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={isLoadingCreate}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={isLoadingCreate}>
              {isLoadingCreate ? <span className="loading loading-spinner"></span> : "Create Team"}
            </button>
          </form>
          {createdTeamCode && (
            <div className="mt-4 p-3 bg-base-200 rounded-lg">
              <p className="text-sm">Team created! Your join code is:
                <strong className="ml-1 font-mono bg-base-300 px-2 py-1 rounded">{createdTeamCode}</strong>
              </p>
            </div>
          )}

          <div className="divider my-6">OR</div>

          <h2 className="card-title text-2xl justify-center">Join a Team</h2>
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div>
              <label htmlFor="joinCode" className="label">
                <span className="label-text">Team Code</span>
              </label>
              <input
                type="text"
                id="joinCode"
                placeholder="Enter team code"
                className="input input-bordered w-full"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                disabled={isLoadingJoin}
              />
            </div>
            <button type="submit" className="btn btn-secondary w-full" disabled={isLoadingJoin}>
              {isLoadingJoin ? <span className="loading loading-spinner"></span> : "Join Team"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeamsPage;
