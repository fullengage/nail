"""Mapeia o mercado de PDVs a partir dos DADOS ABERTOS DO CNPJ (Receita Federal).

Recorte: estabelecimentos ATIVOS, CNAE principal de interesse, sem MEI, Brasil inteiro.
Fonte: https://arquivos.receitafederal.gov.br/index.php/s/YggdBLfdninEJX9  (WebDAV: public.php/dav/files/YggdBLfdninEJX9/AAAA-MM/)
Lê direto de dentro dos .zip (sem descompactar) em data/receita/.

Uso:
  python scripts/mapear-pdvs.py              # gera data/receita/pdvs_mapeados.csv + resumo
  python scripts/mapear-pdvs.py --load       # envia o CSV para public.retail_points (Supabase, .env)
  python scripts/mapear-pdvs.py --redes 10 --load   # só redes com 10+ lojas (recorte usado no painel)
"""
import csv, glob, io, json, os, sys, time, zipfile, urllib.request
from collections import Counter

ROOT = os.path.join(os.path.dirname(__file__), '..')
DIR = os.path.join(ROOT, 'data', 'receita')
OUT = os.path.join(DIR, 'pdvs_mapeados.csv')

# CNAE principal → tipo usado no painel
CNAES = {
    '4772500': 'cosmetics',   # Comércio varejista de cosméticos, perfumaria e higiene pessoal
    '4771701': 'pharmacy',    # Farmácia sem manipulação
    '4771702': 'pharmacy',    # Farmácia com manipulação
    '4771703': 'pharmacy',    # Farmácia homeopática
    '9602501': 'salon',       # Cabeleireiros, manicure e pedicure
    '9602502': 'salon',       # Atividades de estética e outros serviços de beleza
    '4646001': 'distributor', # Atacado de cosméticos e perfumaria
    '4644301': 'distributor', # Atacado de medicamentos
}

csv.field_size_limit(10**9)


def rows(pattern):
    """Itera as linhas (lista de campos) de todos os .zip que casam com o padrão."""
    for path in sorted(glob.glob(os.path.join(DIR, pattern))):
        with zipfile.ZipFile(path) as z:
            for name in z.namelist():
                with z.open(name) as f:
                    for r in csv.reader(io.TextIOWrapper(f, encoding='latin-1', newline=''), delimiter=';', quotechar='"'):
                        yield r
        print(f'  lido {os.path.basename(path)}', flush=True)


def title(s):
    small = {'de', 'da', 'do', 'das', 'dos', 'e'}
    out = []
    for i, w in enumerate((s or '').strip().lower().split()):
        out.append(w if (i and w in small) else w[:1].upper() + w[1:])
    return ' '.join(out)


def phone(ddd, num):
    d = ''.join(ch for ch in (ddd or '') + (num or '') if ch.isdigit())
    if len(d) == 10:
        return f'({d[:2]}) {d[2:6]}-{d[6:]}'
    if len(d) == 11:
        return f'({d[:2]}) {d[2:7]}-{d[7:]}'
    return ''


