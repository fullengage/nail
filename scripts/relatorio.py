"""Relatório em Excel com as listas levantadas (creators, mercado de PDVs e redes).
Uso: python scripts/relatorio.py  →  data/relatorio_squadugc_<data>.xlsx
"""
import json, os, time
import pandas as pd

ROOT = os.path.join(os.path.dirname(__file__), '..')
REC = os.path.join(ROOT, 'data', 'receita')
OUT = os.path.join(ROOT, 'data', f"relatorio_squadugc_{time.strftime('%Y-%m-%d')}.xlsx")
TIPO = {'pharmacy': 'Farmácia / drogaria', 'cosmetics': 'Cosméticos / perfumaria', 'salon': 'Salão / estética', 'distributor': 'Atacado / distribuidor'}

# ---------- creators ----------
cr = pd.DataFrame(json.load(open(os.path.join(ROOT, 'src', 'data', 'realLeads.json'), encoding='utf-8')))
creators = pd.DataFrame({
    'Nome': cr['professional_name'],
    'TikTok': cr['tiktok'],
    'Link TikTok': 'https://www.tiktok.com/' + cr['tiktok'].str.lstrip('@').radd('@'),
    'Instagram': cr['instagram'],
    'Link Instagram': cr['instagram'].where(cr['instagram'] != '', None).map(lambda h: f'https://www.instagram.com/{h.lstrip("@")}' if h else ''),
    'Seguidores TikTok': cr['tiktok_followers'],
    'Engajamento %': cr['engagement_rate'],
    'Views médias': cr['media_views'],
    'Score 30+': cr['operational_score'],
    'Faixa': cr['faixa'].fillna(''),
    'Nicho': cr['nicho'].fillna(''),
    'Vende por live': cr['vende_por_live'].map(lambda v: 'Sim' if v else ''),
    'Verificado TikTok': cr['verification_status'].map(lambda v: 'Sim' if v == 'verified' else ''),
    'E-mail': cr['email'],
    'WhatsApp': cr['phone'],
    'Link da bio': cr['link_bio'],
    'Último post': cr['ultimo_post'].str[:10],
    'Bio': cr['bio'],
}).sort_values(['Faixa', 'Score 30+', 'Seguidores TikTok'], ascending=[True, False, False])

# ---------- PDVs ----------
full = pd.read_csv(os.path.join(REC, 'pdvs_mapeados.csv'), dtype=str)
redes_csv = pd.read_csv(os.path.join(REC, 'pdvs_redes.csv'), dtype=str)
for d in (full, redes_csv):
    d['Tipo'] = d['type'].map(TIPO)

mercado_tipo = full.groupby('Tipo').size().rename('Estabelecimentos').reset_index().sort_values('Estabelecimentos', ascending=False)
mercado_uf = full.pivot_table(index='state', columns='Tipo', values='cnpj', aggfunc='count', fill_value=0)
mercado_uf['Total'] = mercado_uf.sum(axis=1)
mercado_uf = mercado_uf.sort_values('Total', ascending=False).reset_index().rename(columns={'state': 'UF'})

redes_csv['base'] = redes_csv['cnpj'].str[:10]
g = redes_csv.groupby('base')
redes = pd.DataFrame({
    'Rede': g['network'].first(),
    'Razão social': g['trade_name'].first(),
    'CNPJ raiz': g['base'].first() + '/....',
    'Lojas': g.size(),
    'Tipo principal': g['Tipo'].agg(lambda s: s.value_counts().index[0]),
    'UFs': g['state'].nunique(),
    'Estados': g['state'].agg(lambda s: ', '.join(s.value_counts().index[:8]) + ('…' if s.nunique() > 8 else '')),
    'Cidades': g['city'].nunique(),
}).sort_values('Lojas', ascending=False).reset_index(drop=True)
redes.index += 1

pdvs = redes_csv.rename(columns={'network': 'Rede', 'name': 'Loja', 'trade_name': 'Razão social', 'cnpj': 'CNPJ', 'city': 'Cidade', 'state': 'UF',
                                 'address': 'Endereço', 'matriz': 'Matriz/filial', 'inicio_atividade': 'Início atividade'})
pdvs = pdvs[['Rede', 'Loja', 'Razão social', 'CNPJ', 'Tipo', 'Cidade', 'UF', 'Endereço', 'Matriz/filial', 'Início atividade']].sort_values(['Rede', 'UF', 'Cidade'])

resumo_json = json.load(open(os.path.join(REC, 'resumo.json'), encoding='utf-8'))
q = lambda col, val: int((cr[col] == val).sum())
resumo = pd.DataFrame([
    ['CREATORS', '', ''],
    ['Creators mapeados (TikTok, Brasil)', len(cr), 'Coleta do TikTok + enriquecimento por link da bio'],
    ['Faixa A - Prioritário', q('faixa', 'A - Prioritário'), ''],
    ['Faixa B - Qualificado', q('faixa', 'B - Qualificado'), ''],
    ['Com Instagram confirmado', int((cr['instagram'] != '').sum()), 'Informado pelo próprio creator (bio/link da bio)'],
    ['Com e-mail', int((cr['email'] != '').sum()), 'Público no perfil ou link da bio'],
    ['Com WhatsApp', int((cr['phone'] != '').sum()), 'Público no perfil ou link da bio'],
    ['Vendem por live', int(cr['vende_por_live'].fillna(False).astype(bool).sum()), ''],
    ['', '', ''],
    ['MERCADO DE PDVs (Receita Federal)', '', ''],
    ['Estabelecimentos ativos nos CNAEs escolhidos, sem MEI', resumo_json['total'], 'Dados abertos CNPJ 2026-09'],
    ['MEIs excluídos', resumo_json['mei_removidos'], ''],
    ['Redes com 10+ lojas', len(redes), 'Agrupadas pelos 8 primeiros dígitos do CNPJ'],
    ['Lojas dessas redes (no painel)', len(pdvs), 'public.retail_points'],
    ['', '', ''],
    ['CNAEs', '4772-5/00 cosméticos · 4771-7/01,02,03 farmácias · 9602-5/01,02 salões/estética · 4646-0/01 e 4644-3/01 atacado', ''],
    ['Gerado em', time.strftime('%d/%m/%Y %H:%M'), ''],
], columns=['Item', 'Valor', 'Observação'])

with pd.ExcelWriter(OUT, engine='openpyxl') as xw:
    resumo.to_excel(xw, 'Resumo', index=False)
    mercado_tipo.to_excel(xw, 'Mercado por tipo', index=False)
    mercado_uf.to_excel(xw, 'Mercado por UF', index=False)
    redes.to_excel(xw, 'Redes (10+ lojas)', index_label='#')
    pdvs.to_excel(xw, 'PDVs das redes', index=False)
    creators.to_excel(xw, 'Creators', index=False)
    for ws in xw.book.worksheets:
        ws.freeze_panes = 'A2'
        ws.auto_filter.ref = ws.dimensions
        for col in ws.columns:
            width = max(len(str(c.value or '')) for c in list(col)[:300])
            ws.column_dimensions[col[0].column_letter].width = min(max(10, width + 2), 60)
        for c in ws[1]:
            c.font = c.font.copy(bold=True)

print(f'ok -> {OUT}')
print(resumo.to_string(index=False))
print(redes.head(15).to_string())
