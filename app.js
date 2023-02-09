const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (error) {
    console.log(`DataBase error is ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//Get players API
convertPlayersDBObjectAPI1 = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * FROM player_details;`;
  const getPlayersResponse = await db.all(getPlayersQuery);
  response.send(
    getPlayersResponse.map((object) => convertPlayersDBObjectAPI1(object))
  );
});

//Get a specific player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details WHERE player_id=${playerId};`;
  const getPlayerResponse = await db.get(getPlayerQuery);
  response.send(convertPlayersDBObjectAPI1(getPlayerResponse));
});

//Update player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details SET player_name='${playerName}'
    WHERE player_id=${playerId};`;
  const updatePlayerResponse = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get match details API
convertPlayersDBObjectAPI4 = (object) => {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT * FROM match_details WHERE match_id=${matchId};`;
  const getMatchDetailsResponse = await db.get(getMatchDetailsQuery);
  response.send(convertPlayersDBObjectAPI4(getMatchDetailsResponse));
});

//Get matches of a player API
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT match_id FROM player_match_score WHERE player_id=${playerId};`;
  const getPlayerMatches = await db.all(getPlayerMatchesQuery);
  const matchIdArray = getPlayerMatches.map((match) => {
    return match.match_id;
  });
  const getMatchDetailsQuery = `
    SELECT * FROM match_details WHERE match_id IN (${matchIdArray});`;
  const getMatchDetailsResponse = await db.all(getMatchDetailsQuery);
  response.send(
    getMatchDetailsResponse.map((object) => convertPlayersDBObjectAPI4(object))
  );
});

//Get players of a specific match API
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT * FROM player_match_score NATURAL JOIN player_details
    WHERE match_id=${matchId};`;
  const getMatchPlayersResponse = await db.all(getMatchPlayersQuery);
  response.send(
    getMatchPlayersResponse.map((object) => convertPlayersDBObjectAPI1(object))
  );
});

//GET statistics of a specific player API
convertPlayersDBObjectAPI7 = (playerName, object) => {
  return {
    playerId: object.player_id,
    playerName: playerName,
    totalScore: object.totalScore,
    totalFours: object.totalFours,
    totalSixes: object.totalSixes,
  };
};
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `
    SELECT player_name FROM player_details WHERE player_id = ${playerId};`;
  const getPlayerName = await db.get(getPlayerNameQuery);
  const getPlayerStatsQuery = `
  SELECT player_id,SUM(score) AS totalScore, SUM(fours) AS totalFours , SUM(sixes) AS totalSixes 
  FROM player_match_score WHERE player_id = ${playerId};`;
  const getPlayerStatsResponse = await db.get(getPlayerStatsQuery);
  response.send(
    convertPlayersDBObjectAPI7(
      getPlayerName.player_name,
      getPlayerStatsResponse
    )
  );
});
module.exports = app;
