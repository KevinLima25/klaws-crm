import sqlite3, json
conn = sqlite3.connect(r'C:\Users\User\Downloads\Waha N&N\n8n\data\database.sqlite')
cursor = conn.cursor()
cursor.execute('SELECT connections FROM workflow_entity WHERE id = ?', ('WFCRM001chat01',))
row = cursor.fetchone()
conns = json.loads(row[0])
for src, tgt in conns.items():
    print(src + ':')
    for k, v in tgt.items():
        for conn in v:
            for c in conn:
                print('  ' + k + ' -> ' + c['node'] + ' (' + c['type'] + ')')