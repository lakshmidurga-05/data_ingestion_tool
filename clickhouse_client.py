from clickhouse_driver import Client

def get_client(host, port, database, user, jwt_token):
    # Here, the JWT token is used as the "password".
    client = Client(
        host=host,
        port=port,
        database=database,
        user=user,
        password=jwt_token,  # Adjust based on your ClickHouse client configuration for JWT.
        secure=(int(port) in [9440, 8443])  # Use secure connection if the port indicates HTTPS.
    )
    return client

def fetch_tables(client):
    # Execute "SHOW TABLES" to retrieve a list of tables.
    result = client.execute("SHOW TABLES")
    # Assuming the result is like [('table1',), ('table2',)], extract the table names.
    return [row[0] for row in result]

def fetch_columns(client, table_name):
    # Execute DESCRIBE TABLE to obtain table schema details.
    result = client.execute(f"DESCRIBE TABLE {table_name}")
    # Extract and return only the column names from the schema description.
    return [row[0] for row in result]

def execute_select_query(client, table, columns, batch_size, output_file):
    # Build the SQL query string.
    query = f"SELECT {', '.join(columns)} FROM {table}"
    total_count = 0
    with open(output_file, 'w') as f:
        # Process rows in batches using the ClickHouse client's iterator.
        for batch in client.execute_iter(query, query_id='ingest_job'):
            for row in batch:
                # Convert each row to a comma-separated string.
                # If the result row is a single value (an int) instead of a tuple, consider wrapping it:
                if not isinstance(row, (tuple, list)):
                    row = (row,)
                line = ",".join(str(item) for item in row)
                f.write(line + "\n")
                total_count += 1
    return total_count
