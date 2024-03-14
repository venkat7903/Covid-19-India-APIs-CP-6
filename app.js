const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
// const cors = require("cors");

const app = express();

app.use(express.json());
// app.use(cors());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertToCamelCase = (data) => ({
  stateId: data.state_id,
  stateName: data.state_name,
  population: data.population,
  districtId: data.district_id,
  districtName: data.district_name,
  cases: data.cases,
  cured: data.cured,
  active: data.active,
  deaths: data.deaths,
});

// API1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray.map((each) => convertToCamelCase(each)));
});

//API2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
  SELECT * FROM state WHERE state_id=${stateId};
  `;
  const state = await db.get(getStateQuery);
  response.send(convertToCamelCase(state));
});

//API3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
  INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
  VALUES (
      '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );
  `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  SELECT * FROM district WHERE district_id=${districtId};
  `;
  const district = await db.get(getDistrictQuery);
  response.send(convertToCamelCase(district));
});

//API5
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
  DELETE FROM district WHERE district_id=${districtId};
  `;
  await db.run(deleteQuery);
  response.send("District Removed");
});

//API6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
  UPDATE
    district
  SET 
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
  WHERE 
    district_id=${districtId};
  `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
  SELECT 
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
  FROM 
    district
  WHERE 
    state_id=${stateId}
  `;
  const stats = await db.get(getStatsQuery);
  response.send(stats);
});

//API8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailsQuery = `
  SELECT state_name 
  FROM 
    state
  NATURAL JOIN
    district
  WHERE 
    district_id=${districtId};
  `;
  const details = await db.get(getDistrictDetailsQuery);
  response.send(convertToCamelCase(details));
});

module.exports = app;
