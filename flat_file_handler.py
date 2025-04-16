import csv

def read_csv_file(file_path, delimiter=','):
    records = []
    with open(file_path, newline='') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=delimiter)
        for row in reader:
            # Convert specific columns from string to integer.
            try:
                row['id'] = int(row['id'])
                row['age'] = int(row['age'])
            except (ValueError, KeyError) as e:
                print(f"Skipping row due to conversion error: {row}. Error: {e}")
                continue
            records.append(row)
    return records

def batch_insert_into_clickhouse(client, table, records, batch_size=500):
    total_inserted = 0
    # Process the records in batches.
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        if batch:
            # For the first record, get the column names.
            columns = list(batch[0].keys())
            # Create a list of tuples with the record data.
            data = [tuple(rec[col] for col in columns) for rec in batch]
            query = f"INSERT INTO {table} ({', '.join(columns)}) VALUES"
            client.execute(query, data)
            total_inserted += len(batch)
    return total_inserted

def preview_csv_file(file_path, delimiter=',', n_rows=100):
    """
    Reads the first n_rows from the CSV file and returns them as a list of dictionaries.
    Assumes the CSV file includes a header row.
    """
    records = []
    with open(file_path, newline='') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=delimiter)
        for i, row in enumerate(reader):
            if i >= n_rows:
                break
            try:
                row['id'] = int(row['id'])
                row['age'] = int(row['age'])
            except (ValueError, KeyError):
                # If conversion fails, leave these as strings.
                pass
            records.append(row)
    return records
