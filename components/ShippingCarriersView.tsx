
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle2, AlertCircle, Key, Lock, X, Globe, Save, Settings, Link2, Plus, Truck, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { GET_ALL_DELIVERY_COMPANIES, GET_AVAILABLE_DELIVERY_COMPANIES } from '../graphql/queries/deliveryCompanyQueries';
import { CREATE_DELIVERY_COMPANY, UPDATE_DELIVERY_COMPANY, DELETE_DELIVERY_COMPANY } from '../graphql/mutations/deliveryCompanyMutations';
import { DeliveryCompany, AvailableDeliveryCompany } from '../types';
import LoadingSpinner from './common/LoadingSpinner';
import toast from 'react-hot-toast';
import { authService } from '../services/apiService';
import { CardGridSkeleton } from './common';

const ShippingCarriersView: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await authService.getCurrentUser();
      if (userData.user && userData.user.company && userData.user.company.id) {
        setUser(userData.user);
      }
    };
    fetchUser();
  }, []);

  const { data: myCarriersData, loading: myCarriersLoading, refetch: refetchMyCarriers } = useQuery(GET_ALL_DELIVERY_COMPANIES, {
    skip: !user,
    fetchPolicy: 'network-only' // Ensure fresh data
  });

  const [getAvailableCarriers, { data: availableCarriersData, loading: availableCarriersLoading }] = useLazyQuery(GET_AVAILABLE_DELIVERY_COMPANIES);

  const [createDeliveryCompany] = useMutation(CREATE_DELIVERY_COMPANY);
  const [updateDeliveryCompany] = useMutation(UPDATE_DELIVERY_COMPANY);
  const [deleteDeliveryCompany] = useMutation(DELETE_DELIVERY_COMPANY);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<AvailableDeliveryCompany | null>(null);
  const [editModeCarrier, setEditModeCarrier] = useState<DeliveryCompany | null>(null);

  // Modal Step State: 'select' = choosing carrier, 'configure' = entering details
  const [step, setStep] = useState<'select' | 'configure'>('select');

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  // Helper to get full image URL
  const getImageUrl = (logoPath?: string) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    return `${import.meta.env.VITE_Images_Url}/${logoPath}`;
  };

  // Initialize form when carrier changes
  useEffect(() => {
    if (editModeCarrier) {
      // Edit Mode: Pre-fill data
      setSelectedCarrier(editModeCarrier.availableDeliveryCompany || null);

      const initialData: Record<string, any> = {};

      // Try to get fields from availableDeliveryCompany first
      const fields = editModeCarrier.availableDeliveryCompany?.fields;

      if (fields) {
        fields.forEach(fieldName => {
          initialData[fieldName] = (editModeCarrier as any)[fieldName] || '';
        });
      }
      setFormData(initialData);
      setIsSubmitDisabled(true);
      setStep('configure'); // Always configure in edit mode
    } else if (selectedCarrier) {
      // Add Mode: Reset form
      const initialData: Record<string, any> = {};
      if (selectedCarrier.fields) {
        selectedCarrier.fields.forEach(fieldName => {
          initialData[fieldName] = '';
        });
      }
      setFormData(initialData);
      setIsSubmitDisabled(false);
      // Ensure we are in configure step if a carrier is selected (handled by handleSelectCarrier mostly)
    }
  }, [selectedCarrier, editModeCarrier]);

  // Handle Input Change
  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => {
      const newState = { ...prev, [fieldName]: value };
      // Check if anything changed from initial for edit mode
      if (editModeCarrier) {
        setIsSubmitDisabled(false);
      }
      return newState;
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCarrier(null);
    setEditModeCarrier(null);
    setFormData({});
    setErrors({});
    setStep('select');
  };

  const openAddModal = () => {
    getAvailableCarriers();
    setEditModeCarrier(null);
    setSelectedCarrier(null);
    setStep('select');
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (carrier: DeliveryCompany) => {
    setEditModeCarrier(carrier);
    setSelectedCarrier(carrier.availableDeliveryCompany || null);
    setStep('configure');
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSelectCarrier = (carrier: AvailableDeliveryCompany) => {
    setSelectedCarrier(carrier);
    setStep('configure');
  };

  const handleBackToSelect = () => {
    setSelectedCarrier(null);
    setStep('select');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleBlur = (fieldName: string, value: string) => {
    const newErrors = { ...errors };
    delete newErrors[fieldName];

    if (!value) {
      newErrors[fieldName] = `حقل ${fieldName} مطلوب`;
    }

    setErrors(newErrors);
  };

  const handleSubmit = async () => {
    if (!user?.company?.id) {
      toast.error('لم يتم العثور على بيانات الشركة');
      return;
    }

    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (selectedCarrier?.fields) {
      for (const fieldName of selectedCarrier.fields) {
        if (!formData[fieldName]) {
          newErrors[fieldName] = `حقل ${fieldName} مطلوب`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setErrors({});

    setIsSubmitting(true);
    // const toastId = toast.loading('جاري الحفظ...'); 

    try {
      if (editModeCarrier) {
        // Update
        await updateDeliveryCompany({
          variables: {
            id: editModeCarrier.id,
            content: {
              idAvailableDeliveryCompany: editModeCarrier.availableDeliveryCompany?.id,
              ...formData,
            }
          }
        });
        toast.success('تم تحديث الإعدادات بنجاح');
      } else {
        // Create
        if (!selectedCarrier) return;

        await createDeliveryCompany({
          variables: {
            content: {
              name: selectedCarrier.name,
              originalName: selectedCarrier.name,
              active: true,
              idAvailableDeliveryCompany: selectedCarrier.id,
              ...formData
            }
          }
        });
        toast.success('تم ربط شركة التوصيل بنجاح');
      }

      await refetchMyCarriers();
      closeModal();

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'فشلت العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCarrier = async (carrierId: string) => {
    if (!confirm('هل أنت متأكد من حذف شركة التوصيل هذه؟')) return;

    setIsDeleting(carrierId);
    // const toastId = toast.loading('جاري الحذف...');
    try {
      await deleteDeliveryCompany({
        variables: { id: carrierId }
      });
      toast.success('تم حذف شركة التوصيل');
      await refetchMyCarriers();
    } catch (error: any) {
      console.error(error);
      toast.error('فشل حذف شركة التوصيل');
    } finally {
      setIsDeleting(null);
    }
  };

  const myCarriers: DeliveryCompany[] = myCarriersData?.allDeliveryCompany || [];
  const availableCarriers: AvailableDeliveryCompany[] = availableCarriersData?.allAvailableDeliveryCompany || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">شركات التوصيل</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">إدارة الربط البرمجي مع مزودي الخدمات اللوجستية</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> إضافة شركة توصيل
        </button>
      </div>

      {myCarriersLoading ? (
        <CardGridSkeleton />
      ) : myCarriers.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-slate-500 font-bold text-sm">لم تقم بربط أي شركة توصيل بعد</h3>
          <button onClick={openAddModal} className="mt-4 text-indigo-600 font-black text-xs hover:underline">إضافة شركة وتفعيل الشحن</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {myCarriers.map((carrier) => (
            <div key={carrier.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between relative overflow-hidden h-full min-h-[220px]">

              {/* Status Badge (Absolute Top Left) */}
              <div className="absolute top-4 left-4 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${carrier.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`} title={carrier.active ? 'متصل' : 'غير نشط'}>
                  {carrier.active ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
              </div>

              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 p-4 mb-4 overflow-hidden shadow-sm">
                  {carrier.logo || carrier.availableDeliveryCompany?.logo ? (
                    <img
                      src={getImageUrl(carrier.logo || carrier.availableDeliveryCompany?.logo) || ''}
                      alt={carrier.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Truck className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                <h3 className="font-black text-slate-800 text-base mb-1">{carrier.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{carrier.originalName || 'Global Carrier'}</p>
              </div>

              <div className="mt-6 pt-0 flex items-center gap-3 w-full">
                <button
                  onClick={() => openEditModal(carrier)}
                  className="flex-grow flex items-center justify-center gap-2 text-[10px] font-black px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                >
                  <Settings className="w-3.5 h-3.5" /> إعدادات الربط
                </button>
                <button
                  onClick={() => handleDeleteCarrier(carrier.id)}
                  disabled={isDeleting === carrier.id}
                  className="flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all border border-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="حذف"
                >
                  {isDeleting === carrier.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <React.Fragment>
          {typeof document !== 'undefined' && ReactDOM.createPortal(
            <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto py-10 px-4">
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={closeModal}></div>
              <div className="relative z-10 bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-auto border border-slate-100 max-h-[90vh]">

                <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center backdrop-blur-sm sticky top-0 z-20">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${editModeCarrier ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}>
                      {editModeCarrier ? <Settings className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                        {editModeCarrier ? 'إعدادات الشركة' : step === 'select' ? 'اختيار مزود الخدمة' : 'إعداد الربط'}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {editModeCarrier ? 'تعديل بيانات الربط الحالية' : step === 'select' ? 'اختر شركة لربطها بمتجرك' : `إدخال بيانات ${selectedCarrier?.name}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto">
                  {/* Step 1: Carrier Selection (Only in Add Mode) */}
                  {!editModeCarrier && step === 'select' && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                      <div className="space-y-2">
                        {availableCarriersLoading ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="h-24 bg-slate-50 rounded-xl animate-pulse"></div>
                            <div className="h-24 bg-slate-50 rounded-xl animate-pulse"></div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {availableCarriers.map(carrier => (
                              <button
                                key={carrier.id}
                                onClick={() => handleSelectCarrier(carrier)}
                                className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 bg-white hover:border-indigo-500 hover:shadow-md transition-all group text-center"
                              >
                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                                  {carrier.logo ? (
                                    <img
                                      src={getImageUrl(carrier.logo) || ''}
                                      alt={carrier.name}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <Truck className="w-6 h-6 text-slate-400" />
                                  )}
                                </div>
                                <span className="text-xs font-black text-slate-700 group-hover:text-indigo-700">{carrier.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Configuration (Add Mode & Edit Mode) */}
                  {(editModeCarrier || step === 'configure') && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">

                      {/* Selected Carrier Header for Add Mode */}
                      {!editModeCarrier && selectedCarrier && (
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center p-1 border border-indigo-100">
                              {selectedCarrier.logo ? (
                                <img src={getImageUrl(selectedCarrier.logo) || ''} className="w-full h-full object-contain" />
                              ) : <Truck className="w-5 h-5 text-indigo-400" />}
                            </div>
                            <div>
                              <h5 className="font-black text-slate-800 text-sm">{selectedCarrier.name}</h5>
                              <p className="text-[10px] text-slate-500 font-bold">يرجى إدخال بيانات API</p>
                            </div>
                          </div>
                          <button
                            onClick={handleBackToSelect}
                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors"
                          >
                            تغيير <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Edit Mode Header */}
                      {editModeCarrier && (
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center p-1 border border-indigo-100">
                            {editModeCarrier.logo || editModeCarrier.availableDeliveryCompany?.logo ? (
                              <img src={getImageUrl(editModeCarrier.logo || editModeCarrier.availableDeliveryCompany?.logo) || ''} className="w-full h-full object-contain" />
                            ) : <Truck className="w-5 h-5 text-indigo-400" />}
                          </div>
                          <div>
                            <h5 className="font-black text-slate-800 text-sm">{editModeCarrier.name}</h5>
                            <p className="text-[10px] text-slate-500 font-bold">نوع الخدمة ثابت ولا يمكن تغييره</p>
                          </div>
                        </div>
                      )}

                      {/* Dynamic Fields */}
                      {selectedCarrier && selectedCarrier.fields && selectedCarrier.fields.length > 0 ? (
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Key className="w-4 h-4 text-indigo-500" />
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">بيانات الربط (API)</h5>
                          </div>

                          {selectedCarrier.fields.map((fieldName) => {
                            const name = fieldName;
                            return (
                              <div key={name} className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                  {name} <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={formData[name] || ''}
                                  onChange={(e) => {
                                    handleInputChange(name, e.target.value);
                                    if (errors[name]) setErrors({ ...errors, [name]: '' });
                                  }}
                                  onBlur={(e) => handleBlur(name, e.target.value)}
                                  placeholder={`أدخل ${name}...`}
                                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold transition-all dir-ltr ${errors[name] ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-indigo-500'}`}
                                />
                                {errors[name] && <p className="text-red-500 text-[9px] font-bold px-1">{errors[name]}</p>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-6 text-center">
                          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-500">لا توجد حقول إضافية مطلوبة لهذه الشركة.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions (Only show if not in select step, or if editing) */}
                {(editModeCarrier || step === 'configure') && (
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 sticky bottom-0 z-20">
                    <button onClick={closeModal} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[11px] uppercase hover:bg-slate-100 transition-all">إلغاء</button>
                    <button
                      onClick={handleSubmit}
                      disabled={(editModeCarrier ? isSubmitDisabled : !selectedCarrier) || isSubmitting}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> {editModeCarrier ? 'حفظ التعديلات' : 'إضافة وتفعيل'}
                        </>
                      )}
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

export default ShippingCarriersView;
