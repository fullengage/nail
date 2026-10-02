import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Crown,
  Sparkles,
  ShieldCheck,
  Building2,
  User,
  Database,
  ArrowRight,
  Printer,
  Copy,
  CheckCircle2,
  DollarSign,
  Video,
  Layers,
  FileText,
  Lock
} from 'lucide-react';

interface ClientManualPageProps {
  onNavigate: (view: string) => void;
}

export const ClientManualPage: React.FC<ClientManualPageProps> = ({ onNavigate }) => {
  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copiado: ${text}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-8 px-4 text-left print:p-0 print:m-0">
      
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
            <FileText className="w-3.5 h-3.5" /> Manual do Usuário & Relatório de Entrega
          </div>
          <h1 className="text-3xl font-extrabold font-display text-foreground">
            Documentação Executiva — NAIL CLUB PRO
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Guia completo de funcionamento, arquitetura de software, fluxos de negócio e credenciais de acesso.
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" /> Imprimir / Salvar PDF
          </Button>
          <Button size="sm" onClick={() => onNavigate('landing')}>
            Ir para a Plataforma <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* 1. VISÃO GERAL DO PRODUTO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-bold font-display text-foreground">1. Visão Geral e Proposta de Valor</h2>
        </div>
        <Card variant="elevated" className="p-6 space-y-4 border-border/80 text-sm leading-relaxed">
          <p>
            O <strong>NAIL CLUB PRO</strong> é a primeira plataforma de <em>Creator Commerce</em> especializada no mercado de unhas e beleza do Brasil. O ecossistema resolve uma dor crítica do mercado: conecta <strong>Nail Designers / Manicures qualificadas</strong> a <strong>Marcas de Cosméticos</strong> para produção de conteúdo autêntico (UGC), avaliações de produtos, programas de afiliados e lives de vendas.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-1.5">
              <h4 className="font-bold text-xs text-primary uppercase">Para a Creator</h4>
              <p className="text-xs text-muted-foreground">
                Recebe produtos gratuitos em casa (seeding), fecha parcerias com cachê garantido, cria portfólio digital e monetiza com cupons de afiliadas.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1.5">
              <h4 className="font-bold text-xs text-amber-600 uppercase">Para a Marca</h4>
              <p className="text-xs text-muted-foreground">
                Encontra manicures por técnica (gel, fibra, nail art) e cidade, gerencia entregas de Reels com direitos de imagem e acompanha ROI em vendas.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/15 space-y-1.5">
              <h4 className="font-bold text-xs text-purple-600 uppercase">Modelo de Negócio</h4>
              <p className="text-xs text-muted-foreground">
                Taxa de serviço (Take Rate de 15%) sobre o volume transacionado em campanhas + comissões sobre vendas de produtos vinculados.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* 2. CREDENCIAIS DE ACESSO & USUÁRIOS DE TESTE */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-bold font-display text-foreground">2. Credenciais de Acesso & Usuários de Teste</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Utilize as credenciais abaixo na tela de Login (`/auth`) ou utilize a barra de demonstração rápida no topo da aplicação.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Admin Card */}
          <Card variant="elevated" className="p-5 border-purple-500/30 space-y-3 bg-purple-500/5">
            <div className="flex items-center justify-between">
              <Badge variant="purple" size="sm">Administração</Badge>
              <ShieldCheck className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Equipe Nail Club Pro</h3>
              <p className="text-xs text-muted-foreground">Controle financeiro, GMV e moderação</p>
            </div>
            <div className="p-3 bg-card rounded-xl border border-border space-y-1 text-xs font-mono">
              <p><strong>Login:</strong> admin@nailclubpro.com.br</p>
              <p><strong>Senha:</strong> admin123</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => onNavigate('admin-dashboard')}
            >
              Abrir Painel Admin
            </Button>
          </Card>

          {/* Creator Card */}
          <Card variant="elevated" className="p-5 border-primary/30 space-y-3 bg-primary/5">
            <div className="flex items-center justify-between">
              <Badge variant="gold" size="sm">Nail Creator</Badge>
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Camila Rodriguez (Camila Nails)</h3>
              <p className="text-xs text-muted-foreground">48.5k seguidoras • Fibra & Nail Art</p>
            </div>
            <div className="p-3 bg-card rounded-xl border border-border space-y-1 text-xs font-mono">
              <p><strong>Login:</strong> camila@camilanails.art</p>
              <p><strong>Senha:</strong> 123456</p>
            </div>
            <Button
              size="sm"
              className="w-full text-xs"
              onClick={() => onNavigate('creator-dashboard')}
            >
              Abrir Painel da Creator
            </Button>
          </Card>

          {/* Brand Card */}
          <Card variant="elevated" className="p-5 border-amber-500/30 space-y-3 bg-amber-500/5">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" size="sm">Marca Parceira</Badge>
              <Building2 className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">BellaVitta Cosméticos</h3>
              <p className="text-xs text-muted-foreground">Esmaltes Profissionais & Géis</p>
            </div>
            <div className="p-3 bg-card rounded-xl border border-border space-y-1 text-xs font-mono">
              <p><strong>Login:</strong> parcerias@bellavitta.com.br</p>
              <p><strong>Senha:</strong> 123456</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => onNavigate('brand-dashboard')}
            >
              Abrir Painel da Marca
            </Button>
          </Card>

        </div>
      </section>

      {/* 3. GUIA DOS 4 FLUXOS PRINCIPAIS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-500" />
          <h2 className="text-xl font-bold font-display text-foreground">3. Roteiro dos 4 Fluxos de Demonstração</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              step: '1',
              title: 'Candidatura da Manicure',
              role: 'Creator (Camila Nails)',
              desc: 'Navegue até "Campanhas Disponíveis", escolha uma campanha de marca e clique em "Candidatar-se à Campanha". Envie uma proposta personalizada com suas técnicas.',
              highlight: 'Gera registro em ncp_campaign_applications e dispara notificação para a marca.',
            },
            {
              step: '2',
              title: 'Seleção e Aprovação pela Marca',
              role: 'Marca (BellaVitta)',
              desc: 'Acesse o menu "Candidaturas", inspecione os seguidores, especialidades e portfólio da candidata e clique em "Aprovar Creator".',
              highlight: 'Gera código de rastreio Correios e atualiza vagas ocupadas na campanha.',
            },
            {
              step: '3',
              title: 'Produção e Envio do Conteúdo (Reels/UGC)',
              role: 'Creator (Camila Nails)',
              desc: 'Na aba "Minhas Campanhas", clique em "Enviar Conteúdo Produzido". Anexe a foto ou vídeo real e cole o link da publicação do Instagram/TikTok.',
              highlight: 'Faz upload direto para o Supabase Storage no bucket ncp-media.',
            },
            {
              step: '4',
              title: 'Aprovação pela Marca & Liberação de Saldo PIX',
              role: 'Marca (BellaVitta)',
              desc: 'No menu "Conteúdos & Entregas", visualize as métricas simuladas (views, likes, cliques e vendas) e clique em "Aprovar Conteúdo & Liberar Cachê".',
              highlight: 'O cachê entra imediatamente no saldo liberado da manicure para solicitação de saque PIX.',
            },
          ].map((item) => (
            <div key={item.step} className="p-4 rounded-2xl bg-card border border-border flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-primary text-primary-foreground font-extrabold flex items-center justify-center shrink-0">
                {item.step}
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                  <Badge variant="secondary" size="sm">{item.role}</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                <p className="text-[11px] text-primary font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> {item.highlight}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. ARQUITETURA & BANCO DE DADOS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold font-display text-foreground">4. Arquitetura Técnica & Banco de Dados</h2>
        </div>

        <Card variant="elevated" className="p-6 space-y-4 border-border/80 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-muted/40 rounded-xl">
              <p className="font-bold text-foreground">Stack Frontend</p>
              <p className="text-muted-foreground mt-0.5">React 18 + Vite + TypeScript + Tailwind CSS</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl">
              <p className="font-bold text-foreground">Banco de Dados</p>
              <p className="text-muted-foreground mt-0.5">Supabase PostgreSQL (sa-east-1 / SP)</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl">
              <p className="font-bold text-foreground">Armazenamento (Storage)</p>
              <p className="text-muted-foreground mt-0.5">Bucket público <code>ncp-media</code> (50MB limit)</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl">
              <p className="font-bold text-foreground">Segurança</p>
              <p className="text-muted-foreground mt-0.5">Row Level Security (RLS) habilitado</p>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Estrutura de Tabelas Isoladas (`ncp_*`)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <span className="p-1.5 bg-card border rounded">ncp_profiles</span>
              <span className="p-1.5 bg-card border rounded">ncp_creator_profiles</span>
              <span className="p-1.5 bg-card border rounded">ncp_creator_portfolio</span>
              <span className="p-1.5 bg-card border rounded">ncp_brand_profiles</span>
              <span className="p-1.5 bg-card border rounded">ncp_products</span>
              <span className="p-1.5 bg-card border rounded">ncp_campaigns</span>
              <span className="p-1.5 bg-card border rounded">ncp_campaign_applications</span>
              <span className="p-1.5 bg-card border rounded">ncp_campaign_participants</span>
              <span className="p-1.5 bg-card border rounded">ncp_content_submissions</span>
              <span className="p-1.5 bg-card border rounded">ncp_content_metrics</span>
              <span className="p-1.5 bg-card border rounded">ncp_affiliate_links</span>
              <span className="p-1.5 bg-card border rounded">ncp_creator_earnings</span>
              <span className="p-1.5 bg-card border rounded">ncp_courses</span>
              <span className="p-1.5 bg-card border rounded">ncp_lessons</span>
              <span className="p-1.5 bg-card border rounded">ncp_notifications</span>
            </div>
          </div>
        </Card>
      </section>

      {/* 5. MÓDULOS ESPECIAIS ENTREGUES */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-bold font-display text-foreground">5. Módulos Especiais da Plataforma</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <Card variant="elevated" className="p-4 space-y-2 border-border/80">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Video className="w-4 h-4 text-primary" /> Nail Academy (Capacitação)
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Ambiente de cursos gratuitos para treinar manicures em iluminação, enquadramento de mãos, gravação de Reels e técnicas de Live Commerce.
            </p>
          </Card>

          <Card variant="elevated" className="p-4 space-y-2 border-border/80">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Motor de Afiliadas & Cupons
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Geração de links rastreáveis com cupons personalizados (ex: <code>CAMILA10</code>) com métricas de cliques, pedidos convertidos e comissão automática.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer Signature */}
      <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <p>© 2026 NAIL CLUB PRO — Todos os direitos reservados.</p>
        <p className="font-semibold text-foreground">Versão: 1.0.0 (MVP Ready)</p>
      </div>

    </div>
  );
};
