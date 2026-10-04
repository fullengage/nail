"""Benchmarking dos ATACADOS E DISTRIBUIDORES (dados abertos CNPJ da Receita, data/receita/*.zip).

Recorte: CNAE principal 4646-0/01 (atacado de cosméticos e perfumaria) e 4644-3/01 (atacado de
medicamentos), estabelecimentos ATIVOS, sem MEI. Tudo local: nenhuma API externa, sem risco de bloqueio.

Roda em etapas com checkpoint em data/receita/bench/ (pode parar e rodar de novo: pula o que já fez):
  1. estabelecimentos do recorte + todas as unidades (qualquer CNAE) dessas empresas
  2. empresas: razão social, porte, capital social, natureza jurídica
  3. Simples / MEI
  4. relatório Excel: data/benchmark_atacado_<data>.xlsx

Uso: python scripts/benchmark-atacado.py            (todas as etapas pendentes)
     python scripts/benchmark-atacado.py --refazer  (apaga checkpoints e refaz)
"""
import csv, glob, io, json, os, pickle, re, shutil, sys, time, zipfile
from collections import Counter, defaultdict

ROOT = os.path.join(os.path.dirname(__file__), '..')
DIR = os.path.join(ROOT, 'data', 'receita')
CK = os.path.join(DIR, 'bench')
CNAES_ALVO = {'4646001': 'Atacado de cosméticos e perfumaria', '4644301': 'Atacado de medicamentos'}
PORTE = {'00': 'Não informado', '01': 'Microempresa (ME)', '03': 'Empresa de Pequeno Porte (EPP)', '05': 'Demais (médio/grande)'}
FREE_MAIL = re.compile(r'@(gmail|hotmail|outlook|yahoo|live|uol|bol|terra|ig|icloud|msn|globo|r7|zipmail|oi)\.', re.I)
csv.field_size_limit(10**9)


def rows(pattern):
    for path in sorted(glob.glob(os.path.join(DIR, pattern))):
        with zipfile.ZipFile(path) as z:
            for name in z.namelist():
                with z.open(name) as f:
                    yield from csv.reader(io.TextIOWrapper(f, encoding='latin-1', newline=''), delimiter=';', quotechar='"')
        print(f'    lido {os.path.basename(path)}', flush=True)


def step(name, fn):
    """Executa uma etapa uma única vez; o resultado fica salvo em disco (checkpoint)."""
    path = os.path.join(CK, f'{name}.pkl')
    if os.path.exists(path):
        print(f'[{name}] já feito (checkpoint)')
        return pickle.load(open(path, 'rb'))
    t = time.time()
    print(f'[{name}] processando...', flush=True)
    out = fn()
    pickle.dump(out, open(path, 'wb'))
    print(f'[{name}] ok em {round(time.time() - t)}s')
    return out


def title(s):
    small = {'de', 'da', 'do', 'das', 'dos', 'e'}
    return ' '.join(w if (i and w in small) else w[:1].upper() + w[1:] for i, w in enumerate((s or '').strip().lower().split()))


def e1_estabelecimentos():
    alvo, unidades = [], defaultdict(list)
    # 1ª leitura: estabelecimentos do recorte
    for r in rows('Estabelecimentos*.zip'):
        if len(r) < 28 or r[5] != '02':
            continue
        if r[11] in CNAES_ALVO:
            alvo.append(r)
    basicos = {r[0] for r in alvo}
    # segunda leitura só para as unidades dessas empresas (qualquer CNAE): cobertura e nº de filiais reais
    for r in rows('Estabelecimentos*.zip'):
        if len(r) >= 28 and r[5] == '02' and r[0] in basicos:
            unidades[r[0]].append((r[19], r[20], r[11], r[3]))
    return {'alvo': alvo, 'unidades': dict(unidades)}


def e2_empresas(basicos):
    emp = {}
    for r in rows('Empresas*.zip'):
        if len(r) >= 7 and r[0] in basicos:
            emp[r[0]] = {'razao': r[1], 'natureza': r[2], 'capital': float((r[4] or '0').replace(',', '.') or 0), 'porte': r[5]}
    return emp


def e3_simples(basicos):
    out = {}
    for r in rows('Simples.zip'):
        if len(r) >= 7 and r[0] in basicos:
            ativo = lambda d: not (d or '').strip('0')
            out[r[0]] = {'simples': r[1] == 'S' and ativo(r[3]), 'mei': r[4] == 'S' and ativo(r[6])}
    return out


def table(zipname):
    return {r[0]: r[1] for r in rows(zipname) if len(r) >= 2}


