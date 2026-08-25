import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Product } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { formatCurrency } from '../../lib/utils';
import { Package, Plus, Sparkles, Tag } from 'lucide-react';

export const BrandProducts: React.FC = () => {
  const { products, addProduct } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('esmaltes');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80');
  const [price, setPrice] = useState(69.90);

  const categories = ['esmaltes', 'gel', 'alongamento', 'equipamentos', 'ferramentas', 'cuidados', 'cursos'];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      brand_id: 'brand-1',
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      category,
      image_url: imageUrl,
      price: Number(price),
      active: true,
    });
    setName('');
    setDescription('');
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

      {/* Create Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Produto"
        description="Adicione produtos para que as Nail Creators possam solicitar em campanhas de seeding ou divulgar como afiliadas."
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
                className="w-full h-11 rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary capitalize"
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

          <Input
            label="URL da Imagem do Produto"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            required
          />

          <Textarea
            label="Descrição do Produto"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
          />

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Cadastrar Produto</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
