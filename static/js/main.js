document.addEventListener('DOMContentLoaded', () => {
    const dataSourceSelect = document.getElementById('data-source');
    const clickhouseConfig = document.getElementById('clickhouse-config');
    const flatfileConfig = document.getElementById('flatfile-config');
    const tableListDiv = document.getElementById('table-list');
    const columnListDiv = document.getElementById('column-list');
    const statusArea = document.getElementById('status-area');
    const resultArea = document.getElementById('result-area');
    const previewArea = document.getElementById('preview-area');
  
    // Toggle visible configuration based on data source
    dataSourceSelect.addEventListener('change', () => {
      if (dataSourceSelect.value === 'clickhouse') {
        clickhouseConfig.style.display = 'block';
        flatfileConfig.style.display = 'none';
      } else {
        clickhouseConfig.style.display = 'none';
        flatfileConfig.style.display = 'block';
      }
    });
  
    // Handle ClickHouse "Connect" button click
    document.getElementById('connect-ch').addEventListener('click', () => {
      statusArea.textContent = 'Connecting to ClickHouse...';
      const payload = {
        host: document.getElementById('ch-host').value,
        port: document.getElementById('ch-port').value,
        database: document.getElementById('ch-database').value,
        user: document.getElementById('ch-user').value,
        jwt_token: document.getElementById('ch-jwt').value
      };
  
      fetch('/connect_clickhouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          statusArea.textContent = 'Connected successfully! Listing tables...';
          tableListDiv.innerHTML = '<h3>Available Tables:</h3>';
          data.tables.forEach(table => {
            const tableItem = document.createElement('div');
            tableItem.textContent = table;
            tableItem.classList.add('table-item');
            tableItem.style.cursor = 'pointer';
            // Click on a table to fetch and display its columns
            tableItem.addEventListener('click', () => {
              fetchColumns(table, payload);
            });
            tableListDiv.appendChild(tableItem);
          });
        } else {
          statusArea.textContent = 'Error: ' + data.error;
        }
      })
      .catch(err => {
        statusArea.textContent = 'Request failed: ' + err;
      });
    });
  
    // Fetch columns for a selected table
    function fetchColumns(tableName, payload) {
      statusArea.textContent = `Fetching columns for table ${tableName}...`;
      const data = Object.assign({}, payload, { table: tableName });
      fetch('/fetch_columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          columnListDiv.innerHTML = '<h3>Select Columns:</h3>';
          data.columns.forEach(col => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = col;
            checkbox.classList.add('col-checkbox');
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + col));
            const div = document.createElement('div');
            div.appendChild(label);
            columnListDiv.appendChild(div);
          });
          // Save the table name for later use
          columnListDiv.dataset.table = tableName;
        } else {
          statusArea.textContent = 'Error: ' + data.error;
        }
      })
      .catch(err => {
        statusArea.textContent = 'Request failed: ' + err;
      });
    }
  
    // Handle ClickHouse to Flat File ingestion ("Start Ingestion")
    document.getElementById('start-ingestion').addEventListener('click', () => {
      let source = dataSourceSelect.value;
      if (source === 'clickhouse') {
        const selectedTable = columnListDiv.dataset.table;
        if (!selectedTable) {
          statusArea.textContent = 'Please select a table from the list.';
          return;
        }
        // Get selected columns from checkboxes
        const checkboxes = document.querySelectorAll('.col-checkbox');
        let columns = [];
        checkboxes.forEach(chk => {
          if (chk.checked) {
            columns.push(chk.value);
          }
        });
        if (columns.length === 0) {
          statusArea.textContent = 'Please select at least one column.';
          return;
        }
        // Ask user for output file name
        let outputFile = prompt("Enter the output CSV file path (e.g., output.csv):", "output.csv");
        if (!outputFile) return;
        const payload = {
          host: document.getElementById('ch-host').value,
          port: document.getElementById('ch-port').value,
          database: document.getElementById('ch-database').value,
          user: document.getElementById('ch-user').value,
          jwt_token: document.getElementById('ch-jwt').value,
          table: selectedTable,
          columns: columns,
          output_file: outputFile,
          batch_size: 1000
        };
        statusArea.textContent = `Starting ingestion from table ${selectedTable}...`;
        fetch('/ingest_clickhouse_to_file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            statusArea.textContent = 'Ingestion completed.';
            resultArea.textContent = `Total records exported: ${data.count}`;
          } else {
            statusArea.textContent = 'Error: ' + data.error;
          }
        })
        .catch(err => {
          statusArea.textContent = 'Request failed: ' + err;
        });
      } else if (source === 'flatfile') {
        // Handle Flat File → ClickHouse ingestion
        const filePath = document.getElementById('file-path').value;
        if (!filePath) {
          statusArea.textContent = 'Please provide a valid file path.';
          return;
        }
        // Get selected columns from checkboxes
        const selectedColCheckboxes = document.querySelectorAll('.col-checkbox');
        let columns = [];
        selectedColCheckboxes.forEach(chk => {
          if (chk.checked) {
            columns.push(chk.value);
          }
        });
        // Ask for target table name in ClickHouse
        let targetTable = prompt("Enter the target ClickHouse table name:", "target_table");
        if (!targetTable) return;
        const payload = {
          host: document.getElementById('ch-host').value,   // Reuse ClickHouse connection details
          port: document.getElementById('ch-port').value,
          database: document.getElementById('ch-database').value,
          user: document.getElementById('ch-user').value,
          jwt_token: document.getElementById('ch-jwt').value,
          file_path: document.getElementById('file-path').value,
          delimiter: document.getElementById('file-delimiter').value,
          columns: columns,
          target_table: targetTable
        };
        statusArea.textContent = `Starting ingestion from file ${filePath}...`;
        fetch('/ingest_file_to_clickhouse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            statusArea.textContent = 'Ingestion completed.';
            resultArea.textContent = `Total records inserted: ${data.count}`;
          } else {
            statusArea.textContent = 'Error: ' + data.error;
          }
        })
        .catch(err => {
          statusArea.textContent = 'Request failed: ' + err;
        });
      }
    });
  
    // Handle CSV file preview (Optional Enhancement)
    document.getElementById('preview-data').addEventListener('click', () => {
      const filePath = document.getElementById('file-path').value;
      const delimiter = document.getElementById('file-delimiter').value || ',';
      
      if (!filePath) {
        alert("Please provide a valid file path for preview.");
        return;
      }
      
      const payload = {
        file_path: filePath,
        delimiter: delimiter
      };
      
      statusArea.textContent = 'Loading preview data...';
      
      fetch('/preview_file_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          statusArea.textContent = 'Preview loaded.';
          displayPreview(data.preview);
        } else {
          statusArea.textContent = 'Error: ' + data.error;
        }
      })
      .catch(err => {
        statusArea.textContent = 'Request failed: ' + err;
      });
    });
    
    // Function to display preview data in a table format
    function displayPreview(previewData) {
      previewArea.innerHTML = ''; // Clear any existing preview
      if (!previewData || previewData.length === 0) {
        previewArea.textContent = 'No data to preview.';
        return;
      }
      
      const table = document.createElement('table');
      table.border = 1;
      
      // Create a header row using keys from the first record
      const headerRow = document.createElement('tr');
      Object.keys(previewData[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);
      
      // Create data rows
      previewData.forEach(record => {
        const tr = document.createElement('tr');
        Object.values(record).forEach(value => {
          const td = document.createElement('td');
          td.textContent = value;
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
      
      previewArea.appendChild(table);
    }
  });
  