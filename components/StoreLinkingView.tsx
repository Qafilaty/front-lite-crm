import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Store as StoreIcon, Settings, X, Link2, Copy, CheckCircle2, ShieldCheck, ExternalLink, Globe, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { storeService } from '../services/apiService';
import toast from 'react-hot-toast';
import { Store } from '../types';
import LoadingSpinner from './common/LoadingSpinner';
import { CardGridSkeleton } from './common';
import DeleteConfirmationModal from './common/DeleteConfirmationModal';

// Fixed list of supported stores
const SUPPORTED_STORES = [
  {
    key: 'lightfunnels',
    name: 'Lightfunnels',
    logo: 'https://sendibad.s3.eu-central-1.amazonaws.com/lightfunnels-logo.png', // More stable official asset path if available, or stay with brandfetch if reliable.
    color: '#000000',
    description: 'منصة التجارة الإلكترونية لبناء مسارات بيع عالية التحويل'
  },
  {
    key: 'woocommerce',
    name: 'WooCommerce',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/WooCommerce_logo_%282015%29.svg/960px-WooCommerce_logo_%282015%29.svg.png?20210210075453',
    color: '#96588a',
    description: 'إضافة التجارة الإلكترونية مفتوحة المصدر لـ WordPress'
  },
  {
    key: 'shopify',
    name: 'Shopify',
    logo: 'https://cdn.worldvectorlogo.com/logos/shopify.svg',
    color: '#96bf48',
    description: 'منصة تجارة إلكترونية شاملة لبدء وتنمية وإدارة الأعمال'
  },
  {
    key: 'ayor',
    name: 'Ayor',
    logo: 'https://wilo-images-uploaded.s3.eu-central-1.amazonaws.com/ayor-logo.png',
    color: '#7269f8',
    description: 'منصة تجارة إلكترونية شاملة لبدء وتنمية وإدارة الأعمال'
  }
];

