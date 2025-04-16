Below is a sample final **README.md** you can include in your GitHub repository. This document covers the project overview, setup instructions, usage details, testing guidelines, and final notes. Feel free to adjust any details (such as paths, credentials, or optional enhancements) to match your specific project implementation.

---

# Bidirectional Data Ingestion Tool

This project is a web-based application that facilitates bidirectional data ingestion between a ClickHouse database and flat files (CSV). It supports:

- **Exporting data from ClickHouse to a CSV file** (ClickHouse → Flat File)  
- **Importing data from a CSV file into ClickHouse** (Flat File → ClickHouse)

The tool allows users to dynamically retrieve tables and columns from ClickHouse, select the data to be exported or imported, and reports the total number of records processed.

> **Note:** The JWT Token field is used as the ClickHouse password in this implementation.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up a Virtual Environment and Install Dependencies](#2-set-up-a-virtual-environment-and-install-dependencies)
  - [3. Set Up the ClickHouse Server using Docker](#3-set-up-the-clickhouse-server-using-docker)
- [Project Structure](#project-structure)
- [Usage Instructions](#usage-instructions)
  - [1. Starting the Flask App](#1-starting-the-flask-app)
  - [2. Export Data from ClickHouse to CSV](#2-export-data-from-clickhouse-to-csv)
  - [3. Import Data from CSV into ClickHouse](#3-import-data-from-csv-into-clickhouse)
  - [4. Data Preview Feature (Optional)](#4-data-preview-feature-optional)
- [Testing](#testing)
- [Error Handling](#error-handling)


---

## Features

- **Bidirectional Ingestion:**  
  - **Export:** Retrieve selected data from ClickHouse and export it to a CSV file.
  - **Import:** Read a CSV file and insert its data into a specified ClickHouse table.
- **Schema Discovery:**  
  - List available tables and columns from the ClickHouse database.
---

## Prerequisites

- **Python 3.x**
- **Docker:** Used to run the ClickHouse server container.
- **Git:** For version control.
- **Web Browser:** To access the web UI.

---

## Setup Instructions

### 1. Clone the Repository

Clone the project repository to your local machine:

```bash
git clone https://github.com/lakshmidurga-05/data_ingestion_tool.git
cd data_ingestion_tool
```

### 2. Set Up a Virtual Environment and Install Dependencies

Create and activate a Python virtual environment:

```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
```

Install the required packages:

```bash
pip install -r requirements.txt
```

*Note: `requirements.txt` should include:*
```
Flask==2.2.2
Werkzeug==2.2.2
clickhouse-driver==0.2.9
```

### 3. Set Up the ClickHouse Server using Docker

Run a ClickHouse server container with the following command:

```bash
docker run -d --name clickhouse-server -p 9000:9000 -p 8123:8123 -e CLICKHOUSE_USER=default -e CLICKHOUSE_PASSWORD=mypassword clickhouse/clickhouse-server
```

This command:
- Runs the ClickHouse server container in detached mode.
- Maps port 9000 (for native protocol connections) and 8123 (for HTTP).
- Sets the default user (`default`) and password (`mypassword`).



## Project Structure

data_ingestion_tool/
├── app.py                      # Main Flask application with endpoints for ingestion
├── clickhouse_client.py        # Module for connecting to ClickHouse and query utilities
├── flat_file_handler.py        # Module with CSV reading, preview, and insertion functions
├── requirements.txt            # Python dependencies
├── README.md                   # This documentation file
├── prompts.txt                 # (Optional) AI prompts if required
├── templates/
│   └── index.html              # HTML UI for the ingestion tool
└── static/
    ├── css/
    │   └── style.css           # CSS styles
    └── js/
        └── main.js             # JavaScript for the UI interactions

## Usage Instructions

### 1. Starting the Flask App

Activate your virtual environment and run the Flask application:

```bash
python app.py
```

You should see output like:
```
* Running on http://127.0.0.1:5000
```

### 2. Export Data from ClickHouse to CSV

1. **Open the Web UI:**  
   Go to [http://127.0.0.1:5000](http://127.0.0.1:5000).

2. **Enter ClickHouse Connection Details:**
   - **Host:** `localhost` (or `host.docker.internal` if necessary)
   - **Port:** `9000`
   - **Database:** `default`
   - **User:** `default`
   - **JWT Token (used as password):** `mypassword`

3. **Connect:**  
   Click the **Connect** button. A list of tables (e.g., `test_table`) should display.

4. **Select a Table and Columns:**  
   Click on the desired table to view its columns (displayed as checkboxes).  
   Select the columns you wish to export.

5. **Export Data:**  
   Click **Start Ingestion**. When prompted, provide an output file name (e.g., `output.csv`).  
   The application will export the data, and you’ll see a status message like “Ingestion completed. Total records exported: X”.

6. **Verify the CSV:**  
   Open `output.csv` in a text editor or Excel to confirm the records are formatted with comma-separated values, one record per line.

### 3. Import Data from CSV into ClickHouse

1. **Prepare a CSV File:**  
   Create a CSV file (e.g., `sample_data.csv`) manually with the following contents:
   ```csv
   id,name,age
   10,Tinku,28
   11,Babulu,45
   ```
2. **Switch to Flat File Mode:**  
   In the UI, choose **Flat File** from the data source dropdown.

3. **Enter Flat File Details:**  
   - **File Path:** Provide the full file path, for example:  
     `C:\Users\LAKSHMI DURGA O\OneDrive\Desktop\data_ingestion_tool\sample_data.csv`
   - **Delimiter:** `,`
  
4. **Import Data:**  
   Click **Start Ingestion**. When prompted, provide the target ClickHouse table name (for example, `test_table` or another table you have created).  
   You should see a success message such as “Ingestion completed. Total records inserted: 2”.

5. **Verify the Import:**  
   Connect to ClickHouse (using the Docker client or another ClickHouse client) and run:
   ```sql
   SELECT * FROM test_table;
   ```
   Confirm that the rows from `sample_data.csv` have been inserted into the table.

### 4. Data Preview Feature (Optional)

1. **Preview CSV Data:**  
   In Flat File mode, click the **Preview Data** button.  
   The application will display the first 100 rows (or fewer) of the CSV in an HTML table, allowing you to verify the contents before importing.



## Testing

- **Manual Testing:**  
  Follow the usage instructions to test both export and import flows.
  
- **API Testing (Optional):**  
  Use tools like cURL or Postman to manually test the endpoints (e.g., `/connect_clickhouse`, `/ingest_file_to_clickhouse`).

- **Verify in ClickHouse:**  
  Use the ClickHouse client (via Docker) to run:
  ```sql
  SELECT * FROM test_table;
  ```
  to confirm that data is correctly stored.

- **Error Scenarios:**  
  Test with incorrect connection details or improperly formatted CSV files to ensure your error handling is robust.



## Error Handling

- Each endpoint returns a JSON response with `success: true` on success or `success: false` with an `error` message on failure.
- The UI displays status messages based on these responses to help the user correct any issues (e.g., invalid file path, connection errors, or type mismatches).



