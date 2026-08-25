import React, { useState } from 'react';
import { CreatorPortfolioItem } from '../../types/database';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Heart, Plus, Sparkles, Filter, Eye } from 'lucide-react';

interface PortfolioGalleryProps {
  items: CreatorPortfolioItem[];
  onAddItem: (mediaUrl: string, caption: string, technique: string) => void;
  isEditable?: boolean;
}

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({
  items,
  onAddItem,
  isEditable = true,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newTechnique, setNewTechnique] = useState('Fibra de Vidro');
  const [previewItem, setPreviewItem] = useState<CreatorPortfolioItem | null>(null);

  const techniques = ['Fibra de Vidro', 'Nail Art', 'Gel', 'Acrílico', 'Esmaltação em Gel'];

  const filteredItems = activeFilter === 'all'
    ? items
    : items.filter(item => item.technique?.toLowerCase() === activeFilter.toLowerCase());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    onAddItem(newUrl, newCaption, newTechnique);
    setNewUrl('');
    setNewCaption('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters and Upload */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Technique Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos ({items.length})
          </button>
          {techniques.map(tech => (
            <button
              key={tech}
              onClick={() => setActiveFilter(tech)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === tech
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tech}
            </button>
          ))}
        </div>

        {isEditable && (
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Adicionar ao Portfólio
          </Button>
        )}
      </div>

      {/* Grid of Portfolio Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            variant="elevated"
            className="group p-0 overflow-hidden relative cursor-pointer"
            onClick={() => setPreviewItem(item)}
          >
            <div className="relative h-64 overflow-hidden bg-muted">
              <img
                src={item.media_url}
                alt={item.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white">
                <div className="flex items-center justify-between">
                  {item.technique && (
                    <Badge variant="gold" size="sm">
                      {item.technique}
                    </Badge>
                  )}
                  <span className="flex items-center gap-1 text-xs font-bold bg-black/40 backdrop-blur px-2.5 py-1 rounded-full">
                    <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                    {item.likes_count || 350}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">
                    {item.caption}
                  </p>
                  <p className="text-[10px] text-white/60 mt-1 flex items-center gap-1 font-medium">
                    <Eye className="w-3 h-3" /> Clique para ampliar
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adicionar Novo Trabalho ao Portfólio"
        description="Mostre suas melhores unhas e atraia parcerias com grandes marcas."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="URL da Foto do Trabalho"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            required
            helperText="Insira uma imagem de alta resolução em iluminação natural ou LED."
          />

          <div>
            <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
              Técnica / Especialidade
            </label>
            <select
              value={newTechnique}
              onChange={(e) => setNewTechnique(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {techniques.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            label="Descrição / Detalhes dos Produtos Utilizados"
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            placeholder="Ex: Alongamento em fibra com curvatura C estruturada e esmaltação francesa..."
            rows={3}
            required
          />

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar no Portfólio</Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      {previewItem && (
        <Modal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={previewItem.technique || 'Trabalho do Portfólio'}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <img
              src={previewItem.media_url}
              alt={previewItem.caption}
              className="w-full max-h-[60vh] object-cover rounded-xl shadow-md"
            />
            <p className="text-sm text-foreground leading-relaxed font-medium">
              {previewItem.caption}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
              <span>Publicado no portfólio oficial</span>
              <span className="flex items-center gap-1 font-bold text-red-500">
                <Heart className="w-4 h-4 fill-current" /> {previewItem.likes_count || 350} curtidas
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
