from flask import Flask, render_template, request, jsonify
from clickhouse_client import get_client, fetch_tables, fetch_columns, execute_select_query
from flat_file_handler import read_csv_file, batch_insert_into_clickhouse, preview_csv_file

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

# Endpoint: Connect to ClickHouse and retrieve tables
@app.route('/connect_clickhouse', methods=['POST'])
def connect_clickhouse():
    params = request.json
    try:
        client = get_client(params['host'], params['port'], params['database'],
                              params['user'], params['jwt_token'])
        tables = fetch_tables(client)
        return jsonify(success=True, tables=tables)
    except Exception as ex:
        return jsonify(success=False, error=str(ex))

# Endpoint: Retrieve columns for a specific table in ClickHouse
@app.route('/fetch_columns', methods=['POST'])
def fetch_columns_endpoint():
    data = request.json
    try:
        client = get_client(data['host'], data['port'], data['database'],
                              data['user'], data['jwt_token'])
        columns = fetch_columns(client, data['table'])
        return jsonify(success=True, columns=columns)
    except Exception as ex:
        return jsonify(success=False, error=str(ex))

# Endpoint: Ingest data from ClickHouse to a Flat File (CSV)
@app.route('/ingest_clickhouse_to_file', methods=['POST'])
def ingest_ch_to_file():
    data = request.json
    try:
        client = get_client(data['host'], data['port'], data['database'],
                              data['user'], data['jwt_token'])
        count = execute_select_query(client, data['table'], data['columns'],
                                     data.get('batch_size', 1000), output_file=data['output_file'])
        return jsonify(success=True, count=count)
    except Exception as ex:
        return jsonify(success=False, error=str(ex))

# Endpoint: Ingest data from a Flat File (CSV) into ClickHouse
@app.route('/ingest_file_to_clickhouse', methods=['POST'])
def ingest_file_to_ch():
    data = request.json
    try:
        # Read CSV file data using the provided file path and delimiter
        records = read_csv_file(data['file_path'], delimiter=data.get('delimiter', ','))
        # Filter the records to include only the columns selected in the UI
        filtered_records = [{col: rec[col] for col in data['columns']} for rec in records]
        
        client = get_client(data['host'], data['port'], data['database'],
                              data['user'], data['jwt_token'])
        count = batch_insert_into_clickhouse(client, data['target_table'], filtered_records, batch_size=500)
        return jsonify(success=True, count=count)
    except Exception as ex:
        return jsonify(success=False, error=str(ex))

# Optional Enhancement: Preview CSV File Data (first 100 rows)
@app.route('/preview_file_data', methods=['POST'])
def preview_file_data():
    data = request.json
    try:
        preview = preview_csv_file(data['file_path'], delimiter=data.get('delimiter', ','), n_rows=100)
        return jsonify(success=True, preview=preview)
    except Exception as ex:
        return jsonify(success=False, error=str(ex))

# Optional Bonus: Ingest data from multiple tables with a JOIN (Multi-Table Join)
@app.route('/ingest_multi_table', methods=['POST'])
def ingest_multi_table():
    data = request.json
    try:
        # Expected keys: "tables" (list), "join_condition" (string), "columns" (list),
        # "output_file", "host", "port", "database", "user", "jwt_token", and optionally "batch_size"
        client = get_client(data['host'], data['port'], data['database'],
                            data['user'], data['jwt_token'])
        tables = data['tables']  # e.g., ["table1", "table2"]
        join_condition = data['join_condition']  # e.g., "table1.id = table2.id"
        columns = data['columns']  # e.g., ["table1.id", "table1.name", "table2.value"]
        
        # Construct the dynamic JOIN query
        query = f"SELECT {', '.join(columns)} FROM {tables[0]} JOIN {tables[1]} ON {join_condition}"
        
        # In this example, we reuse execute_select_query to export the join result to a CSV.
        total_count = execute_select_query(client, query, columns, data.get('batch_size', 1000), output_file=data['output_file'])
        return jsonify(success=True, count=total_count)
    except Exception as ex:
        return jsonify(success=False, error=str(ex))

if __name__ == '__main__':
    app.run(debug=True)
