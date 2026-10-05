# Sobe a lista de influenciadoras da feira (data/feira/*.xlsx) como creators UGC no Supabase.
# Junta por @ do Instagram; descarta a planilha "nails AH" (cópia antiga com nome x @ desalinhados).
# Uso: python scripts/importar-feira.py           (só mostra o resumo)
#      python scripts/importar-feira.py --apply   (insere os novos e completa os que já existem)
import json, re, sys, os, urllib.request
sys.stdout.reconfigure(encoding='utf-8')
import openpyxl
D = 'data/feira/'
def rows(f):
    ws = openpyxl.load_workbook(D + f, read_only=True, data_only=True).worksheets[0]
    rs = [r for r in ws.iter_rows(values_only=True) if any(c not in (None, '') for c in r)]
    h = [str(c or '').strip() for c in rs[1]]
    return [{k.strip().lower(): (str(v).strip() if v is not None else '') for k, v in zip(h, r)} for r in rs[2:]]
def handle(v):
    v = v.lower(); m = re.search(r'instagram\.com/([\w.]+)', v)
    v = (m.group(1) if m else v).lstrip('@').strip().strip('/')
    return v if re.fullmatch(r'[a-z0-9_.]{2,30}', v) else ''
def seg(v):
    s = re.sub(r'\D', '', v.split(',')[0])
    n = int(s) if s else 0
    return n if n < 5_000_000 else 0  # número de telefone colado no campo de seguidores
UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split()
def uf(v):
    v = v.upper()
    m = re.findall(r'\b(' + '|'.join(UFS) + r')\b', v)
    return m[-1] if m else ('GO' if 'GOIAS' in v or 'GOIÁS' in v else '')
def cidade_do_end(e):
    m = re.search(r'-\s*([^-–]+?)\s*[-–]\s*[A-Z]{2}\b', e)
    return m.group(1).strip() if m else ''
CAT = {'manicure': 'Manicure', 'influencer (unha)': 'Unhas', 'infuencer (unha)': 'Unhas', 'podologa': 'Podologia', 'podologo': 'Podologia'}

reg = []
for r in rows('LISTA FINAL - Caco- Berry Kiss  completa 003.xlsx'):
    reg.append(dict(nome=r['nome'], ig=handle(r['instagram']) or handle(r['veiculo']), seg=seg(r['inscritos instagram']), email=(r['email'] or r['email2']).lower(),
                    tel=r['celular'] or r['telefone'], cidade=r['cidade'], uf=uf(r['uf']), cat='', fonte='Berry Kiss'))
for r in rows('lista de Parceiras Atualizadas_ resumo so influenciadoras.xlsx'):
    e = next((v for k, v in r.items() if k.startswith('ende')), '')
    reg.append(dict(nome=r['nome'], ig=handle(r['instagram']), seg=seg(r['seguidores']), email='', tel='', cidade=cidade_do_end(e), uf=uf(e), cat=CAT.get(r['categoria'].lower(), r['categoria']), fonte='Parceiras'))
for r in rows('lsita de parceiras  1_2_3_4_0002.xlsx'):
    reg.append(dict(nome=r['nome'], ig=handle(r['instagran']), seg=seg(r['n. seguidores']), email='', tel=r['tel'], cidade='', uf=uf(r['estado']) or uf(next((v for k, v in r.items() if k.startswith('ende')), '')), cat='', fonte='Parceiras 1-4'))

por_ig = {}
for x in reg:
    if not x['ig']: continue
    y = por_ig.setdefault(x['ig'], dict(x, fontes=set()))
    for k in ('nome', 'email', 'tel', 'cidade', 'uf', 'cat'):
        y[k] = y[k] or x[k]
    y['seg'] = max(y['seg'], x['seg']); y['fontes'].add(x['fonte'])
import unicodedata
nm = lambda t: re.sub(r'\s+', ' ', unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode().lower()).strip()
com_ig = {nm(x['nome']) for x in por_ig.values()}
sem_ig = {}
for x in reg:  # sem @: entra pelo nome, sem repetir quem já entrou pelo Instagram
    if x['ig'] or not x['nome'] or nm(x['nome']) in com_ig: continue
    y = sem_ig.setdefault(nm(x['nome']), dict(x, fontes=set()))
    for k in ('email', 'tel', 'cidade', 'uf', 'cat'):
        y[k] = y[k] or x[k]
    y['seg'] = max(y['seg'], x['seg']); y['fontes'].add(x['fonte'])
