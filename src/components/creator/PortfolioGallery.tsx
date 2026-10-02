import React, { useState, useRef } from 'react';
import { CreatorPortfolioItem } from '../../types/database';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Input';
import { Heart, Plus, Sparkles, Eye, UploadCloud, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { storageService } from '../../services/storageService';
import confetti from 'canvas-confetti';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newTechnique, setNewTechnique] = useState('Fibra de Vidro');
  const [previewItem, setPreviewItem] = useState<CreatorPortfolioItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const techniques = ['Fibra de Vidro', 'Nail Art', 'Gel', 'Acrílico', 'Esmaltação em Gel'];

  const filteredItems = activeFilter === 'all'
    ? items
    : items.filter(item => item.technique?.toLowerCase() === activeFilter.toLowerCase());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    let finalMediaUrl = newUrl;

    if (uploadMode === 'file' && selectedFile) {
      const uploadRes = await storageService.uploadFile(selectedFile, 'portfolio');
      if (uploadRes.url) {
        finalMediaUrl = uploadRes.url;
      }
    }

    if (!finalMediaUrl && !previewUrl) {
      setIsUploading(false);
      return;
    }

    onAddItem(finalMediaUrl || previewUrl, newCaption, newTechnique);
    confetti({ particleCount: 70, spread: 60 });
    
    // Reset state
    setSelectedFile(null);
    setPreviewUrl('');
    setNewUrl('');
    setNewCaption('');
    setIsUploading(false);
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
                ? 'bg-primary text-primary-foreground shadow-sm'
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
                  ? 'bg-primary text-primary-foreground shadow-sm'
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
            Adicionar Nova Arte
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

      {/* Add Item Modal (with Supabase Storage Direct Upload) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adicionar Novo Trabalho ao Portfólio"
        description="Suba fotos em alta resolução de unhas feitas por você para atrair marcas parceiras."
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Mode Switcher */}
          <div className="flex p-1 bg-muted rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                uploadMode === 'file' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Upload do Dispositivo (Foto/Câmera)
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('url')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                uploadMode === 'url' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Inserir Link de Imagem
            </button>
          </div>

          {/* Direct File Dropzone */}
          {uploadMode === 'file' ? (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-border group">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl('');
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white text-xs hover:bg-black/80 transition-colors"
                  >
                    Trocar Foto
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/40 hover:border-primary rounded-2xl p-8 text-center cursor-pointer transition-colors bg-primary/5 hover:bg-primary/10 space-y-2"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    Clique para selecionar ou arraste sua foto aqui
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: JPG, PNG, WEBP (armazenamento seguro no Supabase Storage)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
                URL da Imagem
              </label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          )}

          {/* Technique Selector */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
              Técnica / Especialidade
            </label>
            <select
              value={newTechnique}
              onChange={(e) => setNewTechnique(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
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
            placeholder="Ex: Alongamento em fibra de vidro com esmaltação francesa reversa e finalização em top coat diamante..."
            rows={3}
            required
          />

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isUploading}>
              <UploadCloud className="w-4 h-4 mr-2" />
              Publicar no Portfólio
            </Button>
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
          <div className="space-y-4 text-left">
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
