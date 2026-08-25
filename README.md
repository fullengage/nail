# NAIL CLUB PRO — Plataforma de Creator Commerce para o Mercado de Unhas

Plataforma completa conectando **Nail Designers & Manicures (Creators)** a **Marcas de Beleza & Cosméticos (Brands)** com gestão administrativa central (**Admin**).

---

## 💅 Funcionalidades Principais

### Para a Manicure / Nail Creator
- Cadastro completo com especialidades e redes sociais.
- Catálogo de campanhas com remuneração fixa (cachê), UGC, seeding de produtos e afiliados.
- Minhas Campanhas com kanban de acompanhamento e envio de entregas (Reels/TikTok/UGC).
- Portfólio digital categorizado por técnicas (Fibra de Vidro, Gel, Nail Art, Acrílico).
- Extrato financeiro com comissões de afiliados e solicitação de saque PIX.
- **Nail Academy**: Capacitação gratuita em vídeo para criação de conteúdo.

### Para a Marca
- Visão geral com KPIs de alcance, creators contratadas e vendas geradas.
- Wizard passo a passo para lançamento de novas campanhas.
- Diretório de busca de Nail Creators por cidade, audiência e técnicas de mesa.
- Painel de aprovação e recusa de candidaturas.
- Moderação de conteúdos produzidos com acompanhamento de métricas de visualizações, likes, cliques e vendas.
- Catálogo de produtos da marca.

### Para o Administrador
- Visão consolidada de volume movimentado (GMV), receita e comissões da plataforma (take rate de 15%).
- Moderação de conformidade de creators, marcas e campanhas.
- Processamento de lote automático de pagamentos PIX.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui components, Lucide Icons.
- **Backend / Banco**: Supabase (PostgreSQL, Auth, RLS, Storage ready).
- **Build Tool**: Vite.

---

## 🚀 Como Executar Localmente

1. Clone o repositório:
```bash
git clone https://github.com/fullengage/nail.git
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo `.env` (ou use o `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Para gerar a build de produção:
```bash
npm run build
```