const StoreLinkingView: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<typeof SUPPORTED_STORES[0] | null>(null);

  // Modal State
  const [storeDomain, setStoreDomain] = useState('');
  const [generatedWebhook, setGeneratedWebhook] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch stores
  const fetchStores = async () => {
    if (!user?.company?.id) return;
    setLoading(true);
    try {
      const result = await storeService.getAllStores();
      if (result.success) {
        setStores(result.stores);
      } else {
        toast.error('فشل تحميل المتاجر');
      }
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تحميل المتاجر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [user]);

  // Listen for success message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'success') {
        setIsPopupOpen(false);
        fetchStores();
        setIsModalOpen(false);
        toast.success('تمت عملية المصادقة بنجاح');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle open modal
  const handleOpenSettings = (platform: typeof SUPPORTED_STORES[0]) => {
    const existingStore = stores.find(s => s.typeStore === platform.key);
    setSelectedPlatform(platform);
    // If exists, pre-fill domain if available, otherwise empty
    setStoreDomain(existingStore?.domain || '');
    // Reset other states
    setGeneratedWebhook(existingStore?.url || null);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (storeId: string) => {
    setStoreToDelete(storeId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!storeToDelete) return;

    setIsDeleting(true);
    const toastId = toast.loading('جاري حذف المتجر...');

    try {
      const result = await storeService.deleteStore(storeToDelete);
      if (result.success) {
        toast.success('تم حذف المتجر وإيقاف المزامنة بنجاح', { id: toastId });
        setStores(prev => prev.filter(s => s.id !== storeToDelete));
        setShowDeleteModal(false);
        setStoreToDelete(null);
      } else {
        toast.error('فشل حذف المتجر', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء العملية', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const cleanUrl = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  };

  const handleConnect = async (isDirectLink: boolean = false) => {
    if (!user?.company?.id || !selectedPlatform) return;

    if (selectedPlatform.key === 'woocommerce' && isDirectLink && !storeDomain) {
      toast.error('يرجى إدخال رابط المتجر للربط المباشر');
      return;
    }

    setIsProcessing(true);

    // Prepare payload
    // If it's WooCommerce and direct link, we use the domain provided.
    // Otherwise, we might create a placeholder store or update existing.

    const existingStore = stores.find(s => s.typeStore === selectedPlatform.key);

    try {
      let storeData;

      // If WooCommerce Direct Link Logic
      if (selectedPlatform.key === 'woocommerce' && isDirectLink) {
        const cleanDomain = cleanUrl(storeDomain);
        const authUrl = `https://${cleanDomain}/wc-auth/v1/authorize?app_name=Wilo&user_id=${cleanDomain}&scope=read_write&return_url=https://app.wilo.site/woocommerce/success&callback_url=https://api.wilo.site/integrations/woocommerce/callback/${user.company.id}`;

        // Open Popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          authUrl,
          'WooCommerce Auth',
          `width=${width},height=${height},top=${top},left=${left}`
        );

        if (popup) {
          setIsPopupOpen(true);
          const checkPopupClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkPopupClosed);
              setIsPopupOpen(false);
              fetchStores(); // Refresh to see if added
              setIsModalOpen(false); // Close modal on finish
              toast.success('تمت عملية المصادقة (يرجى التحقق من الحالة)');
            }
          }, 500);
        } else {
          toast.error('تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة للمتابعة.');
        }

        setIsProcessing(false);
        return; // Logic ends here for direct link, handled by popup
      }

      // Standard API/Webhook Logic (Lightfunnels, Shopify, or WooCommerce manual)
      // If store exists, we maybe update it or just show webhook?
      // The requirement says: "When adding store... user sends basic info... then show webhook" based on the button.

      // If we don't have this store yet, create it.
      if (!existingStore) {
        const payload = {
          name: selectedPlatform.name,
          typeStore: selectedPlatform.key,
          status: true, // Active by default
          // We don't have domain yet if it's just "Connect" button for webhook generation, 
          // unless user entered it (optional for non-WooCommerce based on prompt "Remove webhook field... only direct link has input")
          // Actually prompt says: "just input basic info... then show webhook".
        };

        const createResult = await storeService.createStore(payload);
        if (createResult.success && createResult.store) {
          storeData = createResult.store;
          setStores(prev => [...prev, createResult.store]);
          toast.success('تم إنشاء المتجر بنجاح');
        } else {
          throw new Error('فشل إنشاء المتجر');
        }
      } else {
        storeData = existingStore;
      }

      // Show Webhook URL
      if (storeData) {
        if (storeData.url) {
          setGeneratedWebhook(storeData.url);
        } else {
          // Fallback if API hasn't returned it yet or needs refresh?
          // Ideally API returns it on create/get.
          // If missing, maybe construct it manually if we knew the format, but better to rely on API.
          // Assuming API returns it as requested in plan.
          toast.error('لم يتم العثور على رابط Webhook من الخادم');
        }
      }

    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء العملية');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ للحافظة');
  };

  if (loading) {
    return <CardGridSkeleton count={3} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">ربط المتاجر</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">
            إدارة عمليات الربط مع منصات التجارة الإلكترونية
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SUPPORTED_STORES.map((platform) => {
          const connectedStore = stores.find(s => s.typeStore === platform.key);
          const isConnected = !!connectedStore;

          return (
            <div
              key={platform.key}
              className={`relative bg-white rounded-xl border transition-all duration-300 overflow-hidden group hover:shadow-lg ${isConnected ? 'border-emerald-100 shadow-emerald-100/50' : 'border-slate-100 shadow-sm'}`}
            >
              {isConnected && (
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase">تم الربط</span>
                </div>
              )}

              <div className="p-6 flex flex-col items-center text-center h-full">
                <div className="w-16 h-16 mb-4 relative">
                  <div className={`absolute inset-0 rounded-2xl opacity-5 blur-xl group-hover:opacity-10 transition-opacity`} style={{ backgroundColor: platform.color }}></div>
                  <img src={platform.logo} alt={platform.name} className="w-full h-full object-contain relative z-10 drop-shadow-sm" />
                </div>

                <h3 className="text-lg font-black text-slate-800 mb-2">{platform.name}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">
                  {platform.description}
                </p>

                <div className="mt-auto w-full">
                  {isConnected ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenSettings(platform)}
                        className="flex-1 py-2.5 px-4 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                      >
                        <Settings className="w-3.5 h-3.5" /> معلومات الربط
                      </button>
                      <button
                        onClick={() => connectedStore?.id && handleOpenDeleteModal(connectedStore.id)}
                        className="px-3 py-2.5 rounded-lg text-xs font-black flex items-center justify-center transition-all bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100"
                        title="حذف المتجر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenSettings(platform)}
                      className="w-full py-2.5 px-4 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                    >
                      <Link2 className="w-3.5 h-3.5" /> إعداد الربط
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="حذف ربط المتجر"
        description="هل أنت متأكد أنك تريد حذف ربط هذا المتجر؟ سيتم إيقاف المزامنة فوراً ولن تستقبل أي طلبات جديدة من هذا المتجر بعد الآن."
        isDeleting={isDeleting}
      />

      {/* Settings/Connect Modal */}
      {isModalOpen && selectedPlatform && (
        <React.Fragment>
          {typeof document !== 'undefined' && ReactDOM.createPortal(
            <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto py-10 px-4">
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
              <div className="relative z-10 bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col my-auto">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 p-1.5 bg-white rounded-lg border border-slate-100 shadow-sm">
                      <img src={selectedPlatform.logo} alt={selectedPlatform.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800">{selectedPlatform.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">إعدادات الربط</p>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors bg-white p-1 rounded-full border border-transparent hover:border-rose-100 hover:bg-rose-50">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  {/* If generatedWebhook is present, show it (Success State) */}
                  {generatedWebhook ? (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-in zoom-in spin-in-12">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800">المتجر جاهز للربط!</h4>
                        <p className="text-xs text-slate-500">
                          إنسخ رابط Webhook التالي وقم بإضافته في إعدادات متجر {selectedPlatform.name}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Webhook URL</label>
                          <span className="text-[9px] font-mono text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">POST</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[11px] font-mono text-slate-600 bg-white border border-slate-200 p-2.5 rounded-lg break-all">
                            {generatedWebhook}
                          </code>
                          <button
                            onClick={() => copyToClipboard(generatedWebhook)}
                            className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            title="نسخ الرابط"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setGeneratedWebhook(null);
                          // If it was just created, maybe we want to keep it connected visually in the background
                          // but clearing webhook allows "re-viewing" or "done". 
                          // Let's just close modal.
                          setIsModalOpen(false);
                        }}
                        className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs hover:bg-slate-200 transition-all"
                      >
                        إغلاق
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Default Connect View */}
                      <div className="space-y-4">
                        {/* WooCommerce Special Case: Direct Link Input */}
                        {selectedPlatform.key === 'woocommerce' && (
                          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-4">
                            <div className="flex items-start gap-3">
                              <Globe className="w-5 h-5 text-indigo-600 mt-0.5" />
                              <div>
                                <h5 className="text-xs font-black text-indigo-900 mb-1">الربط المباشر (Direct Link)</h5>
                                <p className="text-[10px] text-indigo-700/80 leading-relaxed">
                                  لربط متجر WooCommerce تلقائياً، أدخل رابط المتجر أدناه وسيتم فتح نافذة للمصادقة.
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="مثال: mystore.com"
                                value={storeDomain}
                                onChange={(e) => setStoreDomain(e.target.value)}
                                className="flex-1 px-4 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none text-left"
                                dir="ltr"
                              />
                              <button
                                onClick={() => handleConnect(true)}
                                disabled={isProcessing || !storeDomain}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
                              >
                                {isProcessing ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  'ربط الآن'
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Divider if WooCommerce */}
                        {selectedPlatform.key === 'woocommerce' && (
                          <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-slate-100"></div>
                            <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-slate-300 uppercase">أو الربط اليدوي</span>
                            <div className="flex-grow border-t border-slate-100"></div>
                          </div>
                        )}

                        {/* Manual / Webhook Generation Section */}
                        <div className="text-center space-y-4">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">
                              لربط متجر {selectedPlatform.name}، سنقوم بتوليد رابط Webhook خاص بك. قم بنسخه وإضافته في إعدادات متجرك لاستقبال الطلبات تلقائياً.
                            </p>
                            <button
                              onClick={() => handleConnect(false)}
                              disabled={isProcessing}
                              className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-black text-xs hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group"
                            >
                              {isProcessing ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <>
                                  <Link2 className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                                  توليد رابط Webhook
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {!generatedWebhook && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg text-xs font-black hover:bg-slate-50 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default StoreLinkingView;