sem_ig = list(sem_ig.values())
L = sorted(por_ig.values(), key=lambda x: -x['seg'])
print(f"linhas lidas: {len(reg)} | com Instagram: {len(L)} únicas | sem Instagram (entram pelo nome): {len(sem_ig)}")
print(f"com e-mail: {sum(1 for x in L if x['email'])} | com WhatsApp: {sum(1 for x in L if x['tel'])} | com UF: {sum(1 for x in L if x['uf'])}")
for x in L[:5]: print('  ', x['ig'], x['seg'], x['nome'], x['uf'], x['cat'])

if '--apply' in sys.argv:
    env = dict(l.strip().split('=', 1) for l in open('.env', encoding='utf8') if '=' in l and not l.startswith('#'))
    URL, KEY = env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']
    H = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'}
    def call(method, path, body=None):
        req = urllib.request.Request(URL + '/rest/v1/' + path, method=method, headers=H, data=json.dumps(body).encode() if body is not None else None)
        with urllib.request.urlopen(req) as r: return json.loads(r.read() or 'null')
    existentes = {}
    for i in range(0, 100000, 1000):
        H['Range'] = f'{i}-{i + 999}'
        page = call('GET', 'creators?select=id,instagram,tags,email,phone,city,state&instagram=neq.')
        for c in page: existentes[c['instagram'].lstrip('@').lower()] = c
        if len(page) < 1000: break
    H.pop('Range')
    tier = lambda n: 'macro 1M+' if n >= 1e6 else 'médio 100k-1M' if n >= 1e5 else 'micro até 100k'
    novos, atual = [], 0
    for x in L:
        tags = ['UGC', 'origem:feira-influence', tier(x['seg'])] + ([x['cat']] if x['cat'] else [])
        c = existentes.get(x['ig'])
        if c:  # já na base: só marca a origem e completa o que faltar, sem sobrescrever
            patch = {'tags': sorted(set((c['tags'] or []) + tags))}
            for k, v in (('email', x['email']), ('phone', x['tel']), ('city', x['cidade']), ('state', x['uf'])):
                if v and not c.get(k): patch[k] = v
            call('PATCH', f"creators?id=eq.{c['id']}", patch); atual += 1
            continue
        novos.append(dict(professional_name=x['nome'] or x['ig'], bio='', city=x['cidade'], state=x['uf'], instagram='@' + x['ig'], tiktok='',
                          instagram_followers=x['seg'], engagement_rate=0, operational_score=0, tags=tags, specialties=[x['cat']] if x['cat'] else [],
                          email=x['email'] or None, phone=x['tel'] or None, media_kit_url=f"https://www.instagram.com/{x['ig']}", verification_status='unverified'))
    H['Range'] = '0-0'
    ja_feira = set()
    for i in range(0, 100000, 1000):
        H['Range'] = f'{i}-{i + 999}'
        page = call('GET', 'creators?select=professional_name&instagram=eq.&tags=cs.{origem:feira-influence}')
        ja_feira |= {nm(c['professional_name']) for c in page}
        if len(page) < 1000: break
    H.pop('Range')
    for x in sem_ig:
        if nm(x['nome']) in ja_feira: continue
        tags = ['UGC', 'origem:feira-influence', 'sem Instagram'] + ([tier(x['seg'])] if x['seg'] else []) + ([x['cat']] if x['cat'] else [])
        novos.append(dict(professional_name=x['nome'], bio='', city=x['cidade'], state=x['uf'], instagram='', tiktok='',
                          instagram_followers=x['seg'], engagement_rate=0, operational_score=0, tags=tags, specialties=[x['cat']] if x['cat'] else [],
                          email=x['email'] or None, phone=x['tel'] or None, media_kit_url=None, verification_status='unverified'))
    for i in range(0, len(novos), 200): call('POST', 'creators', novos[i:i + 200])
    print(f'supabase: {len(novos)} novos inseridos | {atual} já existiam (marcados como feira e completados)')
