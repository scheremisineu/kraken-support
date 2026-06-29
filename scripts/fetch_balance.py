import subprocess, json, time, uuid, os
from datetime import datetime, timezone

ts = int(time.time() * 1000)
pubkey = uuid.uuid4().hex
cookie_jar = '/tmp/p24cookies.txt'

headers = [
    '-H', 'content-type: application/json',
    '-H', 'origin: https://next.privat24.ua',
    '-H', 'referer: https://next.privat24.ua/send/18p5n',
]

def post(url, data, use_jar=False):
    cmd = ['curl', '-s', '-c', cookie_jar]
    if use_jar:
        cmd += ['-b', cookie_jar]
    else:
        cmd += ['-b', f'pubkey={pubkey}']
    cmd += headers + ['--data-raw', json.dumps(data), url]
    return json.loads(subprocess.check_output(cmd))

try:
    init = post(f'https://next.privat24.ua/api/p24/init?lang=ua&_={ts}', {'lang': 'ua', '_': ts})
    xref = init['data']['xref']

    ziplink = post('https://next.privat24.ua/api/p24/pub/ziplink',
        {'action': 'get', 'hash': '18p5n', 'type': 'sharing', 'xref': xref, '_': ts}, use_jar=True)
    refenv = json.loads(ziplink['data']['value'])['payload']['refEnv']

    pubinfo = post('https://next.privat24.ua/api/p24/pub/envelopes/pubinfo',
        {'xref': xref, 'refEnv': refenv, '_': ts}, use_jar=True)

    amount = pubinfo['data']['availableBalance']
    print(f'Amount: {amount}')

    os.makedirs('data', exist_ok=True)
    with open('data/collected.json', 'w') as f:
        updated = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        json.dump({'collected': float(amount), 'updated': updated}, f)

except Exception as e:
    print(f'Error: {e}')
    exit(0)
