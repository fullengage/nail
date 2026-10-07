import pandas as pd
import json
import re

def clean_val(v):
    if pd.isna(v):
        return None
    s = str(v).strip()
    return s if s else None

# Load Excel
df = pd.read_excel('data/leads_tiktok.xlsx')
user_col = df.columns[1] # Usuário
views_col = df.columns[6] # Views médias
excl_col = df.columns[12] # Motivo exclusão

xlsx_map = {}
for idx, row in df.iterrows():
    u = clean_val(row[user_col])
    if not u:
        continue
    norm_u = u.lower().replace('@', '').strip()
    
    faixa = clean_val(row['Faixa'])
    nicho = clean_val(row['Nicho'])
    link = clean_val(row['Link TikTok'])
    followers = row['Seguidores'] if not pd.isna(row['Seguidores']) else 0
    eng = row['Engajamento %'] if not pd.isna(row['Engajamento %']) else 0.0
    views = row[views_col] if not pd.isna(row[views_col]) else 0
    score = row['Score 30+'] if not pd.isna(row['Score 30+']) else None
    email = clean_val(row['E-mail'])
    whatsapp = clean_val(row['WhatsApp'])
    bio_link = clean_val(row['Link da bio'])
    live_sales = clean_val(row['Vende por live'])
    motivo_excl = clean_val(row[excl_col])
    bio = clean_val(row['Bio'])
    
    xlsx_map[norm_u] = {
        'faixa': faixa,
        'nicho': nicho,
        'link': link,
        'followers': int(followers) if isinstance(followers, (int, float)) else 0,
        'engagement': float(eng) if isinstance(eng, (int, float)) else 0.0,
        'views': int(views) if isinstance(views, (int, float)) else 0,
        'score': int(score) if isinstance(score, (int, float)) and score > 0 else 75,
        'email': email,
        'whatsapp': whatsapp,
        'bio_link': bio_link,
        'live_sales': live_sales,
        'motivo_excl': motivo_excl,
        'bio': bio
    }

print(f"Loaded {len(xlsx_map)} prioritized leads from leads_tiktok.xlsx")

# Load existing realLeads.json
with open('data/realLeads.json', 'r', encoding='utf-8') as f:
    leads = json.load(f)

matched = 0
for lead in leads:
    tt = lead.get('tiktok', '').lower().replace('@', '').strip()
    if tt in xlsx_map:
        matched += 1
        x = xlsx_map[tt]
        lead['faixa'] = x['faixa']
        lead['nicho'] = x['nicho']
        if x['score'] is not None:
            lead['operational_score'] = x['score']
        if x['engagement'] > 0:
            lead['engagement_rate'] = round(x['engagement'], 2)
        if x['email']:
            lead['email'] = x['email']
        if x['whatsapp']:
            lead['phone'] = x['whatsapp']
        if x['bio'] and len(x['bio']) > len(lead.get('bio', '')):
            lead['bio'] = x['bio']
        if x['bio_link']:
            lead['bio_link'] = x['bio_link']
            lead['media_kit_url'] = x['bio_link']
        
        # Tags
        tags = set(lead.get('tags', []))
        if x['faixa']:
            tags.add(x['faixa'])
        if x['nicho']:
            tags.add(x['nicho'])
            lead['specialties'] = [x['nicho']]
        if x['live_sales'] and str(x['live_sales']).lower() in ['sim', 'yes', 'true']:
            tags.add('Live Commerce')
            lead['vende_por_live'] = True
        else:
            lead['vende_por_live'] = False
        
        if x['motivo_excl']:
            lead['motivo_exclusao'] = x['motivo_excl']
            tags.add('Desqualificado')
            lead['verification_status'] = 'rejected'
        else:
            lead['verification_status'] = 'verified' if x['faixa'] == 'A - Prioritário' else 'pending'
            
        lead['tags'] = list(tags)

print(f"Matched and enriched {matched} leads out of {len(leads)}")

with open('data/realLeads.json', 'w', encoding='utf-8') as f:
    json.dump(leads, f, indent=2, ensure_ascii=False)

print("Saved enriched data/realLeads.json successfully.")
