import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { formatCurrency, formatNumber, formatDate } from '../../lib/utils';
import { ShieldCheck, Check, X, Building2, Users, FileCheck } from 'lucide-react';

export const AdminModeration: React.FC = () => {
  const { creators, brands, campaigns } = useData();
  const [activeTab, setActiveTab] = useState('creators');

  const tabs = [
    { id: 'creators', label: 'Moderação de Creators', count: creators.length },
    { id: 'brands', label: 'Moderação de Marcas', count: brands.length },
    { id: 'campaigns', label: 'Campanhas em Moderação', count: campaigns.length },
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="gold">Compliance & Qualidade</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
          Moderação Central da Plataforma
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Aprove novas nail designers, verifique CNPJs de marcas parceiras e valide campanhas antes da publicação para o público.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Creators Table */}
      {activeTab === 'creators' && (
        <Card variant="elevated" className="p-0 overflow-hidden border-border/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Creator</th>
                  <th className="p-3.5">Localização</th>
                  <th className="p-3.5">Audiência</th>
                  <th className="p-3.5">Especialidades</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {creators.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="p-3.5">
                      <p className="font-bold text-foreground">{c.professional_name}</p>
                      <p className="text-muted-foreground">{c.instagram}</p>
                    </td>
                    <td className="p-3.5">{c.city}/{c.state}</td>
                    <td className="p-3.5 font-semibold text-foreground">
                      {formatNumber(c.instagram_followers)} seguidores
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {c.specialties.slice(0, 2).map((s) => (
                          <span key={s} className="px-1.5 py-0.5 bg-secondary text-[10px] rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="success" size="sm">✓ Ativa</Badge>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => alert(`Perfil de ${c.professional_name} verificado!`)}>
                        Validar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Brands Table */}
      {activeTab === 'brands' && (
        <Card variant="elevated" className="p-0 overflow-hidden border-border/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Marca / Razão Social</th>
                  <th className="p-3.5">CNPJ</th>
                  <th className="p-3.5">Contato</th>
                  <th className="p-3.5">Localização</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <td className="p-3.5">
                      <p className="font-bold text-foreground">{b.brand_name}</p>
                      <p className="text-muted-foreground text-[10px]">{b.company_name}</p>
                    </td>
                    <td className="p-3.5 font-mono">{b.cnpj}</td>
                    <td className="p-3.5">{b.contact_email}</td>
                    <td className="p-3.5">{b.city}/{b.state}</td>
                    <td className="p-3.5">
                      <Badge variant="success" size="sm">✓ Homologada</Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button size="sm" variant="outline" onClick={() => alert('Empresa em conformidade!')}>
                        Gerenciar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Campaigns Table */}
      {activeTab === 'campaigns' && (
        <Card variant="elevated" className="p-0 overflow-hidden border-border/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Campanha</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Orçamento</th>
                  <th className="p-3.5">Vagas</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Moderação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-muted/30">
                    <td className="p-3.5 font-bold text-foreground">{camp.title}</td>
                    <td className="p-3.5 capitalize">{camp.campaign_type.replace('_', ' ')}</td>
                    <td className="p-3.5 font-bold text-emerald-600">{formatCurrency(camp.budget)}</td>
                    <td className="p-3.5">{camp.occupied_slots}/{camp.creator_slots}</td>
                    <td className="p-3.5">
                      <Badge variant="success" size="sm">✓ Aberta ao Público</Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button size="sm" variant="ghost" onClick={() => alert('Campanha verificada!')}>
                        Revisar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