def main():
    if '--refazer' in sys.argv and os.path.isdir(CK):
        shutil.rmtree(CK)
    os.makedirs(CK, exist_ok=True)

    est = step('1_estabelecimentos', e1_estabelecimentos)
    basicos = {r[0] for r in est['alvo']}
    emp = step('2_empresas', lambda: e2_empresas(basicos))
    simp = step('3_simples', lambda: e3_simples(basicos))
    muni = table('Municipios.zip')
    cnae_desc = table('Cnaes.zip')
    nat_desc = table('Naturezas.zip')

    import pandas as pd
    hoje = time.strftime('%Y%m%d')
    anos = lambda d: round((int(hoje[:4]) - int(d[:4])) + (int(hoje[4:6]) - int(d[4:6])) / 12, 1) if d and len(d) == 8 else None

    # ---------- estabelecimentos (sem MEI) ----------
    linhas = []
    for r in est['alvo']:
        if simp.get(r[0], {}).get('mei'):
            continue
        e = emp.get(r[0], {})
        email = (r[27] or '').strip().lower()
        dominio = '' if not email or FREE_MAIL.search(email) else email.split('@')[-1]
        sec = [c for c in (r[12] or '').split(',') if c]
        linhas.append({
            'CNPJ': f'{r[0]}{r[1]}{r[2]}', 'CNPJ raiz': r[0], 'Matriz/filial': 'Matriz' if r[3] == '1' else 'Filial',
            'Nome fantasia': title(r[4]) if len((r[4] or '').strip('-.*_ ')) > 1 else '', 'Razão social': title(e.get('razao', '')),
            'Segmento': CNAES_ALVO[r[11]], 'CNAE principal': r[11],
            'CNAEs secundários (qtde)': len(sec), 'CNAEs secundários': '; '.join(f'{c} {cnae_desc.get(c, "")}' for c in sec[:12]),
            'Abertura': f'{r[10][6:8]}/{r[10][4:6]}/{r[10][:4]}' if len(r[10]) == 8 else '', 'Anos de mercado': anos(r[10]),
            'Cidade': title(muni.get(r[20], '')), 'UF': r[19], 'Bairro': title(r[17]), 'CEP': r[18],
            'Endereço': ', '.join(x for x in [title(f'{r[13]} {r[14]}'), r[15] if r[15] != 'S/N' else '', title(r[16])] if x),
            'Telefone': ''.join(c for c in r[21] + r[22] if c.isdigit()), 'E-mail': email, 'Site provável': dominio and f'www.{dominio}',
        })
    df = pd.DataFrame(linhas)

    # ---------- empresas (1 linha por CNPJ raiz) ----------
    g = df.groupby('CNPJ raiz')
    empresas = []
    for b, sub in g:
        e = emp.get(b, {})
        uni = est['unidades'].get(b, [])
        ufs = Counter(u[0] for u in uni)
        mat = sub[sub['Matriz/filial'] == 'Matriz']
        m = (mat if len(mat) else sub).iloc[0]
        empresas.append({
            'Empresa': m['Nome fantasia'] or m['Razão social'], 'Razão social': m['Razão social'], 'CNPJ raiz': b,
            'Segmento': sub['Segmento'].value_counts().index[0],
            'Porte': PORTE.get(e.get('porte', '00'), 'Não informado'), 'Capital social (R$)': e.get('capital', 0.0),
            'Natureza jurídica': nat_desc.get(e.get('natureza', ''), e.get('natureza', '')),
            'Simples Nacional': 'Sim' if simp.get(b, {}).get('simples') else 'Não',
            'Anos de mercado': sub['Anos de mercado'].max(),  # unidade de atacado mais antiga
            'Unidades de atacado': len(sub), 'Unidades totais (qualquer CNAE)': len(uni),
            'Foco no atacado (%)': round(100 * len(sub) / max(len(uni), 1)),
            'Estados de atuação': len(ufs), 'UFs': ', '.join(u for u, _ in ufs.most_common()),
            'Cidades': len({(u[0], u[1]) for u in uni}),
            'Tem varejo próprio': 'Sim' if any(u[2] in ('4772500', '4771701', '4771702', '4771703') for u in uni) else 'Não',
            'Perfil': 'Rede varejista com CD próprio' if sum(u[2] in ('4772500', '4771701', '4771702', '4771703') for u in uni) >= 5 else 'Distribuidor',
            'Matriz (cidade/UF)': f"{m['Cidade']}/{m['UF']}", 'Site provável': next((s for s in sub['Site provável'] if s), ''),
            'Telefone (matriz)': m['Telefone'], 'E-mail (matriz)': m['E-mail'],
            'Mix (CNAEs secundários)': int(sub['CNAEs secundários (qtde)'].max()),
        })
    emp_df = pd.DataFrame(empresas).sort_values(['Unidades totais (qualquer CNAE)', 'Capital social (R$)'], ascending=False).reset_index(drop=True)
    emp_df.index += 1

    # ---------- visões de benchmarking ----------
    faixas = pd.cut(emp_df['Capital social (R$)'], [-1, 10e3, 100e3, 500e3, 1e6, 10e6, 100e6, 1e15],
                    labels=['até 10 mil', '10–100 mil', '100–500 mil', '500 mil–1 mi', '1–10 mi', '10–100 mi', '> 100 mi'])
    bench = {
        'Por porte': emp_df.groupby('Porte').agg(Empresas=('CNPJ raiz', 'count'), Unidades=('Unidades de atacado', 'sum'),
                                                 Capital_mediano=('Capital social (R$)', 'median'), Anos_medianos=('Anos de mercado', 'median')).reset_index(),
        'Por faixa de capital': emp_df.groupby(faixas, observed=False).agg(Empresas=('CNPJ raiz', 'count'), Unidades_medias=('Unidades totais (qualquer CNAE)', 'mean')).reset_index().rename(columns={'Capital social (R$)': 'Faixa de capital'}),
        'Por UF': df.pivot_table(index='UF', columns='Segmento', values='CNPJ', aggfunc='count', fill_value=0).assign(Total=lambda x: x.sum(axis=1)).sort_values('Total', ascending=False).reset_index(),
        'Por tempo de mercado': emp_df.groupby(pd.cut(emp_df['Anos de mercado'], [-1, 2, 5, 10, 20, 100], labels=['até 2 anos', '2–5', '5–10', '10–20', '20+'])
                                               , observed=False).agg(Empresas=('CNPJ raiz', 'count')).reset_index(),
        'CNAEs secundários mais comuns': pd.Series([c.split(' ', 1)[0] for s in df['CNAEs secundários'] for c in s.split('; ') if c])
                                            .value_counts().head(30).rename_axis('CNAE').reset_index(name='Estabelecimentos')
                                            .assign(Descrição=lambda x: x['CNAE'].map(cnae_desc)),
    }
    total_emp, total_est = len(emp_df), len(df)
    resumo = pd.DataFrame([
        ['Estabelecimentos ativos (sem MEI)', total_est],
        ['Empresas (CNPJ raiz)', total_emp],
        ['  Atacado de cosméticos e perfumaria (estab.)', int((df['Segmento'] == CNAES_ALVO['4646001']).sum())],
        ['  Atacado de medicamentos (estab.)', int((df['Segmento'] == CNAES_ALVO['4644301']).sum())],
        ['Empresas com mais de 1 unidade', int((emp_df['Unidades totais (qualquer CNAE)'] > 1).sum())],
        ['Empresas com varejo próprio (farmácia/cosméticos)', int((emp_df['Tem varejo próprio'] == 'Sim').sum())],
        ['Distribuidores (sem rede de varejo própria)', int((emp_df['Perfil'] == 'Distribuidor').sum())],
        ['Redes varejistas com CD próprio (5+ lojas)', int((emp_df['Perfil'] != 'Distribuidor').sum())],
        ['Optantes do Simples', int((emp_df['Simples Nacional'] == 'Sim').sum())],
        ['Com site provável (e-mail de domínio próprio)', int((emp_df['Site provável'] != '').sum())],
        ['Capital social mediano (R$)', round(float(emp_df['Capital social (R$)'].median()), 2)],
        ['Tempo de mercado mediano (anos)', float(emp_df['Anos de mercado'].median())],
        ['Fonte', 'Receita Federal — Dados Abertos CNPJ 2026-09'],
        ['Gerado em', time.strftime('%d/%m/%Y %H:%M')],
    ], columns=['Indicador', 'Valor'])

    out = os.path.join(ROOT, 'data', f"benchmark_atacado_{time.strftime('%Y-%m-%d')}.xlsx")
    with pd.ExcelWriter(out, engine='openpyxl') as xw:
        resumo.to_excel(xw, sheet_name='Resumo', index=False)
        # ranking de distribuidores: quem mais tem unidades de ATACADO (não o tamanho da empresa toda)
        dist = emp_df[emp_df['Perfil'] == 'Distribuidor'].sort_values(['Unidades de atacado', 'Foco no atacado (%)', 'Capital social (R$)'], ascending=False).reset_index(drop=True)
        dist.index += 1
        dist.head(200).to_excel(xw, sheet_name='Top 200 distribuidores', index_label='#')
        emp_df[emp_df['Perfil'] != 'Distribuidor'].to_excel(xw, sheet_name='Redes com CD próprio', index_label='#')
        for name, d in bench.items():
            d.to_excel(xw, sheet_name=name[:31], index=False)
        emp_df.to_excel(xw, sheet_name='Empresas', index_label='#')
        df.drop(columns=['CNPJ raiz']).to_excel(xw, sheet_name='Estabelecimentos', index=False)
        from openpyxl.styles import Font
        for ws in xw.book.worksheets:
            ws.freeze_panes = 'A2'
            ws.auto_filter.ref = ws.dimensions
            for c in ws[1]:
                c.font = Font(bold=True)
            for col in ws.columns:
                w = max(len(str(c.value or '')) for c in list(col)[:300])
                ws.column_dimensions[col[0].column_letter].width = min(max(10, w + 2), 55)
    print(resumo.to_string(index=False))
    print(f'ok -> {out}')


if __name__ == '__main__':
    main()
