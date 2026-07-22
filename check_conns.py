import sqlite3, json
conn = sqlite3.connect('C:/Users/User/Downloads/Waha N&N/n8n/data/database.sqlite')
cursor = conn.cursor()
cursor.execute('SELECT connections FROM workflow_entity WHERE name LIKE ?', ('%CRM%',))
row = cursor.fetchone()
conns = json.loads(row[0])
for src, targets in conns.items():
    if 'Buffer' in src or 'Router' in src or 'Switch' in src or 'Master' in src:
        print(src + ':')
        for k, v in targets.items():
            for conn in v:
                for c in conn:
                    print('  ' + k + ' -> ' + c['node'] + ' (' + c['type'] + ')')