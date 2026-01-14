
import React, { useState } from 'react';
import { Product, ProductVariant } from '../types';
import { 
  Plus, Search, Trash2, Tag, ChevronDown, ChevronUp, Save, DollarSign, 
  ChevronRight, ChevronLeft, Package, Edit3, X, Layers, PlusCircle
} from 'lucide-react';

interface InventoryViewProps {
  inventory: Product[];
  setInventory: React.Dispatch<React.SetStateAction<Product[]>>;
}

const InventoryView: React.FC<InventoryViewProps> = ({ inventory, setInventory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // State for Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      setInventory(prev => prev.filter(p => p.id !== id));
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingProduct({
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      sku: '',
      category: 'عام',
      price: 0,
      stock: 0,
      variants: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setModalMode('edit');
    setEditingProduct({ ...product });
    setIsModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (!editingProduct.name || !editingProduct.sku) {
      alert('يرجى إكمال البيانات الأساسية');
      return;
    }

    if (modalMode === 'add') {
      setInventory(prev => [editingProduct as Product, ...prev]);
    } else {
      setInventory(prev => prev.map(p => p.id === editingProduct.id ? (editingProduct as Product) : p));
    }
    setIsModalOpen(false);
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Math.random().toString(36).substr(2, 5),
      name: '',
      sku: '',
      stock: 0,
      price: editingProduct.price
    };
    setEditingProduct({
      ...editingProduct,
      variants: [...(editingProduct.variants || []), newVariant]
    });
  };

  const removeVariant = (index: number) => {
    const newVariants = [...(editingProduct.variants || [])];
    newVariants.splice(index, 1);
    setEditingProduct({ ...editingProduct, variants: newVariants });
  };

  const updateVariantInModal = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...(editingProduct.variants || [])];
    newVariants[index] = { ...newVariants[index], [field]: value };
    
    // Auto-update total stock if variants exist
    const totalStock = newVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    setEditingProduct({ ...editingProduct, variants: newVariants, stock: totalStock });
  };

  const filteredInventory = inventory.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedInventory = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const categories = ['all', ...new Set(inventory.map(p => p.category))];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">إدارة المخزون</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">إضافة وتعديل المنتجات والمتغيرات</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> إضافة منتج
          </button>
        </div>
      </div>

      <div className="flex bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm overflow-x-auto no-scrollbar gap-2 w-fit">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-5 py-2 rounded-md text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-tighter ${categoryFilter === cat ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            {cat === 'all' ? 'الكل' : cat}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] w-[30%]">المنتج والقسم</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em]">SKU</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em]">المخزون</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em]">السعر</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedInventory.map((product) => {
                const isExpanded = expandedRows.has(product.id);
                const hasVariants = product.variants && product.variants.length > 0;
                
                return (
                  <React.Fragment key={product.id}>
                    <tr className={`group hover:bg-slate-50/50 transition-all ${isExpanded ? 'bg-indigo-50/20' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleRow(product.id)}
                            className={`w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-all ${hasVariants ? 'opacity-100' : 'opacity-20 cursor-default'}`}
                            disabled={!hasVariants}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <div>
                            <p className="text-[13px] font-black text-slate-800">{product.name}</p>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1 mt-0.5">
                              <Tag className="w-2.5 h-2.5" /> {product.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-slate-500 font-mono tracking-wider bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className={`text-[12px] font-black ${product.stock < 10 ? 'text-rose-500' : 'text-slate-700'}`}>
                             {product.stock} {hasVariants && <span className="text-[9px] text-slate-400 mr-1">(إجمالي)</span>}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-black text-indigo-600">{product.price} ر.س</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(product)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && hasVariants && (
                      <tr className="bg-slate-50/40 animate-in slide-in-from-top-2">
                        <td colSpan={5} className="px-10 py-4">
                          <div className="bg-white rounded-lg border border-indigo-100 overflow-hidden shadow-sm">
                            <table className="w-full text-right text-[10px]">
                              <thead className="bg-indigo-50/30">
                                <tr className="font-black text-indigo-400 uppercase tracking-widest">
                                  <th className="px-4 py-2">المتغير</th>
                                  <th className="px-4 py-2">SKU</th>
                                  <th className="px-4 py-2">الكمية</th>
                                  <th className="px-4 py-2">السعر</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-indigo-50/30">
                                {product.variants?.map((v) => (
                                  <tr key={v.id}>
                                    <td className="px-4 py-2 font-black text-slate-700">{v.name}</td>
                                    <td className="px-4 py-2 font-mono text-slate-500">{v.sku}</td>
                                    <td className="px-4 py-2 font-black text-slate-700">{v.stock}</td>
                                    <td className="px-4 py-2 font-black text-indigo-600">{v.price || product.price} ر.س</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-center items-center">
           <div className="flex items-center gap-2">
             <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
             <div className="flex items-center gap-1 mx-2">
               {[...Array(totalPages)].map((_, i) => (
                 <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-7 h-7 rounded text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-200'}`}>{i + 1}</button>
               ))}
             </div>
             <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
           </div>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    {modalMode === 'add' ? <Plus className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                 </div>
                 <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                   {modalMode === 'add' ? 'إضافة منتج جديد' : 'تعديل بيانات المنتج'}
                 </h4>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم المنتج</label>
                  <input 
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    placeholder="اسم المنتج..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">القسم</label>
                  <select 
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="إلكترونيات">إلكترونيات</option>
                    <option value="أزياء">أزياء</option>
                    <option value="إكسسوارات">إكسسوارات</option>
                    <option value="منزل">منزل</option>
                    <option value="عام">عام</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الـ SKU الأساسي</label>
                  <input 
                    type="text"
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})}
                    placeholder="PRD-123..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none transition-all font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">السعر الأساسي</label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                      className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Variants Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">المتغيرات (Variants)</h5>
                  </div>
                  <button 
                    onClick={addVariant}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100 transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> إضافة متغير
                  </button>
                </div>

                {editingProduct.variants && editingProduct.variants.length > 0 ? (
                  <div className="space-y-3">
                    {editingProduct.variants.map((variant, idx) => (
                      <div key={variant.id} className="grid grid-cols-12 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 relative group animate-in slide-in-from-right-4 duration-200">
                        <div className="col-span-4 space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase">الاسم</label>
                          <input 
                            value={variant.name} 
                            onChange={(e) => updateVariantInModal(idx, 'name', e.target.value)}
                            placeholder="مثلاً: أحمر - XL" 
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold" 
                          />
                        </div>
                        <div className="col-span-3 space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase">SKU</label>
                          <input 
                            value={variant.sku} 
                            onChange={(e) => updateVariantInModal(idx, 'sku', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-mono" 
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase">الكمية</label>
                          <input 
                            type="number" 
                            value={variant.stock} 
                            onChange={(e) => updateVariantInModal(idx, 'stock', Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-black" 
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase">السعر</label>
                          <input 
                            type="number" 
                            value={variant.price || editingProduct.price} 
                            onChange={(e) => updateVariantInModal(idx, 'price', Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-black text-indigo-600" 
                          />
                        </div>
                        <div className="col-span-1 flex items-end justify-center pb-1">
                          <button 
                            onClick={() => removeVariant(idx)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الكمية المتوفرة (بدون متغيرات)</label>
                    <div className="relative">
                       <Package className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <input 
                        type="number"
                        value={editingProduct.stock}
                        onChange={(e) => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
                        className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg font-black text-[10px] uppercase hover:bg-slate-100 transition-all"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSaveProduct}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                <Save className="w-3.5 h-3.5" /> {modalMode === 'add' ? 'إضافة للمخزون' : 'حفظ التغييرات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
