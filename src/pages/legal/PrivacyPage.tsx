import React from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ShieldCheck, Lock, ArrowLeft, AlertTriangle } from 'lucide-react';

interface PrivacyPageProps {
  onNavigate: (view: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 text-left">
      {/* Navigation back */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('landing')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar ao Início
        </Button>
        <Badge variant="purple">LGPD Compliant</Badge>
      </div>

      {/* Header */}
      <div className="space-y-3 border-b border-border pb-6">
        <div className="inline-flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Privacidade & Dados</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground">
          Política de Privacidade
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) • NAIL CLUB PRO
        </p>
      </div>

      {/* Notice box */}
      <Card variant="default" className="p-4 bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs flex items-start space-x-3">
        <Lock className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
        <div>
          <p className="font-bold">Compromisso com a Proteção de Dados</p>
          <p className="mt-0.5 leading-relaxed">
            Seus dados cadastrais, financeiros e de contato são tratados com estrita confidencialidade. Não comercializamos suas informações pessoais em hipótese alguma.
          </p>
        </div>
      </Card>

      {/* Privacy Body */}
      <div className="space-y-8 text-sm text-foreground/90 leading-relaxed font-sans">
        
        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-foreground">1. Dados Coletados e Finalidades</h2>
          <p>Coletamos apenas os dados necessários para a operação do marketplace:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-muted-foreground">
            <li><strong>Identificação e Contato:</strong> Nome completo, e-mail, telefone/WhatsApp, cidade e estado para autenticação, comunicação de campanhas e entregas.</li>
            <li><strong>Perfil Profissional:</strong> Nome artístico, @ do Instagram, especialidades técnicas e fotos de unhas para criação do portfólio público na plataforma.</li>
            <li><strong>Dados de Marcas:</strong> Razão social, CNPJ, nome e cargo de representantes corporativos para faturamento e gestão de campanhas.</li>
            <li><strong>Dados Financeiros:</strong> Chave PIX e dados bancários de titularidade da Creator exclusivamente para repasse de comissões e cachês devidos.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-foreground">2. Bases Legais de Tratamento</h2>
          <p>
            O tratamento dos seus dados fundamenta-se no <strong>cumprimento de contrato</strong> (art. 7º, V da LGPD), para operacionalizar o repasse de campanhas e entregas de produtos; no <strong>legítimo interesse</strong> (art. 7º, IX da LGPD), para segurança antifraude; e no <strong>consentimento expresso</strong> (art. 7º, I da LGPD) concedido no momento do cadastro e do aceite desta política.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-foreground">3. Compartilhamento Seguro de Dados</h2>
          <p>
            Os dados de contato e endereço de envio de produtos só são compartilhados com as Marcas parceiras quando a Creator é formalmente selecionada e aceita uma campanha específica de envio de cosméticos.
          </p>
          <p>
            Prestadores de serviços essenciais (hospedagem de infraestrutura, processamento de pagamentos e auditoria) operam sob rigorosos acordos de confidencialidade e segurança da informação.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-foreground">4. Direitos do Titular de Dados</h2>
          <p>Você pode a qualquer momento exercer seus direitos previstos no artigo 18 da LGPD:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-muted-foreground">
            <li>Confirmar a existência de tratamento de dados;</li>
            <li>Acessar seus dados arquivados;</li>
            <li>Solicitar a correção de dados incompletos ou inexatos;</li>
            <li>Solicitar a anonimização ou exclusão de dados desnecessários;</li>
            <li>Revogar seu consentimento para envio de comunicações informativas.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-foreground">5. Segurança e Armazenamento</h2>
          <p>
            Utilizamos criptografia em trânsito (HTTPS/TLS) e em repouso, políticas de segurança por linha de banco de dados (Row Level Security - RLS) e trilhas de auditoria para registros financeiros e transacionais.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-foreground">6. Contato com o Encarregado de Dados (DPO)</h2>
          <p>
            Para quaisquer solicitações, dúvidas ou exercício de direitos referentes aos seus dados pessoais, entre em contato com nosso time de privacidade pelo e-mail: <strong>privacidade@nailclubpro.com.br</strong>.
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
