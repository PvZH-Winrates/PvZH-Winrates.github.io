async function fetchPatchesFromGit() {
  try {
    // Fetch the repository contents
    const response = await fetch(
      "https://api.github.com/repos/pvzh-winrates/pvzh-winrates.github.io/contents/datafiles",
    );

    //console.log("Raw response:", await response.text());
    const data = await response.text();

    // Filter only directories (patches)
    const patches = data.filter((item) => item.type === "dir");

    return patches.map((patch) => patch.name);
  } catch (error) {
    console.error("Error fetching patches:", error);
    return [];
  }
}

async function fetchPlayersFromGit() {
  try {
    const response = await fetch("playernames.txt");

    const data = await response.text();

    // Split content by lines and filter out empty lines
    const players = data.split("\n").filter((name) => name.trim() !== "");

    return players;
  } catch (error) {
    console.error("Error fetching players:", error);
    return [];
  }
}

async function fetchTournamentsFromGit() {
  try {
    const patches = await fetchPatchesFromGit();
    const tournamentsSet = new Set();

    // Fetch tournaments from each patch
    for (const patchName of patches) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/pvzh-winrates/pvzh-winrates.github.io/contents/datafiles/${patchName}`,
        );
        const data = await response.json();

        // Filter only .txt files (tournaments)
        const tournaments = data
          .filter((item) => item.type === "file" && item.name.endsWith(".txt"))
          .map((tournament) => tournament.name.replace(".txt", ""));

        // Add to set to avoid duplicates
        tournaments.forEach((tournament) => tournamentsSet.add(tournament));
      } catch (error) {
        console.error(
          `Error fetching tournaments for patch ${patchName}:`,
          error,
        );
      }
    }

    return Array.from(tournamentsSet);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return [];
  }
}

async function createPatchCheckboxes() {
  const dateDiv = document.getElementById("date");
  const playersDiv = document.getElementById("players");
  const tournamentsDiv = document.getElementById("tournaments");
  const patches = await fetchPatchesFromGit();
  const players = await fetchPlayersFromGit();
  const tournaments = await fetchTournamentsFromGit();

  // Clear existing content
  dateDiv.innerHTML = "";
  playersDiv.innerHTML = "";
  tournamentsDiv.innerHTML = "";

  // Create checkbox for each patch
  patches.forEach((patchName) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = patchName;
    checkbox.name = "patches";

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + patchName));
    label.style.display = "block";

    dateDiv.appendChild(label);
  });

  // Create search bar for players
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search players...";
  searchInput.style.width = "100%";
  searchInput.style.marginBottom = "10px";
  playersDiv.appendChild(searchInput);

  // Create scrollable container for player checkboxes
  const playersContainer = document.createElement("div");
  playersContainer.style.height = "30vh";
  playersContainer.style.overflowY = "scroll";
  playersContainer.style.border = "1px solid #ccc";
  playersContainer.style.padding = "5px";

  const allPlayerLabels = [];

  // Create checkbox for each player
  players.forEach((playerName) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = playerName;
    checkbox.name = "players";

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + playerName));
    label.style.display = "block";

    playersContainer.appendChild(label);
    allPlayerLabels.push({ label, playerName: playerName.toLowerCase() });
  });

  // Add search functionality
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    allPlayerLabels.forEach(({ label, playerName }) => {
      if (playerName.includes(searchTerm)) {
        label.style.display = "block";
      } else {
        label.style.display = "none";
      }
    });
  });

  playersDiv.appendChild(playersContainer);

  // Create checkbox for each tournament
  tournaments.forEach((tournamentName) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = tournamentName;
    checkbox.name = "tournaments";

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + tournamentName));
    label.style.display = "block";

    tournamentsDiv.appendChild(label);
  });
}
async function createSpreadsheet() {
  try {
    // Get checked patches
    const checkedPatches = Array.from(
      document.querySelectorAll('input[name="patches"]:checked'),
    ).map((checkbox) => checkbox.value);

    // Get checked tournaments
    const checkedTournaments = Array.from(
      document.querySelectorAll('input[name="tournaments"]:checked'),
    ).map((checkbox) => checkbox.value);

    if (checkedPatches.length === 0 || checkedTournaments.length === 0) {
      alert("Please select at least one patch and one tournament");
      return;
    }

    const allPlayerNames = new Set();
    const allGameReports = [];

    // Process each checked patch
    for (const patchName of checkedPatches) {
      // Process each checked tournament in this patch
      for (const tournamentName of checkedTournaments) {
        try {
          const response = await fetch(
            `./datafiles/${patchName}/${tournamentName}.txt`,
          );

          if (response.ok) {
            const data = await response.json();
            const content = atob(data.content);
            const lines = content
              .split("\n")
              .filter((line) => line.trim() !== "");

            // Add lines to game reports
            allGameReports.push(...lines);
          }
        } catch (error) {
          console.error(
            `Error fetching ${tournamentName}.txt from patch ${patchName}:`,
            error,
          );
        }
      }
    }

    // Convert player names set to array
    const playerNamesList = Array.from(allPlayerNames);

    console.log("Player names:", playerNamesList);
    console.log("Game reports:", allGameReports);

    document.getElementById("cell-r0-c0").innerHTML = "";
    document.getElementById("cell-r0-c1").innerHTML = "GS";
    document.getElementById("cell-r0-c2").innerHTML = "SF";
    document.getElementById("cell-r0-c3").innerHTML = "WK";
    document.getElementById("cell-r0-c4").innerHTML = "CZ";
    document.getElementById("cell-r0-c5").innerHTML = "SP";
    document.getElementById("cell-r0-c6").innerHTML = "CT";
    document.getElementById("cell-r0-c7").innerHTML = "BC";
    document.getElementById("cell-r0-c8").innerHTML = "GK";
    document.getElementById("cell-r0-c9").innerHTML = "NC";
    document.getElementById("cell-r0-c10").innerHTML = "RO";
    document.getElementById("cell-r0-c11").innerHTML = "CC";
    document.getElementById("cell-r1-c0").innerHTML = "SB";
    document.getElementById("cell-r2-c0").innerHTML = "HG";
    document.getElementById("cell-r3-c0").innerHTML = "SM";
    document.getElementById("cell-r4-c0").innerHTML = "IF";
    document.getElementById("cell-r5-c0").innerHTML = "RB";
    document.getElementById("cell-r6-c0").innerHTML = "EB";
    document.getElementById("cell-r7-c0").innerHTML = "BF";
    document.getElementById("cell-r8-c0").innerHTML = "PB";
    document.getElementById("cell-r9-c0").innerHTML = "IM";
    document.getElementById("cell-r10-c0").innerHTML = "ZM";
    document.getElementById("cell-r11-c0").innerHTML = "NT";
    const do_names = playerNamesList.length !== 0;
    console.log(do_names);
    const winMatrix = Array(12)
      .fill(null)
      .map(() =>
        Array(12)
          .fill(null)
          .map(() => [0, 0, 0, 0]),
      );
    const heroKeywords = {
      gs: 0,
      sf: 1,
      wk: 2,
      cz: 3,
      sp: 4,
      ct: 5,
      bc: 6,
      gk: 7,
      nc: 8,
      ro: 9,
      cc: 10,
      sb: 0,
      hg: 1,
      sm: 2,
      if: 3,
      rb: 4,
      eb: 5,
      bf: 6,
      pb: 7,
      im: 8,
      zm: 9,
      nt: 10,
    };
    const plant_hero = [
      "gs",
      "sf",
      "wk",
      "cz",
      "sp",
      "ct",
      "bc",
      "gk",
      "nc",
      "ro",
      "cc",
    ];
    for (const report of allGameReports) {
      console.log(report);
      const parts = report.split("|");
      if (
        parts.length === 7 &&
        (!do_names || parts.some((part) => playerNamesList.includes(part)))
      ) {
        first_hero_id = heroKeywords[parts[3]];
        second_hero_id = heroKeywords[parts[4]];
        plant_win = false;
        if (plant_hero.includes(parts[3])) plant_win = true;
        if (do_names) {
          const hasPlayer1 = playerNamesList.includes(parts[1]);
          const hasPlayer2 = playerNamesList.includes(parts[2]);
          if (hasPlayer1) {
            if (plant_win) {
              winMatrix[first_hero_id][second_hero_id][0] += 1;
              winMatrix[first_hero_id][second_hero_id][1] += 1;
            } else {
              winMatrix[second_hero_id][first_hero_id][2] += 1;
              winMatrix[second_hero_id][first_hero_id][3] += 1;
            }
          } else if (hasPlayer2) {
            if (plant_win) {
              winMatrix[first_hero_id][second_hero_id][1] += 1;
            } else {
              winMatrix[second_hero_id][first_hero_id][3] += 1;
            }
          }
        } else {
          if (plant_win) {
            winMatrix[first_hero_id][second_hero_id][0] += 1;
            winMatrix[first_hero_id][second_hero_id][1] += 1;
            winMatrix[first_hero_id][second_hero_id][3] += 1;
          } else {
            winMatrix[second_hero_id][first_hero_id][1] += 1;
            winMatrix[second_hero_id][first_hero_id][2] += 1;
            winMatrix[second_hero_id][first_hero_id][3] += 1;
          }
        }
      }
    }
    console.log(winMatrix);
    // Update spreadsheet cells with winMatrix data
    // Function to get color based on percentage with non-linear scaling
    function getColorForPercentage(percentage) {
      // Normalize percentage to 0-1
      let normalized = percentage / 100;

      // Apply sigmoid-like transformation to make changes more dramatic around 50%
      // and less dramatic at extremes
      const transformed = 1 / (1 + Math.exp(-8 * (normalized - 0.5)));

      let r, g, b;

      if (transformed < 0.5) {
        // Red to orange (0% to 50%)
        r = 255;
        g = Math.floor(transformed * 2 * 165); // 0 to 165 (orange)
        b = 0;
      } else {
        // Orange to green (50% to 100%)
        r = Math.floor(255 - (transformed - 0.5) * 2 * 255); // 255 to 0
        g = Math.floor(165 + (transformed - 0.5) * 2 * 90); // 165 to 255
        b = 0;
      }

      return `rgb(${r}, ${g}, ${b})`;
    }

    for (let r = 1; r <= 12; r++) {
      for (let c = 1; c <= 12; c++) {
        const topCell = document.getElementById(`cell-r${r}-c${c}-top`);
        const bottomCell = document.getElementById(`cell-r${r}-c${c}-bottom`);

        if (topCell && bottomCell) {
          let topPercentageValue, bottomPercentageValue;

          if (r === 12 && c === 12) {
            // Cell (12,12) - average of all cells excluding row/column 0
            let topSum = 0,
              bottomSum = 0,
              topCount = 0,
              bottomCount = 0;
            for (let i = 1; i <= 11; i++) {
              for (let j = 1; j <= 11; j++) {
                if (winMatrix[i - 1][j - 1][1] !== 0) {
                  topSum +=
                    (winMatrix[i - 1][j - 1][0] / winMatrix[i - 1][j - 1][1]) *
                    100;
                  topCount++;
                }
                if (winMatrix[i - 1][j - 1][3] !== 0) {
                  bottomSum +=
                    (winMatrix[i - 1][j - 1][2] / winMatrix[i - 1][j - 1][3]) *
                    100;
                  bottomCount++;
                }
              }
            }
            topPercentageValue = topCount > 0 ? topSum / topCount : 0;
            bottomPercentageValue =
              bottomCount > 0 ? bottomSum / bottomCount : 0;
          } else if (r === 12) {
            // Row 12 - average of column c (excluding row 0)
            let topSum = 0,
              bottomSum = 0,
              topCount = 0,
              bottomCount = 0;
            for (let i = 1; i <= 11; i++) {
              if (winMatrix[i - 1][c - 1][1] !== 0) {
                topSum +=
                  (winMatrix[i - 1][c - 1][0] / winMatrix[i - 1][c - 1][1]) *
                  100;
                topCount++;
              }
              if (winMatrix[i - 1][c - 1][3] !== 0) {
                bottomSum +=
                  (winMatrix[i - 1][c - 1][2] / winMatrix[i - 1][c - 1][3]) *
                  100;
                bottomCount++;
              }
            }
            topPercentageValue = topCount > 0 ? topSum / topCount : 0;
            bottomPercentageValue =
              bottomCount > 0 ? bottomSum / bottomCount : 0;
          } else if (c === 12) {
            // Column 12 - average of row r (excluding column 0)
            let topSum = 0,
              bottomSum = 0,
              topCount = 0,
              bottomCount = 0;
            for (let j = 1; j <= 11; j++) {
              if (winMatrix[r - 1][j - 1][1] !== 0) {
                topSum +=
                  (winMatrix[r - 1][j - 1][0] / winMatrix[r - 1][j - 1][1]) *
                  100;
                topCount++;
              }
              if (winMatrix[r - 1][j - 1][3] !== 0) {
                bottomSum +=
                  (winMatrix[r - 1][j - 1][2] / winMatrix[r - 1][j - 1][3]) *
                  100;
                bottomCount++;
              }
            }
            topPercentageValue = topCount > 0 ? topSum / topCount : 0;
            bottomPercentageValue =
              bottomCount > 0 ? bottomSum / bottomCount : 0;
          } else {
            // Regular cells (1-11, 1-11)
            topPercentageValue =
              winMatrix[r - 1][c - 1][1] !== 0
                ? (winMatrix[r - 1][c - 1][0] / winMatrix[r - 1][c - 1][1]) *
                  100
                : 0;
            bottomPercentageValue =
              winMatrix[r - 1][c - 1][3] !== 0
                ? (winMatrix[r - 1][c - 1][2] / winMatrix[r - 1][c - 1][3]) *
                  100
                : 0;
          }

          const topPercentage = topPercentageValue.toFixed(1) + "%";
          const bottomPercentage = bottomPercentageValue.toFixed(1) + "%";

          topCell.textContent = topPercentage;
          bottomCell.textContent = bottomPercentage;

          topCell.style.backgroundColor =
            getColorForPercentage(topPercentageValue);
          bottomCell.style.backgroundColor = getColorForPercentage(
            bottomPercentageValue,
          );
        }
      }
    }
  } catch (error) {
    console.error("Error creating spreadsheet:", error);
    return null;
  }
}
function createSpreadsheetHtml(rows, cols) {
  const table = document.getElementById("spreadsheet");

  for (let r = 0; r < rows; r++) {
    const tr = document.createElement("tr");

    for (let c = 0; c < cols; c++) {
      let cell;
      if (r === 0 || c === 0) {
        // header cell
        cell = document.createElement("th");
        cell.textContent = r === 0 ? "H" + c : "R" + r;
        cell.id = `cell-r${r}-c${c}`;
      } else {
        // diagonal cell
        cell = document.createElement("td");
        cell.classList.add("diagonal");
        cell.id = `cell-r${r}-c${c}`;

        const topRight = document.createElement("div");
        topRight.className = "top-right";
        topRight.id = `cell-r${r}-c${c}-top`;
        topRight.textContent = `A${r},${c}`;

        const bottomLeft = document.createElement("div");
        bottomLeft.className = "bottom-left";
        bottomLeft.id = `cell-r${r}-c${c}-bottom`;
        bottomLeft.textContent = `B${r},${c}`;

        cell.appendChild(topRight);
        cell.appendChild(bottomLeft);
      }
      tr.appendChild(cell);
    }
    table.appendChild(tr);
  }
}
// Load patches on page load
window.addEventListener("load", createPatchCheckboxes);
createSpreadsheetHtml(13, 13);
