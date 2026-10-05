# Squad UGC — regras do projeto

## Dados reais, sempre
- **Nenhum número fixo/inventado no painel.** Os contadores do Dashboard (`sourceCounts` em `src/context/DataContext.tsx`) são contados direto do banco (creators, TikTok, Instagram, contato, PDVs).
- **Não recolocar** as bases antigas "17.000 manicures", "799 TikTok", "560 Instagram", "8.059 PDVs", "18.359 únicos": o Richard confirmou que estão erradas (revertido 2x: f314f20 e o revert de 0b26726).
- Quando falta um dado, mostrar "—" (nunca um valor padrão como 4.2% ou score 80).

## Privacidade
- Empresas (brand) nunca veem e-mail/WhatsApp de creators nem telefone de PDV. CSV só para admin.
- `data/` com planilhas e contatos fica fora do git.
