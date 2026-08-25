import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { CheckCircle2, MapPin, Save } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CreatorProfilePage: React.FC = () => {
  const { user, creatorProfile, updateCreatorProfile } = useAuth();

  const [name, setName] = useState(creatorProfile?.professional_name || 'Camila Nails Art');
  const [bio, setBio] = useState(creatorProfile?.bio || '');
  const [city, setCity] = useState(creatorProfile?.city || 'São Paulo');
  const [state, setState] = useState(creatorProfile?.state || 'SP');
  const [instagram, setInstagram] = useState(creatorProfile?.instagram || '@camilanails_art');
  const [tiktok, setTiktok] = useState(creatorProfile?.tiktok || '@camilanails.pro');
  const [igFollowers, setIgFollowers] = useState(creatorProfile?.instagram_followers || 48500);
  const [yearsExp, setYearsExp] = useState(creatorProfile?.years_experience || 6);

  const [acceptsProducts, setAcceptsProducts] = useState(creatorProfile?.accepts_product_campaigns ?? true);
  const [acceptsPaid, setAcceptsPaid] = useState(creatorProfile?.accepts_paid_campaigns ?? true);
  const [acceptsAffiliate, setAcceptsAffiliate] = useState(creatorProfile?.accepts_affiliate_campaigns ?? true);
  const [acceptsLive, setAcceptsLive] = useState(creatorProfile?.accepts_live_campaigns ?? true);

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCreatorProfile({
      professional_name: name,
      bio,
      city,
      state,
      instagram,
      tiktok,
      instagram_followers: Number(igFollowers),
      years_experience: Number(yearsExp),
      accepts_product_campaigns: acceptsProducts,
      accepts_paid_campaigns: acceptsPaid,
      accepts_affiliate_campaigns: acceptsAffiliate,
      accepts_live_campaigns: acceptsLive,
      profile_completion: 100,
    });
    setIsSaved(true);
    confetti({ particleCount: 60, spread: 50 });
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-8 text-left max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Badge variant="gold">Configurações de Perfil</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
            Meu Perfil de Nail Creator
          </h1>
          <p className="text-xs text-muted-foreground">
            Informações visíveis para as marcas e algoritmo de recomendação de campanhas.
          </p>
        </div>

        {/* Profile completion badge */}
        <div className="text-right">
          <span className="text-xs font-bold text-primary">Perfil 95% Completo</span>
          <div className="w-32 bg-border rounded-full h-2 mt-1">
            <div className="bg-primary h-2 rounded-full w-[95%]"></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar & Cover Section */}
        <Card variant="elevated" className="p-6 space-y-6 border-border/80">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
              alt={name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary/20 shadow-md"
            />
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-bold text-lg text-foreground">{name}</h3>
              <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" /> {city}/{state} • Nail Designer Verificada
              </p>
              <Button size="sm" variant="outline" type="button" onClick={() => alert('Foto atualizada!')}>
                Alterar Foto de Perfil
              </Button>
            </div>
          </div>
        </Card>

        {/* Basic & Professional Info */}
        <Card variant="elevated" className="p-6 space-y-4 border-border/80">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Informações Profissionais
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome Profissional / Marca Pessoal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Anos de Experiência em Mesa"
              type="number"
              value={yearsExp}
              onChange={(e) => setYearsExp(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <Input
              label="Estado (UF)"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Mini Bio / Apresentação para as Marcas"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            required
          />
        </Card>

        {/* Social Networks */}
        <Card variant="elevated" className="p-6 space-y-4 border-border/80">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Redes Sociais & Métricas de Audiência
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Instagram (@usuario)"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              required
            />
            <Input
              label="Seguidores no Instagram"
              type="number"
              value={igFollowers}
              onChange={(e) => setIgFollowers(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="TikTok (@usuario)"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
            />
            <Input
              label="Canal no YouTube (Opcional)"
              placeholder="@CamilaNailsTV"
            />
          </div>
        </Card>

        {/* Campaign Preferences Checkboxes */}
        <Card variant="elevated" className="p-6 space-y-4 border-border/80">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Formatos de Campanhas Aceitos
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'prod', label: 'Seeding & Recebidos de Produtos', checked: acceptsProducts, set: setAcceptsProducts },
              { id: 'paid', label: 'Conteúdo Pago com Cachê (Reels/Feed)', checked: acceptsPaid, set: setAcceptsPaid },
              { id: 'aff', label: 'Programas de Afiliadas & Cupons', checked: acceptsAffiliate, set: setAcceptsAffiliate },
              { id: 'live', label: 'Lives Demonstrativas & Parcerias', checked: acceptsLive, set: setAcceptsLive },
            ].map((pref) => (
              <label
                key={pref.id}
                className="flex items-center space-x-3 p-3 rounded-xl border border-border bg-muted/30 cursor-pointer hover:bg-muted/60 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={pref.checked}
                  onChange={(e) => pref.set(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-xs font-semibold text-foreground">{pref.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Perfil atualizado com sucesso!
            </p>
          ) : (
            <span></span>
          )}

          <Button type="submit" size="lg">
            <Save className="w-4 h-4 mr-2" /> Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
};
