$notebookPath = "C:\Users\rd5647dvla\Documents\Projects\Nairobi Workshop\Lab0_Big_Data_SQL_and_ETL_Basics.ipynb"
$nb = Get-Content -Raw $notebookPath | ConvertFrom-Json

# Clean out any previously injected practice cells to ensure clean run
$nb.cells = @($nb.cells | Where-Object { $_.id -notlike "challenge-*" -and $_.id -ne "practice-intro" })

# Find index of Cleanup cell
$cleanupIdx = -1
for ($i = 0; $i -lt $nb.cells.Count; $i++) {
    $cell = $nb.cells[$i]
    if ($cell.cell_type -eq "markdown" -and ($cell.source -join "") -like "*Cleanup:*") {
        $cleanupIdx = $i
        break
    }
}

if ($cleanupIdx -eq -1) {
    $cleanupIdx = $nb.cells.Count
}

# Define new cells to insert using literal single-quoted here-string
$newCellsJson = @'
[
  {
   "cell_type": "markdown",
   "id": "practice-intro",
   "metadata": {},
   "source": [
    "## ✍️ Student Practice Challenges\n",
    "\n",
    "Now that you have seen how to write SQL queries and Python ETL steps, it's time to practice!\n",
    "Write the code for the challenges below and run the cells to verify your results."
   ]
  },
  {
   "cell_type": "markdown",
   "id": "challenge-1-desc",
   "metadata": {},
   "source": [
    "### 📝 Challenge 1: Filter & Sort Vehicles\n",
    "\n",
    "**Objectives:**\n",
    "- Write a SQL query that retrieves all columns from the `vehicles` table.\n",
    "- Filter for vehicles manufactured in `2019` or later.\n",
    "- Sort them alphabetically by `make`."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "id": "challenge-1-code",
   "metadata": {},
   "outputs": [],
   "source": [
    "# Write your SQL query here and call .show() to view results\n",
    "# Hint: Use con.sql(\"SELECT * FROM vehicles WHERE year >= 2019 ORDER BY make\").show()\n",
    "\n"
   ]
  },
  {
   "cell_type": "markdown",
   "id": "challenge-2-desc",
   "metadata": {},
   "source": [
    "### 📝 Challenge 2: Group & Aggregate (Average Year)\n",
    "\n",
    "**Objectives:**\n",
    "- Write a SQL query that calculates the **average manufacturing year** of vehicles for each `make`.\n",
    "- Rename the average column to `average_year`.\n",
    "- Group the results by the `make` column."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "id": "challenge-2-code",
   "metadata": {},
   "outputs": [],
   "source": [
    "# Write your SQL query here and call .show() to view results\n",
    "# Hint: Use con.sql(\"SELECT make, AVG(year) AS average_year FROM vehicles GROUP BY make\").show()\n",
    "\n"
   ]
  },
  {
   "cell_type": "markdown",
   "id": "challenge-3-desc",
   "metadata": {},
   "source": [
    "### 📝 Challenge 3: Inner Join with Region Filter\n",
    "\n",
    "**Objectives:**\n",
    "- Write a SQL query that joins `vehicles` and `owners` on the shared `owner_id` key.\n",
    "- Retrieve the columns: `owner_name`, `region`, `make`, and `model`.\n",
    "- Filter the results to only show owners who reside in the `'Greater Accra'` region."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "id": "challenge-3-code",
   "metadata": {},
   "outputs": [],
   "source": [
    "# Write your SQL query here and call .show() to view results\n",
    "# Hint: Use con.sql(\"SELECT o.owner_name, o.region, v.make, v.model FROM vehicles v INNER JOIN owners o ON v.owner_id = o.owner_id WHERE o.region = 'Greater Accra'\").show()\n",
    "\n"
   ]
  },
  {
   "cell_type": "markdown",
   "id": "challenge-4-desc",
   "metadata": {},
   "source": [
    "### 📝 Challenge 4: Simple ETL Pipeline\n",
    "\n",
    "**Objectives:**\n",
    "- Load the new raw data dictionary `new_raw` into a Pandas DataFrame.\n",
    "- Clean the `owner` column: convert to Title Case and fill nulls/missing values with `'Unknown'`.\n",
    "- Clean the `fee_paid` column: replace negative or null fees with a default of `150.0`.\n",
    "- Add a `zonal_code` column: start with `'GW'` -> `'ACC-ZONE'`, `'AS'` -> `'ASH-ZONE'`, any other -> `'VOL-ZONE'`.\n",
    "- Load the cleaned DataFrame to `./output/lab0_challenge_clean.csv`."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "id": "challenge-4-code",
   "metadata": {},
   "outputs": [],
   "source": [
    "# New raw dataset\n",
    "new_raw = {\n",
    "    'reg_no': ['GW-404-23', 'AS-102-19', 'VOL-505-21'],\n",
    "    'owner': ['KWABENA ADEPOMA', None, 'selorm albert'],\n",
    "    'fee_paid': [300.0, -10.0, None]\n",
    "}\n",
    "\n",
    "# Write your code here (Extract, Transform, Load)\n",
    "# 1. Extract (Create DataFrame)\n",
    "\n",
    "# 2. Transform (Clean names to Title Case, replace NaN owners with 'Unknown', clean fees, and add zonal_code)\n",
    "\n",
    "# 3. Load (Save to './output/lab0_challenge_clean.csv')\n",
    "\n"
   ]
  }
]
'@
$newCells = ConvertFrom-Json $newCellsJson

# Insert new cells before cleanup
$left = $nb.cells[0..($cleanupIdx - 1)]
$right = $nb.cells[$cleanupIdx..($nb.cells.Count - 1)]

# Update cleanup code source
for ($i = 0; $i -lt $right.Count; $i++) {
    if ($right[$i].cell_type -eq "code" -and $right[$i].id -eq "5e43855f") {
        $right[$i].source = @(
            "# Cleanup: Close the connection`n",
            "con.close()`n",
            "print('✅ DuckDB connection closed.')"
        )
    }
}

$nb.cells = $left + $newCells + $right

# Convert back to JSON and save
$nb | ConvertTo-Json -Depth 10 | Set-Content -Path $notebookPath
Write-Output "SUCCESS: Notebook updated successfully via PowerShell JSON parser."