def build():
    t0 = time.time()
    muni = {r[0]: r[1] for r in rows('Municipios.zip') if len(r) >= 2}
    print(f'municípios: {len(muni)}')

    # 1) estabelecimentos ativos (situação 02) com CNAE principal de interesse
    est = []
    for r in rows('Estabelecimentos*.zip'):
        if len(r) < 28 or r[5] != '02' or r[11] not in CNAES:
            continue
        est.append(r)
    basicos = {r[0] for r in est}
    print(f'estabelecimentos no recorte (com MEI): {len(est)} | empresas: {len(basicos)}')

    # 2) MEI: Simples.zip, coluna opcao_pelo_mei = 'S' (e sem data de exclusão)
    mei = set()
    for r in rows('Simples.zip'):
        if len(r) >= 7 and r[0] in basicos and r[4] == 'S' and not (r[6] or '').strip('0'):
            mei.add(r[0])
    print(f'MEIs removidos: {len(mei)}')

    # 3) razão social: Empresas*.zip
    razao = {}
    for r in rows('Empresas*.zip'):
        if len(r) >= 2 and r[0] in basicos and r[0] not in mei:
            razao[r[0]] = r[1]

    stats_tipo, stats_uf = Counter(), Counter()
    with open(OUT, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(['cnpj', 'name', 'trade_name', 'network', 'type', 'cnae', 'city', 'state', 'address', 'phone', 'email', 'matriz', 'inicio_atividade'])
        for r in est:
            if r[0] in mei:
                continue
            cnpj = f'{r[0]}{r[1]}{r[2]}'
            cnpj_fmt = f'{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}'
            rs = title(razao.get(r[0], ''))
            fantasia = title(r[4]) if len((r[4] or '').strip('-.*_ ')) > 1 else ''  # Receita traz '-' como fantasia às vezes
            num = r[15] if r[15] and r[15].upper() != 'S/N' else ''
            addr = ', '.join(x for x in [title(f'{r[13]} {r[14]}'.strip()), num, title(r[16]), title(r[17]), f'CEP {r[18][:5]}-{r[18][5:]}' if len(r[18]) == 8 else ''] if x)
            tipo = CNAES[r[11]]
            w.writerow([cnpj_fmt, fantasia or rs, rs or fantasia, fantasia or rs, tipo, r[11], title(muni.get(r[20], '')), r[19], addr,
                        phone(r[21], r[22]), (r[27] or '').strip().lower(), 'matriz' if r[3] == '1' else 'filial', r[10]])
            stats_tipo[tipo] += 1
            stats_uf[r[19]] += 1

    total = sum(stats_tipo.values())
    resumo = {'total': total, 'por_tipo': dict(stats_tipo.most_common()), 'por_uf': dict(stats_uf.most_common()), 'mei_removidos': len(mei),
              'fonte': 'Receita Federal - Dados Abertos CNPJ 2026-09', 'gerado_em': time.strftime('%Y-%m-%d %H:%M')}
    json.dump(resumo, open(os.path.join(DIR, 'resumo.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(resumo, ensure_ascii=False, indent=1))
    print(f'ok em {round(time.time() - t0)}s -> {OUT}')


def redes(min_lojas=10):
    """Recorte 'só redes': empresas (8 primeiros dígitos do CNPJ) com min_lojas+ estabelecimentos.
    Todas as lojas recebem o nome da rede da matriz (nome fantasia), para agrupar no painel."""
    from collections import Counter
    rows_ = list(csv.DictReader(open(OUT, encoding='utf-8')))
    cnt, nome = Counter(), {}
    for r in rows_:
        b = r['cnpj'][:10]
        cnt[b] += 1
        if b not in nome or r['matriz'] == 'matriz':
            nome[b] = r['network'] or r['trade_name']
    keep = {b for b, c in cnt.items() if c >= min_lojas}
    out = os.path.join(DIR, 'pdvs_redes.csv')
    with open(out, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows_[0].keys()))
        w.writeheader()
        for r in rows_:
            b = r['cnpj'][:10]
            if b in keep:
                r['network'] = nome[b]
                w.writerow(r)
    print(f'redes com {min_lojas}+ lojas: {len(keep)} redes, {sum(cnt[b] for b in keep)} lojas -> {out}')
    return out


def load(path=None):
    """Envia para Supabase em lotes de 1000, pulando CNPJs que já existem."""
    env = {}
    for line in open(os.path.join(ROOT, '.env'), encoding='utf-8'):
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1)
            env[k] = v.strip().strip('"')
    url, key = env['VITE_SUPABASE_URL'].rstrip('/'), (env.get('SUPABASE_SERVICE_ROLE_KEY') or env['VITE_SUPABASE_ANON_KEY'])
    H = {'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}

    def req(method, path, body=None, extra=None):
        r = urllib.request.Request(url + '/rest/v1/' + path, data=json.dumps(body).encode() if body is not None else None, method=method, headers={**H, **(extra or {})})
        with urllib.request.urlopen(r, timeout=120) as resp:
            return resp.read(), resp.headers

    existing, start = set(), 0
    while True:
        data, _ = req('GET', f'retail_points?select=cnpj&cnpj=not.is.null&order=cnpj&limit=1000&offset={start}')
        page = json.loads(data)
        existing.update(p['cnpj'] for p in page)
        if len(page) < 1000:
            break
        start += 1000
    print(f'já no banco: {len(existing)}')

    batch, sent = [], 0
    def flush():
        nonlocal batch, sent
        if not batch:
            return
        for attempt in range(5):
            try:
                req('POST', 'retail_points', batch, {'Prefer': 'return=minimal'})
                break
            except Exception as e:  # rede instável: tenta de novo
                if attempt == 4:
                    raise
                time.sleep(3 * (attempt + 1))
        sent += len(batch)
        batch = []
        if sent % 20000 == 0:
            print(f'  enviados {sent}', flush=True)

    with open(path or OUT, encoding='utf-8') as f:
        for r in csv.DictReader(f):
            if r['cnpj'] in existing or not r['city'] or not r['state']:
                continue
            batch.append({'name': r['name'], 'trade_name': r['trade_name'], 'network': r['network'], 'cnpj': r['cnpj'], 'type': r['type'],
                          'city': r['city'], 'state': r['state'], 'address': r['address'] or None, 'phone': r['phone'] or None,
                          'email': r['email'] or None, 'status': 'active'})
            if len(batch) == 1000:
                flush()
    flush()
    print(f'ok: {sent} PDVs enviados ao Supabase')


if __name__ == '__main__':
    # --redes N: só redes com N+ lojas (padrão 10); combine com --load para enviar o recorte
    n = int(sys.argv[sys.argv.index('--redes') + 1]) if '--redes' in sys.argv else None
    if '--load' in sys.argv:
        load(redes(n) if n else None)
    elif n:
        redes(n)
    else:
        build()
