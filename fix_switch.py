import sqlite3, json
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()
cursor.execute('SELECT nodes FROM workflow_entity WHERE name LIKE ?', ('%CRM%',))
row = cursor.fetchone()
nodes = json.loads(row[0])

# Find and fix Master Router (Switch)
for n in nodes:
    if n['name'] == 'Master Router (Switch)':
        n['parameters'] = {
            "conditions": {
                "string": [
                    {
                        "value1": "={{ $json.file_type }}",
                        "operation": "equal",
                        "value2": "image"
                    },
                    {
                        "value1": "={{ $json.file_type }}",
                        "operation": "equal",
                        "value2": "pdf"
                    },
                    {
                        "value1": "={{ $json.file_type }}",
                        "operation": "equal",
                        "value2": "spreadsheet"
                    }
                ]
            }
        }
        n['typeVersion'] = 3
        print('Fixed Master Router parameters:', json.dumps(n['parameters'], indent=2))

# Save
cursor.execute('UPDATE workflow_entity SET nodes = ? WHERE name LIKE ?', (json.dumps(nodes), '%CRM%'))
conn.commit()
print('Saved!')