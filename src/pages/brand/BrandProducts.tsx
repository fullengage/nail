import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { Product } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { formatCurrency } from '../../lib/utils';
import { Package, Plus, Sparkles, Tag, UploadCloud } from 'lucide-react';
import { storageService } from '../../services/storageService';
import confetti from 'canvas-confetti';

export const BrandProducts: React.FC = () => {
  const { products, addProduct } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('esmaltes');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80');
  const [price, setPrice] = useState(69.90);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['esmaltes', 'gel', 'alongamento', 'equipamentos', 'ferramentas', 'cuidados', 'cursos'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    let finalImageUrl = imageUrl;
    if (selectedFile) {
      const res = await storageService.uploadFile(selectedFile, 'products');
      if (res.url) finalImageUrl = res.url;
    }

    addProduct({
      brand_id: 'brand-1',
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      category,
      image_url: finalImageUrl,
      price: Number(price),
      active: true,
    });

    confetti({ particleCount: 60, spread: 50 });
    setName('');
    setDescription('');
    setSelectedFile(null);
    setPreviewUrl('');
    setIsUploading(false);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="gold">Catálogo da Marca</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
            Produtos para Seeding & Afiliadas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Cadastre os esmaltes, géis construtores e equipamentos disponíveis para vincular às suas campanhas de creators.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="shadow-md">
          <Plus className="w-4 h-4 mr-1.5" />
          Cadastrar Novo Produto
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((prod) => (
          <Card key={prod.id} variant="elevated" className="space-y-4 p-5 flex flex-col justify-between border-border/80 group">
            <div className="space-y-3">
              <div className="relative h-48 -mx-5 -mt-5 rounded-t-2xl overflow-hidden bg-muted">
                <img
                  src={prod.image_url}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" size="sm" className="capitalize">
                    {prod.category}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-sm font-display text-foreground leading-snug">
                  {prod.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {prod.description}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Preço Sugerido</span>
                <p className="text-base font-extrabold text-foreground">{formatCurrency(prod.price || 0)}</p>
              </div>
              <Badge variant="success" size="sm">✓ Ativo para Campanhas</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Product Modal (with Supabase Storage Upload) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Produto"
        description="Adicione produtos com foto real para que as Nail Creators possam solicitar em campanhas de seeding ou divulgar como afiliadas."
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nome do Produto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Gel Construtor Autonivelante 30g"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary capitalize font-medium"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Preço de Tabela (R$)"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />
          </div>

          {/* Product Image Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1.5">
              Foto do Produto (Upload para Supabase Storage)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border h-40">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl('');
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white text-xs hover:bg-black/80"
                >
                  Trocar Imagem
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary rounded-xl p-5 text-center cursor-pointer transition-colors bg-muted/40 hover:bg-muted/70 space-y-1"
              >
                <UploadCloud className="w-6 h-6 mx-auto text-primary" />
                <p className="text-xs font-bold text-foreground">Clique para selecionar a imagem do produto</p>
                <p className="text-[10px] text-muted-foreground">Formatos JPG, PNG ou WEBP</p>
              </div>
            )}
          </div>

          <Textarea
            label="Descrição do Produto"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva as características, rendimento, fórmula e modo de uso..."
            rows={3}
            required
          />

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isUploading}>
              <Plus className="w-4 h-4 mr-2" />
              Salvar Produto no Catálogo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
