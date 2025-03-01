import sqlite3

def verify_user_input(database, table, column, user_input):
    """
    Verify if the user input exists in the specified column of the table.
    
    :param database: Path to the SQLite3 database file.
    :param table: Table name to query.
    :param column: Column name to check the user input against.
    :param user_input: The value to verify.
    :return: Boolean indicating whether the input exists.
    """
    try:
        conn = sqlite3.connect(database)
        cursor = conn.cursor()
        
        query = f"SELECT COUNT(*) FROM {table} WHERE {column} = ?"
        cursor.execute(query, (user_input,))
        
        result = cursor.fetchone()
        return result[0] > 0
    
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return False
    
    finally:
        conn.close()

# Example usage
database_path = "students.db"

table_name = "students"
column_name = "ROLL"  # Check against roll number
user_input_value = input("Enter your Roll Number: ")

if verify_user_input(database_path, table_name, column_name, user_input_value):
    print("current student")
else:
    print("ex student")
