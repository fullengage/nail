import React from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ShieldCheck, FileText, ArrowLeft, AlertTriangle } from 'lucide-react';

interface TermsPageProps {
  onNavigate: (view: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 text-left">
      {/* Navigation back */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('landing')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar ao Início
        </Button>
        <Badge variant="gold">Versão 1.0 — Piloto</Badge>
      </div>

      {/* Header */}
      <div className="space-y-3 border-b border-border pb-6">
        <div className="inline-flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Documento Legal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground">
          Termos e Condições de Uso
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Última atualização: Setembro de 2026 • Plataforma NAIL CLUB PRO
        </p>
      </div>

      {/* Notice box */}
      <Card variant="default" className="p-4 bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="font-bold">Minuta Operacional para o Piloto</p>
          <p className="mt-0.5 leading-relaxed">
            Este documento estabelece as regras de uso da plataforma NAIL CLUB PRO para o programa piloto de 3 marcas e até 45 creators selecionadas. Texto sujeito a aprimoramento jurídico continuado.
          </p>
        </div>
      </Card>

      {/* Terms Body */}
      <div className="space-y-8 text-sm text-foreground/90 leading-relaxed font-sans">
        
        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-foreground">1. Objeto e Natureza da Plataforma</h2>
          <p>
            O <strong>NAIL CLUB PRO</strong> é uma plataforma tecnológica de intermediação que conecta profissionais autônomas do segmento de manicure e nail design ("Creators") a indústrias e distribuidoras de produtos cosméticos ("Marcas"), com a finalidade de viabilizar campanhas de experimentação de produtos (seeding), criação de conteúdo gerado pelo usuário (UGC) e afiliação comercial.
          </p>
          <p>
            O NAIL CLUB PRO não é agência de publicidade nem empregador das Creators. A relação entre Creators e a plataforma é estritamente de prestação de serviços de intermediação tecnológica e cessão pontual de direitos de conteúdo.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-foreground">2. Elegibilidade e Cadastro</h2>
          <p>
            Para se cadastrar como Nail Creator, a usuária deve ter idade igual ou superior a 18 anos, residir no território brasileiro, possuir CPF válido e atuar comprovadamente no setor de beleza/cuidados com unhas.
          </p>
          <p>
            Para se cadastrar como Marca, a solicitante deve ser pessoa jurídica regularmente inscrita no CNPJ/MF, com objeto social compatível com a comercialização de produtos ou serviços cosméticos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-foreground">3. Participação em Campanhas e Entregáveis</h2>
          <p>
            Ao se candidatar e ser aceita em uma campanha, a Creator se compromete a:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-muted-foreground">
            <li>Produzir o conteúdo (fotos, Reels, vídeos UGC) estritamente de acordo com o briefing da campanha;</li>
            <li>Utilizar iluminação adequada, áudio limpo e foco nítido nas unhas e produtos patrocinados;</li>
            <li>Submeter o material para aprovação prévia dentro do prazo acordado;</li>
            <li>Sinalizar publicamente parcerias comerciais conforme diretrizes do CONAR (#publi, #parceria);</li>
            <li>Não utilizar produtos adulterados, vencidos ou que violem normas da ANVISA.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-foreground">4. Direitos de Propriedade Intelectual e Uso de Imagem</h2>
          <p>
            Ao submeter e ter seu conteúdo aprovado em uma campanha com cachê ou bonificação, a Creator concede à Marca patrocinadora e ao NAIL CLUB PRO uma licença não exclusiva, irrevogável e válida pelo período estipulado no briefing da campanha para veiculação, repostagem e impulsionamento do conteúdo em canais digitais e anúncios publicitários.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-foreground">5. Remuneração, Cachês e Pagamentos</h2>
          <p>
            Os cachês acordados são liberados para a Creator após a confirmação e aprovação do conteúdo entregue. Os pagamentos são processados via transferência bancária instantânea (PIX) para a chave cadastrada e de titularidade exclusiva da Creator.
          </p>
          <p>
            A plataforma não cobra mensalidade de manicures e creators durante a vigência do programa piloto.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-foreground">6. Rescisão e Desligamento</h2>
          <p>
            O NAIL CLUB PRO reserva-se o direito de suspender ou encerrar imediatamente contas que descumpram prazos reiteradamente, forneçam dados fraudulentos, utilizem práticas enganosas ou violem as diretrizes éticas da comunidade.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-foreground">7. Foro e Legislação Aplicável</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Quaisquer controvérsias decorrentes destes termos serão submetidas ao Foro da Comarca de São Paulo/SP.
          </p>
        </section>
      </div>

      {/* Footer action */}
      <div className="pt-6 border-t border-border flex justify-end">
        <Button onClick={() => onNavigate('landing')}>
          Entendido, Retornar
        </Button>
      </div>
    </div>
  );
};
