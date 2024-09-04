import psycopg2
from faker import Faker

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname="asset_library",  # Replace with your database name
    user="postgres",            # Replace with your PostgreSQL username
    password="mysecretpassword",    # Replace with your PostgreSQL password
    host="localhost",            # Replace with your PostgreSQL host if different
    port="5433"                  # Replace with your PostgreSQL port if different
)
cur = conn.cursor()

# Generate fake data
fake = Faker()

# Insert asset types
asset_types = ['Platforms', 'Products', 'Applications', 'Solutions', 'Tools', 'Standards']
cur.executemany("INSERT INTO asset_type (name) VALUES (%s)", [(t,) for t in asset_types])

# Insert assets and asset fields
for _ in range(1000):  # Adjust this range to control the amount of data
    cur.execute("INSERT INTO assets (asset_type_id, name) VALUES (%s, %s) RETURNING id", (fake.random_int(min=1, max=6), fake.company()))
    asset_id = cur.fetchone()[0]
    for _ in range(10):  # 10 fields per asset
        cur.execute(
            "INSERT INTO asset_fields (asset_id, field_name, field_value) VALUES (%s, %s, %s)",
            (asset_id, fake.word(), fake.text(max_nb_chars=200))
        )

# Commit and close
conn.commit()
cur.close()
conn.close()
