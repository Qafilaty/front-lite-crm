import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { GET_ALL_GOOGLE_SHEETS, GET_ALL_SHEETS_SPREADSHEET, GET_FIRST_ROW_SHEETS, GET_ALL_ROWS_SHEETS_WITH_FIRST_ROW } from '../graphql/queries';
import { DELETE_GOOGLE_SHEETS, CREATE_SHEETS_TO_GOOGLE_SHEETS, UPDATE_SHEETS_TO_GOOGLE_SHEETS, CREATE_SPREADSHEET_FILE, DELETE_SHEETS_FROM_GOOGLE_SHEETS, CREATE_MULTI_ORDER_FROM_SHEETS } from '../graphql/mutations';
import {
    RefreshCw, ExternalLink, FileSpreadsheet, Trash2, AlertTriangle, X,
    UserCog, Sliders, Play, Check, Plug, Loader2, Unlink, ShoppingCart,
    Hourglass, User, Phone, MapPin, Map, Box, ChevronDown, Columns,
    ArrowRight, ArrowLeft, Save, Minus, Plus, CloudDownload, Database,
    Bot, Settings, Table, FolderOpen, AlertCircle, Info, Link
} from 'lucide-react';

type SheetType = 'new' | 'abandoned';

interface SheetConfig {
    id: string; // The Google Sheet ID (spreadsheetId)
    name: string;
    startRow: number;
    dbId?: string; // The ID of the saved configuration in our DB
}

interface SheetValidation {
    status: 'idle' | 'loading' | 'success' | 'error';
    sheets: { id: string, name: string }[];
    message?: string;
}


interface ColumnOption {
    value: string;
    label: string;
}

interface ColumnSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: ColumnOption[];
    color: 'indigo' | 'amber';
    placeholder?: string;
}

const ColumnSelect: React.FC<ColumnSelectProps> = ({ value, onChange, options, color, placeholder = "اختر العمود..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');

    const updatePosition = useCallback(() => {
        if (!isOpen || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = 250; // Max height approximation

        let newPlacement: 'top' | 'bottom' = 'bottom';
        let style: React.CSSProperties = {
            left: rect.left + window.scrollX,
            width: rect.width,
            position: 'absolute',
            zIndex: 9999
        };

        // Decide placement
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
            newPlacement = 'top';
            style.top = rect.top + window.scrollY - 4; // Anchor to top of trigger
            style.transform = 'translateY(-100%)'; // Move up by its own height
        } else {
            newPlacement = 'bottom';
            style.top = rect.bottom + window.scrollY + 4;
        }

        setPlacement(newPlacement);
        setDropdownStyle(style);
    }, [isOpen]);

    // Handle scroll and resize to keep position sync
    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, updatePosition]);

    // Click outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const portalEl = document.getElementById(`dropdown-portal-${containerRef.current?.id}`);
            if (containerRef.current?.contains(target)) return;
            // Check if click is inside portal logic (handled by portal ID check if simple, but refs are better)
            // simplified check for now: relies on stopPropagation in portal or content check
            // But since portal is in body, ref check on portal is hard without a ref to the portal content.
            // We can use the ID trick again.
            const portalNode = document.getElementById(`dropdown-portal-${portalId}`);
            if (portalNode && portalNode.contains(target)) return;

            setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]); // portalId is stable

    const activeRingClass = color === 'indigo' ? 'ring-indigo-100' : 'ring-amber-100';
    const activeTextClass = color === 'indigo' ? 'text-indigo-700' : 'text-amber-700';
    const activeBgClass = color === 'indigo' ? 'bg-indigo-50' : 'bg-amber-50';
    const hoverBgClass = color === 'indigo' ? 'hover:bg-indigo-50' : 'hover:bg-amber-50';

    // Unique ID for portal targeting logic (simple internal id ref)
    const portalId = useRef(`portal-${Math.random().toString(36).substr(2, 9)}`).current;

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative w-48" ref={containerRef}>
            <div
                onClick={() => { setIsOpen(!isOpen); }}
                className={`w-full rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-between py-2.5 pl-3 pr-3 ${value
                    ? `bg-white shadow-sm ring-1 ring-inset ${activeRingClass}`
                    : 'bg-slate-50 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-inset hover:ring-slate-200'
                    }`}
            >
                <span className={`text-[11px] font-black truncate block flex-1 text-right ${value ? activeTextClass : 'text-slate-500'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="flex items-center justify-center w-4 h-4 shrink-0">
                    {value ? (
                        <div className={`w-1.5 h-1.5 rounded-full ${color === 'indigo' ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
                    ) : (
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-slate-600' : 'text-slate-400'}`} />
                    )}
                </div>
            </div>

            {isOpen && createPortal(
                <div
                    id={`dropdown-portal-${portalId}`}
                    style={dropdownStyle}
                    className={`bg-white rounded-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 overflow-y-auto custom-scrollbar flex flex-col max-h-[250px] ${placement === 'top' ? 'origin-bottom' : 'origin-top'}`}
                >
                    <div className="p-1 space-y-0.5" onMouseDown={(e) => e.stopPropagation()}>
                        <div
                            onClick={() => { onChange(''); setIsOpen(false); }}
                            className="px-3 py-2 rounded-md text-[10px] font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 cursor-pointer transition-colors flex items-center justify-between"
                        >
                            <span>(إلغاء التحديد)</span>
                        </div>
                        {options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => { onChange(option.value); setIsOpen(false); }}
                                className={`px-3 py-2 rounded-md text-[11px] font-bold cursor-pointer transition-colors flex items-center justify-between ${option.value === value ? `${activeBgClass} ${activeTextClass}` : `text-slate-600 ${hoverBgClass}`}`}
                            >
                                <span className="font-bold">{option.label}</span>
                                {option.value === value && <Check className="w-3 h-3" />}
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};


export const IntegrationSettings: React.FC = () => {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLinking, setIsLinking] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isAddingToDb, setIsAddingToDb] = useState(false);
    const [showDisconnectModal, setShowDisconnectModal] = useState(false);

    const [configs, setConfigs] = useState<Record<SheetType, SheetConfig>>({
        new: { id: '', name: 'Sheet1', startRow: 2 },
        abandoned: { id: '', name: 'Abandoned', startRow: 2 }
    });

    const [sheetValidation, setSheetValidation] = useState<Record<SheetType, SheetValidation>>({
        new: { status: 'idle', sheets: [] },
        abandoned: { status: 'idle', sheets: [] }
    });

    // Separate mappings for distinct files
    const [mappings, setMappings] = useState<Record<SheetType, Record<string, string>>>({
        new: {},
        abandoned: {}
    });

    // UI state for switching between mapping tabs
    const [activeMappingTab, setActiveMappingTab] = useState<SheetType>('new');

    const [activeView, setActiveView] = useState<SheetType>('new');

    const [stagedData, setStagedData] = useState<Record<SheetType, any[]>>({
        new: [],
        abandoned: []
    });

    const [isAutoSyncActive, setIsAutoSyncActive] = useState<Record<SheetType, boolean>>({
        new: false,
        abandoned: false
    });

    const [lastActionMessage, setLastActionMessage] = useState<{ type: 'success' | 'info' | 'warning', text: string } | null>(null);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newFileName, setNewFileName] = useState("Yilo CRM Orders");

    // Refs for debouncing
    const debounceRefs = useRef<Record<SheetType, NodeJS.Timeout | null>>({ new: null, abandoned: null });

    const [sheetHeaders, setSheetHeaders] = useState<Record<SheetType, string[]>>({
        new: [],
        abandoned: []
    });

    // Queries & Mutations
    const { data: sheetsData, loading: loadingSheets, refetch: refetchSheets } = useQuery(GET_ALL_GOOGLE_SHEETS, {
        fetchPolicy: 'network-only'
    });

    const [getSheetsSpreadsheet] = useLazyQuery(GET_ALL_SHEETS_SPREADSHEET, {
        fetchPolicy: 'network-only'
    });

    const [getFirstRowSheets] = useLazyQuery(GET_FIRST_ROW_SHEETS, {
        fetchPolicy: 'network-only'
    });

    const [getAllRowsSheetsWithFirstRow] = useLazyQuery(GET_ALL_ROWS_SHEETS_WITH_FIRST_ROW, {
        fetchPolicy: 'network-only'
    });

    const googleAccount = sheetsData?.allGoogleSheets?.[0];
    const isConnected = !!googleAccount;


    interface SheetFromQuery {
        id: string;
        idFile: string;
        nameSheet: string;
        typeOrder: string;
        lastRowSynced: number;
        autoSync: boolean;
        configWithOrderCollection: {
            field: string;
            column: string;
        }[];
    }

    // Initialize state from fetched data

    const validateSpreadsheetId = async (type: SheetType, id: string) => {
        if (!id || !googleAccount?.id) return;

        setSheetValidation(prev => ({
            ...prev,
            [type]: { ...prev[type], status: 'loading', message: undefined }
        }));

        try {
            const { data, error } = await getSheetsSpreadsheet({
                variables: {
                    idGoogleSheets: googleAccount.id,
                    spreadsheetId: id
                }
            });

            if (data?.allSheetsSpreadsheet?.length > 0) {
                setSheetValidation(prev => ({
                    ...prev,
                    [type]: {
                        status: 'success',
                        sheets: data.allSheetsSpreadsheet,
                        message: undefined
                    }
                }));
            } else {
                // If it returns empty array but no error, it might be an issue or just empty spreadsheet
                throw new Error("No sheets found");
            }

        } catch (err: any) {
            setSheetValidation(prev => ({
                ...prev,
                [type]: {
                    status: 'error',
                    sheets: [],
                    message: 'لم يتم العثور على الملف. تأكد من صحة المعرف (ID) ومن صلاحيات الوصول.'
                }
            }));
        }
    };

    const fetchHeaders = async (type: SheetType, sheetName: string, spreadId: string) => {
        if (!googleAccount?.id || !spreadId || !sheetName) return;

        try {
            const { data } = await getFirstRowSheets({
                variables: {
                    idGoogleSheets: googleAccount.id,
                    spreadsheetId: spreadId,
                    sheetName: sheetName
                }
            });

            if (data?.firstRowSheets && Array.isArray(data.firstRowSheets)) {
                setSheetHeaders(prev => ({ ...prev, [type]: data.firstRowSheets }));
            }
        } catch (err) {
            console.error("Error fetching headers", err);
        }
    };
    useEffect(() => {
        if (googleAccount?.sheets) {
            const newConfigs: Record<SheetType, SheetConfig> = {
                new: { id: '', name: 'Sheet1', startRow: 2 },
                abandoned: { id: '', name: 'Abandoned', startRow: 2 }
            };
            const newMappings: Record<SheetType, Record<string, string>> = { new: {}, abandoned: {} };
            const newAutoSync: Record<SheetType, boolean> = { new: false, abandoned: false };

            googleAccount.sheets.forEach((sheet: SheetFromQuery) => {
                const type = sheet.typeOrder as SheetType;
                if (type === 'new' || type === 'abandoned') {
                    newConfigs[type] = {
                        id: sheet.idFile,
                        name: sheet.nameSheet,
                        startRow: sheet.lastRowSynced ? sheet.lastRowSynced + 1 : 2,
                        dbId: sheet.id
                    };
                    newAutoSync[type] = sheet.autoSync || false;

                    if (sheet.configWithOrderCollection) {
                        const mapping: Record<string, string> = {};
                        sheet.configWithOrderCollection.forEach((c) => {
                            mapping[c.field] = c.column;
                        });
                        newMappings[type] = mapping;
                    }

                    // Trigger header fetch for saved config
                    fetchHeaders(type, sheet.nameSheet, sheet.idFile);
                }
            });

            setConfigs(newConfigs);
            setMappings(newMappings);
            setIsAutoSyncActive(newAutoSync);
            // We set validation to idle so we don't automatically trigger fetch on load, preserving current name
        }
    }, [googleAccount]);


    const [deleteGoogleSheets, { loading: isDisconnecting }] = useMutation(DELETE_GOOGLE_SHEETS, {
        onCompleted: (data) => {
            if (data?.deleteGoogleSheets?.status) {
                setShowDisconnectModal(false);
                setLastActionMessage({ type: 'success', text: 'تم فك الارتباط بنجاح.' });

                // Reset local state
                setCurrentStep(1);
                setConfigs({
                    new: { id: '', name: 'Sheet1', startRow: 2 },
                    abandoned: { id: '', name: 'Abandoned', startRow: 2 }
                });
                setMappings({ new: {}, abandoned: {} });
                setStagedData({ new: [], abandoned: [] });
                setIsAutoSyncActive({ new: false, abandoned: false });
                setSheetValidation({
                    new: { status: 'idle', sheets: [] },
                    abandoned: { status: 'idle', sheets: [] }
                });

                // Refetch to update UI (remove connected state)
                refetchSheets();
            }
        },
        onError: (error) => {
            setLastActionMessage({ type: 'warning', text: `فشل فك الارتباط: ${error.message}` });
            setShowDisconnectModal(false);
        }
    });

    const [createSheets] = useMutation(CREATE_SHEETS_TO_GOOGLE_SHEETS);
    const [updateSheets] = useMutation(UPDATE_SHEETS_TO_GOOGLE_SHEETS);

    const [createSpreadsheetFile, { loading: isCreatingFile }] = useMutation(CREATE_SPREADSHEET_FILE, {
        onCompleted: (data) => {
            const res = data?.createSpreadsheetFile;
            if (res?.id) {
                setLastActionMessage({ type: 'success', text: `تم إنشاء الملف "${res.name}" بنجاح!` });

                // Auto fill inputs with new ID
                setConfigs(prev => ({
                    new: { ...prev.new, id: res.id, name: 'الطلبات الجديدة' },
                    abandoned: { ...prev.abandoned, id: res.id, name: 'الطلبات المتروكة' }
                }));

                // Trigger validation immediately for both to populate dropdowns (and verify it works)
                validateSpreadsheetId('new', res.id);
                validateSpreadsheetId('abandoned', res.id);
            }
        },
        onError: (error) => {
            setLastActionMessage({ type: 'warning', text: `فشل إنشاء الملف: ${error.message}` });
        }
    });

    const handleCreateNewFile = () => {
        if (!googleAccount?.id) return;
        setIsCreateModalOpen(true);
    };

    const handleConfirmCreate = () => {
        if (newFileName && newFileName.trim()) {
            createSpreadsheetFile({
                variables: {
                    idGoogleSheets: googleAccount.id,
                    title: newFileName
                }
            }).then(() => {
                setIsCreateModalOpen(false);
            });
        }
    };

    const [deleteSheet, { loading: isDeletingSheet }] = useMutation(DELETE_SHEETS_FROM_GOOGLE_SHEETS, {
        onCompleted: (data) => {
            if (data?.deleteSheetsFromGoogleSheets?.status) {
                setLastActionMessage({ type: 'success', text: 'تم حذف الورقة بنجاح.' });
                refetchSheets();
            }
        },
        onError: (error) => {
            setLastActionMessage({ type: 'warning', text: 'فشل حذف الورقة.' });
        }
    });

    const [createMultiOrderFromSheets] = useMutation(CREATE_MULTI_ORDER_FROM_SHEETS);

    const handleDeleteSheet = async (type: SheetType) => {
        const config = configs[type];
        if (!config.dbId || !googleAccount?.id) return;

        if (confirm(`هل أنت متأكد من حذف إعدادات ورقة "${type === 'new' ? 'الطلبات الجديدة' : 'الطلبات المتروكة'}"؟`)) {
            // Optimistically clear dbId to update UI immediately
            setConfigs(prev => ({
                ...prev,
                [type]: { ...prev[type], dbId: undefined }
            }));

            deleteSheet({
                variables: {
                    idGoogleSheets: googleAccount.id,
                    id: config.dbId
                }
            });
        }
    };

    const fields = [
        { id: 'fullName', label: 'اسم الزبون', Icon: User, required: true },
        { id: 'phone', label: 'رقم الهاتف', Icon: Phone, required: true },
        { id: 'address', label: 'العنوان الكامل', Icon: MapPin, required: false },
        { id: 'state', label: 'الولاية', Icon: Map, required: false },
        { id: 'city', label: 'البلدية', Icon: Map, required: false },
        { id: 'products.name', label: 'اسم المنتج', Icon: Box, required: true },
        { id: 'products.sku', label: 'كود المنتج (SKU)', Icon: Box, required: true },
        { id: 'products.quantity', label: 'الكمية', Icon: Box, required: false },
        { id: 'products.price', label: 'السعر', Icon: Box, required: false },
        { id: 'totalPrice', label: 'السعر الإجمالي', Icon: Box, required: false },
        { id: 'note', label: 'ملاحظة', Icon: Box, required: false },
    ];

    const handleLinkAccount = () => {
        if (!user?.company?.id) {
            setLastActionMessage({ type: 'warning', text: 'عذراً، لم يتم العثور على معرف الشركة.' });
            return;
        }

        setIsLinking(true);
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const url = `https://api.wilo.site/integrations/googleSheets/generateAuthUrl/${user.company.id}`;

        const authWindow = window.open(
            url,
            'Google Sheets Auth',
            `width=${width},height=${height},top=${top},left=${left}`
        );

        const messageListener = (event: MessageEvent) => {
            if (event.data && event.data.type === 'GOOGLE_SHEETS_AUTH_SUCCESS') {
                window.removeEventListener('message', messageListener);
                if (authWindow) authWindow.close();

                refetchSheets().then(() => {
                    setLastActionMessage({ type: 'success', text: 'تم ربط الحساب بنجاح!' });
                    setIsLinking(false);
                });
            }
        };

        window.addEventListener('message', messageListener);

        const timer = setInterval(() => {
            if (authWindow && authWindow.closed) {
                clearInterval(timer);
                window.removeEventListener('message', messageListener);
                setIsLinking(false);
            }
        }, 1000);
    };

    const confirmDisconnect = () => {
        if (googleAccount?.id) {
            deleteGoogleSheets({ variables: { id: googleAccount.id } });
        }
    };



    // Auto-fetch headers when validation succeeds
    useEffect(() => {
        if (sheetValidation.new.status === 'success' && configs.new.id && configs.new.name) {
            fetchHeaders('new', configs.new.name, configs.new.id);
        }
    }, [sheetValidation.new.status, configs.new.name]);

    useEffect(() => {
        if (sheetValidation.abandoned.status === 'success' && configs.abandoned.id && configs.abandoned.name) {
            fetchHeaders('abandoned', configs.abandoned.name, configs.abandoned.id);
        }
    }, [sheetValidation.abandoned.status, configs.abandoned.name]);



    // Auto-transition to Step 3 if configs are ready
    useEffect(() => {
        if (isConnected && googleAccount?.sheets?.length > 0) {
            // Check if at least one config is saved (has dbId)
            const isReady = (configs.new.dbId || configs.abandoned.dbId);
            if (isReady && currentStep < 3 && !isLinking) {
                setCurrentStep(3);
            }
        }
    }, [isConnected, configs.new.dbId, configs.abandoned.dbId, isLinking]);

    const handleToggleAutoSync = async (type: SheetType) => {
        const newState = !isAutoSyncActive[type];

        try {
            // Optimistic update
            setIsAutoSyncActive(prev => ({ ...prev, [type]: newState }));

            const config = configs[type];
            if (!config.dbId || !googleAccount?.id) return;

            const content = {
                idFile: config.id,
                nameSheet: config.name,
                typeOrder: type,
                lastRowSynced: config.startRow - 1,
                autoSync: newState,
                configWithOrderCollection: Object.entries(mappings[type]).map(([field, column]) => ({
                    field,
                    column
                }))
            };

            await updateSheets({
                variables: {
                    idGoogleSheets: googleAccount.id,
                    id: config.dbId,
                    content
                }
            });

            setLastActionMessage({ type: 'success', text: newState ? 'تم تفعيل المزامنة التلقائية.' : 'تم إيقاف المزامنة التلقائية.' });

        } catch (error: any) {
            console.error("Auto Sync Toggle Error", error);
            // Revert
            setIsAutoSyncActive(prev => ({ ...prev, [type]: !newState }));
            setLastActionMessage({ type: 'warning', text: 'فشل تغيير حالة المزامنة.' });
        }
    };

    const handleSaveConfigs = async () => {
        const type = activeMappingTab;
        const config = configs[type];
        const sheetId = config.id.trim();
        const sheetName = config.name.trim();

        // 1. Basic Validation
        if (!sheetId) {
            setLastActionMessage({ type: 'warning', text: 'يرجى إدخال معرف ورقة العمل (Spreadsheet ID).' });
            return;
        }

        if (sheetValidation[type].status === 'error') {
            setLastActionMessage({ type: 'warning', text: 'يرجى تصحيح معرف الملف قبل الحفظ.' });
            return;
        }

        if (!sheetName) {
            setLastActionMessage({ type: 'warning', text: 'يرجى اختيار ورقة العمل.' });
            return;
        }

        // 2. Mapping Validation
        const missing = fields.filter(f => f.required && !mappings[type][f.id]);
        if (missing.length > 0) {
            setLastActionMessage({
                type: 'warning',
                text: `يرجى مطابقة: ${missing.map(f => f.label).join('، ')}`
            });
            return;
        }

        setIsConnecting(true);

        try {
            const content = {
                idFile: sheetId,
                nameSheet: sheetName,
                typeOrder: type,
                lastRowSynced: config.startRow - 1,
                configWithOrderCollection: Object.entries(mappings[type]).map(([field, column]) => ({
                    field,
                    column
                }))
            };

            if (config.dbId) {
                // Update existing
                await updateSheets({
                    variables: {
                        idGoogleSheets: googleAccount.id,
                        id: config.dbId,
                        content
                    }
                });
            } else {
                // Create new
                await createSheets({
                    variables: {
                        idGoogleSheets: googleAccount.id,
                        content
                    }
                });
            }

            await refetchSheets();

            setIsConnecting(false);
            setLastActionMessage({ type: 'success', text: `تم حفظ إعدادات ${type === 'new' ? 'الطلبات الجديدة' : 'الطلبات المتروكة'} بنجاح.` });
            setCurrentStep(3);

        } catch (error: any) {
            console.error("Save error:", error);
            setIsConnecting(false);
            setLastActionMessage({ type: 'warning', text: `حدث خطأ أثناء الحفظ: ${error.message}` });
        }
    };

    const handleManualSync = async () => {
        if (!configs[activeView].id || !configs[activeView].name) return;

        setIsSyncing(true);
        setLastActionMessage(null);

        try {
            const { data } = await getAllRowsSheetsWithFirstRow({
                variables: {
                    idGoogleSheets: googleAccount.id,
                    spreadsheetId: configs[activeView].id,
                    sheetName: configs[activeView].name,
                    startRow: configs[activeView].startRow
                }
            });

            if (data?.allRowsSheetsWithFirstRow && Array.isArray(data.allRowsSheetsWithFirstRow) && data.allRowsSheetsWithFirstRow.length > 1) {
                // The result is [Headers, Row1, Row2...]
                setStagedData(prev => ({ ...prev, [activeView]: data.allRowsSheetsWithFirstRow }));
                setLastActionMessage({ type: 'success', text: `تم جلب ${data.allRowsSheetsWithFirstRow.length - 1} سجل بنجاح.` });
            } else {
                setStagedData(prev => ({ ...prev, [activeView]: [] }));
                setLastActionMessage({ type: 'warning', text: 'لم يتم العثور على بيانات جديدة.' });
            }
        } catch (err) {
            console.error(err);
            setLastActionMessage({ type: 'error', text: 'حدث خطأ أثناء جلب البيانات.' });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAddToDatabase = async () => {
        setIsAddingToDb(true);

        try {
            const config = configs[activeView];
            if (!config.dbId || !googleAccount?.id) {
                setLastActionMessage({ type: 'warning', text: 'الإعدادات غير محفوظة أو حساب Google غير متصل.' });
                setIsAddingToDb(false);
                return;
            }

            const { data } = await createMultiOrderFromSheets({
                variables: {
                    idGoogleSheets: googleAccount.id,
                    idSheets: config.dbId,
                    startRow: config.startRow
                }
            });

            if (data?.createMultiOrderFromSheets?.status) {
                setLastActionMessage({ type: 'success', text: `تم حفظ ${stagedData[activeView].length} طلب بنجاح.` });

                // Clear staged data as it is now processed
                setStagedData(prev => ({ ...prev, [activeView]: [] }));

                // Refetch to get updated startRow/lastSyncedRow
                await refetchSheets();
            } else {
                setLastActionMessage({ type: 'warning', text: 'فشلت عملية الحفظ. يرجى المحاولة مرة أخرى.' });
            }

        } catch (error: any) {
            console.error("Batch save error:", error);
            setLastActionMessage({ type: 'warning', text: `حدث خطأ أثناء الحفظ: ${error.message}` });
        } finally {
            setIsAddingToDb(false);
        }
    };

    const updateConfig = (type: SheetType, key: keyof SheetConfig, value: string | number) => {
        setConfigs(prev => ({
            ...prev,
            [type]: { ...prev[type], [key]: value }
        }));

        if (key === 'id') {
            const strVal = value as string;

            // Reset validation if cleared
            if (!strVal.trim()) {
                setSheetValidation(prev => ({ ...prev, [type]: { status: 'idle', sheets: [] } }));
                return;
            }

            // Debounce validation
            if (debounceRefs.current[type]) {
                clearTimeout(debounceRefs.current[type]!);
            }

            debounceRefs.current[type] = setTimeout(() => {
                validateSpreadsheetId(type, strVal);
            }, 800);
        }
    };

    const handleMappingChange = (fieldId: string, value: string) => {
        setMappings(prev => ({
            ...prev,
            [activeMappingTab]: { ...prev[activeMappingTab], [fieldId]: value }
        }));
    };

    const renderSheetInput = (type: SheetType) => {
        const inputClass = `w-full bg-slate-50 border rounded-xl py-2.5 px-3.5 text-xs font-bold focus:border-indigo-500/50 outline-none transition-all shadow-none ${sheetValidation[type].status === 'error' ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-200'}`;

        return (
            <div className="space-y-4">
                <div className="space-y-1 relative">
                    <div className="flex justify-between">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Spreadsheet ID</label>
                        {sheetValidation[type].status === 'loading' && <span className="text-[9px] font-bold text-indigo-500 animate-pulse flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> جاري البحث...</span>}
                    </div>
                    <input
                        type="text"
                        value={configs[type].id}
                        onChange={(e) => updateConfig(type, 'id', e.target.value)}
                        placeholder="مثال: 1BxiMvs0XRA5..."
                        className={inputClass}
                    />
                    {sheetValidation[type].status === 'error' && (
                        <p className="text-[9px] font-bold text-rose-500 px-1 mt-1 flex items-center gap-1 animate-in slide-in-from-top-1">
                            <AlertCircle className="w-3 h-3" />
                            {sheetValidation[type].message}
                        </p>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">اسم الورقة</label>
                    {sheetValidation[type].status === 'success' && sheetValidation[type].sheets.length > 0 ? (
                        <div className="relative">
                            <select
                                value={configs[type].name}
                                onChange={(e) => updateConfig(type, 'name', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pr-3.5 pl-8 text-xs font-bold focus:border-indigo-500/50 outline-none transition-all shadow-none appearance-none cursor-pointer"
                            >
                                <option value="">اختر الورقة...</option>
                                {sheetValidation[type].sheets.map(sheet => (
                                    <option key={sheet.id || sheet.name} value={sheet.name}>{sheet.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={configs[type].name}
                            onChange={(e) => updateConfig(type, 'name', e.target.value)}
                            placeholder="Sheet1"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-xs font-bold focus:border-indigo-500/50 outline-none transition-all shadow-none disabled:opacity-60"
                            disabled={sheetValidation[type].status === 'loading'}
                        />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 pb-12 max-w-5xl mx-auto">
            {/* Header & Progress Steps */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-right">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">إعدادات الربط</h2>
                    <p className="text-[10px] text-slate-400 font-bold">إدارة ربط Google Sheets</p>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    {[
                        { n: 1, l: 'الحساب', Icon: UserCog },
                        { n: 2, l: 'الإعدادات', Icon: Sliders },
                        { n: 3, l: 'التشغيل', Icon: Play }
                    ].map((s) => {
                        const isStep2Enabled = isConnected;
                        const isStep3Enabled = isConnected && (configs.new.dbId || configs.abandoned.dbId);
                        const isDisabled = (s.n === 2 && !isStep2Enabled) || (s.n === 3 && !isStep3Enabled);

                        return (
                            <div key={s.n} className="flex items-center gap-1">
                                <button
                                    disabled={isDisabled}
                                    onClick={() => setCurrentStep(s.n)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${currentStep === s.n ? 'bg-indigo-600 text-white shadow-sm' : (!isDisabled) ? 'hover:bg-indigo-50 text-slate-500 cursor-pointer' : 'text-slate-300 cursor-not-allowed'}`}
                                >
                                    {currentStep > s.n ? <Check className="w-3 h-3" /> : <s.Icon className="w-3 h-3" />}
                                    <span className="hidden sm:inline">{s.l}</span>
                                </button>
                                {s.n < 3 && <div className="w-3 h-0.5 bg-slate-200/60 rounded-full"></div>}
                            </div>
                        )
                    })}
                </div>
            </div>

            {lastActionMessage && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 shadow-md ${lastActionMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                    lastActionMessage.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                        'bg-indigo-50 border-indigo-200 text-indigo-800'
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${lastActionMessage.type === 'success' ? 'bg-emerald-500 text-white' :
                        lastActionMessage.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-indigo-500 text-white'
                        }`}>
                        {lastActionMessage.type === 'success' ? <Check className="w-4 h-4" /> :
                            lastActionMessage.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                    </div>
                    <p className="text-[11px] font-black flex-1">{lastActionMessage.text}</p>
                    <button onClick={() => setLastActionMessage(null)} className="opacity-40 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                </div>
            )}

            {loadingSheets ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-slate-400 animate-pulse">جاري التحقق من حالة الربط...</p>
                </div>
            ) : (
                <>
                    {currentStep === 1 && (
                        <div className="max-w-3xl mx-auto py-6 space-y-8">
                            {isConnected ? (
                                // Connected View
                                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                                    <div className="bg-white rounded-2xl p-8 shadow-xl shadow-indigo-100/50 border border-indigo-50 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                            <div className="relative">
                                                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-indigo-100 to-white border border-slate-100 shadow-lg">
                                                    <img
                                                        src={googleAccount.avatar || "https://ui-avatars.com/api/?name=Google+User&background=random"}
                                                        alt={googleAccount.name}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                </div>
                                                <div className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white text-[10px]">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            </div>

                                            <div className="text-center md:text-right flex-1 space-y-2">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                                                    Google Sheets متصل
                                                </div>
                                                <h3 className="text-2xl font-black text-slate-900">{googleAccount.name || 'مستخدم Google'}</h3>
                                                <p className="text-sm font-bold text-slate-400 font-mono bg-slate-50 px-3 py-1 rounded-md inline-block ltr">{googleAccount.email}</p>
                                            </div>

                                            <div className="flex gap-3">
                                                <button onClick={() => setShowDisconnectModal(true)} className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:scale-105 transition-all flex items-center justify-center border border-rose-100">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => refetchSheets()} className="w-10 h-10 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 hover:scale-105 transition-all flex items-center justify-center border border-slate-100">
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Linked Sheets Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-1 md:col-span-2">
                                            <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                                                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                                الملفات المربوطة
                                            </h4>
                                        </div>

                                        {googleAccount.sheets && googleAccount.sheets.length > 0 ? (
                                            googleAccount.sheets.map((sheet: any, idx: number) => (
                                                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all group">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                            <Table className="w-4 h-4" />
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black ${sheet.typeOrder === 'new' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                                            {sheet.typeOrder === 'new' ? 'طلبات جديدة' : 'طلبات متروكة'}
                                                        </span>
                                                    </div>
                                                    <h5 className="font-black text-slate-900 text-sm truncate" title={sheet.nameSheet}>{sheet.nameSheet}</h5>
                                                    <p className="text-[10px] text-slate-400 font-bold font-mono mt-1 opacity-60 truncate">ID: {sheet.idFile}</p>

                                                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                                                        <p className="text-[9px] text-slate-400 font-bold">آخر قراءة: السطر {sheet.lastRowSynced || '-'}</p>
                                                        <a href={`https://docs.google.com/spreadsheets/d/${sheet.idFile}`} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-700 transition-colors">
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-1 md:col-span-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                                                <p className="text-xs font-bold text-slate-400">لم يتم إعداد أي أوراق عمل بعد.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 flex justify-center">
                                        <button
                                            onClick={() => setCurrentStep(2)}
                                            className="bg-slate-900 text-white px-12 py-4 rounded-xl font-black hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-500/20 flex items-center gap-3 group"
                                        >
                                            <span>متابعة الإعدادات</span>
                                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Connect View (Default)
                                <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/40 border border-slate-100 text-center space-y-6 group relative overflow-hidden max-w-lg mx-auto">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/30 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                                    <div className="relative inline-block">
                                        <div className="w-20 h-20 rounded-xl bg-slate-50 flex items-center justify-center text-3xl shadow-inner mx-auto group-hover:scale-105 transition-transform duration-500 border border-slate-100/50">
                                            {/* Google Icon SVG */}
                                            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-white animate-bounce shadow-sm">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 relative z-10">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">ربط الحساب</h3>
                                        <p className="text-[11px] text-slate-500 font-bold max-w-xs mx-auto leading-relaxed">اربط متجرك بجداول بيانات Google للأتمتة الكاملة للطلبات.</p>
                                    </div>
                                    <button onClick={handleLinkAccount} disabled={isLinking} className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-3 rounded-xl font-black hover:bg-indigo-600 transition-all shadow-lg">
                                        {isLinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plug className="w-5 h-5" /> ربط الحساب الآن</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500">
                            {/* Active Account Info Small */}
                            {isConnected && (
                                <div className="bg-white rounded-xl p-3 px-4 shadow-sm border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={googleAccount.avatar || "https://ui-avatars.com/api/?name=Google+User&background=random"}
                                            alt="Avatar"
                                            className="w-8 h-8 rounded-full border border-slate-200"
                                        />
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">الحساب المتصل</p>
                                            <p className="text-xs font-black text-indigo-600 mt-1">{googleAccount.email}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowDisconnectModal(true)} className="bg-rose-50 text-rose-500 px-3 py-1.5 rounded-lg text-[9px] font-black hover:bg-rose-100 transition-all border border-rose-100 flex items-center gap-1.5">
                                        <Unlink className="w-3 h-3" />
                                        فصل
                                    </button>
                                </div>
                            )}



                            {/* Tab Navigation */}
                            <div className="flex bg-slate-100/50 p-1.5 rounded-xl border border-slate-200">
                                <button
                                    onClick={() => setActiveMappingTab('new')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black transition-all ${activeMappingTab === 'new'
                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    الطلبات الجديدة
                                    {activeMappingTab === 'new' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>}
                                </button>
                                <button
                                    onClick={() => setActiveMappingTab('abandoned')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black transition-all ${activeMappingTab === 'abandoned'
                                        ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-100'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <Hourglass className="w-4 h-4" />
                                    الطلبات المتروكة
                                    {activeMappingTab === 'abandoned' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                                </button>
                            </div>

                            {/* Active Tab Content */}
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Sheet Configuration */}
                                <div className={`bg-white rounded-xl p-6 border transition-all ${activeMappingTab === 'new' ? 'border-indigo-100' : 'border-amber-100'}`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeMappingTab === 'new' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {activeMappingTab === 'new' ? <ShoppingCart className="w-5 h-5" /> : <Hourglass className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h3 className={`text-sm font-black ${activeMappingTab === 'new' ? 'text-indigo-900' : 'text-amber-900'}`}>
                                                    إعدادات {activeMappingTab === 'new' ? 'الطلبات الجديدة' : 'الطلبات المتروكة'}
                                                </h3>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1">قم بتحديد الملف والورقة لجلب البيانات منها</p>
                                            </div>
                                        </div>
                                        {configs[activeMappingTab].dbId && (
                                            <button
                                                onClick={() => handleDeleteSheet(activeMappingTab)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors border border-rose-100"
                                                title="حذف الإعدادات"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {renderSheetInput(activeMappingTab)}
                                </div>

                                {/* Column Mapping */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-100 relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-full h-1 bg-gradient-to-l transition-colors duration-500 ${activeMappingTab === 'new' ? 'from-indigo-500 to-transparent' : 'from-amber-500 to-transparent'}`}></div>

                                    <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-3">
                                        <div>
                                            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                <Columns className="w-4 h-4 text-slate-400" />
                                                مطابقة الأعمدة
                                            </h3>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1">اختر العمود المناسب لكل حقل من حقول النظام</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {fields.map((field) => {
                                            const isMapped = !!mappings[activeMappingTab][field.id];
                                            return (
                                                <div
                                                    key={field.id}
                                                    className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${isMapped
                                                        ? (activeMappingTab === 'new' ? 'bg-indigo-50/30 border-indigo-100' : 'bg-amber-50/30 border-amber-100')
                                                        : 'border-slate-100 hover:border-slate-200 bg-white'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${isMapped
                                                        ? (activeMappingTab === 'new' ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white')
                                                        : 'bg-slate-50 text-slate-400'
                                                        }`}>
                                                        <field.Icon className="w-3.5 h-3.5" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <p className={`text-[11px] font-black truncate ${isMapped ? (activeMappingTab === 'new' ? 'text-indigo-900' : 'text-amber-900') : 'text-slate-700'}`}>{field.label}</p>
                                                            {field.required && <span className="text-rose-500 text-[12px] leading-none">*</span>}
                                                        </div>

                                                        <ColumnSelect
                                                            value={mappings[activeMappingTab][field.id] || ''}
                                                            onChange={(val) => handleMappingChange(field.id, val)}
                                                            color={activeMappingTab === 'new' ? 'indigo' : 'amber'}
                                                            options={sheetHeaders[activeMappingTab]?.length > 0 ? (
                                                                sheetHeaders[activeMappingTab].map((header, idx) => ({
                                                                    value: header,
                                                                    label: header
                                                                }))
                                                            ) : (
                                                                ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(col => ({
                                                                    value: col,
                                                                    label: `العمود ${col}`
                                                                }))
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
                                <button onClick={() => setCurrentStep(1)} className="px-6 py-2.5 rounded-lg text-slate-400 font-black hover:text-slate-600 text-xs transition-all flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4" />
                                    رجوع
                                </button>
                                <button onClick={handleSaveConfigs} disabled={isConnecting} className="bg-slate-900 text-white px-8 py-3 rounded-lg font-black hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100">
                                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span className="text-sm">حفظ الإعدادات</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500">
                            <div className="bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-1.5">
                                <button
                                    onClick={() => setActiveView('new')}
                                    className={`flex-1 py-3 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 relative overflow-hidden ${activeView === 'new' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    الطلبات الجديدة
                                    {isAutoSyncActive.new && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                </button>
                                <button
                                    onClick={() => setActiveView('abandoned')}
                                    className={`flex-1 py-3 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 relative overflow-hidden ${activeView === 'abandoned' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <Hourglass className="w-4 h-4" />
                                    الطلبات المتروكة
                                    {isAutoSyncActive.abandoned && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                <div className="lg:col-span-1 space-y-5">
                                    <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-6">
                                        <div className="text-right flex items-center justify-between">
                                            <div>
                                                <h4 className="text-base font-black text-slate-900">المزامنة</h4>
                                                <p className="text-[9px] text-slate-400 font-bold mt-1">التحكم في سطر القراءة</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Sliders className="w-4 h-4" />
                                            </div>
                                        </div>

                                        <div className="space-y-5">
                                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-center space-y-2.5">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">السطر الحالي</p>
                                                <div className="text-5xl font-black text-indigo-600 tracking-tighter leading-none">{configs[activeView].startRow}</div>
                                                <div className="flex items-center justify-center gap-2.5 mt-3">
                                                    <button onClick={() => updateConfig(activeView, 'startRow', Math.max(2, configs[activeView].startRow - 1))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-none"><Minus className="w-3 h-3" /></button>
                                                    <button onClick={() => updateConfig(activeView, 'startRow', configs[activeView].startRow + 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-none"><Plus className="w-3 h-3" /></button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <button
                                                    onClick={handleManualSync}
                                                    disabled={isSyncing || isAddingToDb}
                                                    className="w-full py-4 rounded-xl bg-slate-900 text-white font-black shadow-none hover:bg-slate-800 disabled:opacity-30 transition-all flex items-center justify-center gap-2.5"
                                                >
                                                    {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
                                                    <span className="text-sm">سحب دفعة</span>
                                                </button>

                                                {stagedData[activeView].length > 0 && (
                                                    <button
                                                        onClick={handleAddToDatabase}
                                                        disabled={isAddingToDb}
                                                        className="w-full py-4 rounded-xl bg-emerald-500 text-white font-black hover:bg-emerald-600 transition-all flex items-center justify-center gap-2.5 animate-bounce shadow-sm"
                                                    >
                                                        {isAddingToDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                                                        <span className="text-sm">تأكيد الإضافة</span>
                                                    </button>
                                                )}

                                                {!isAutoSyncActive[activeView] && stagedData[activeView].length === 0 && (
                                                    <button
                                                        onClick={() => handleToggleAutoSync(activeView)}
                                                        className="w-full py-3.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-black hover:bg-slate-50 hover:text-indigo-500 hover:border-indigo-200 transition-all flex items-center justify-center gap-2 text-xs"
                                                    >
                                                        <Bot className="w-4 h-4" />
                                                        تشغيل آلي
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-5 border-t border-slate-50 space-y-2">
                                            <button onClick={() => setCurrentStep(2)} className="w-full text-[9px] font-black text-slate-400 hover:text-indigo-600 transition-all py-1.5 flex items-center justify-center gap-2">
                                                <Settings className="w-3 h-3" />
                                                تعديل الإعدادات
                                            </button>
                                            <button onClick={() => setShowDisconnectModal(true)} className="w-full text-[9px] font-black text-rose-400 hover:text-rose-600 transition-all py-1.5 flex items-center justify-center gap-2">
                                                <Unlink className="w-3 h-3" />
                                                فصل الحساب
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`rounded-xl p-5 text-center relative overflow-hidden group shadow-lg transition-all duration-300 ${isAutoSyncActive[activeView] ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100'}`}>
                                        {isAutoSyncActive[activeView] && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"></div>}
                                        <div className="space-y-3 relative z-10 flex flex-col items-center justify-center h-full">
                                            <div className="flex items-center justify-center gap-2">
                                                {isAutoSyncActive[activeView] ? (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                                ) : (
                                                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                                )}
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${isAutoSyncActive[activeView] ? 'text-indigo-300' : 'text-slate-400'}`}>
                                                    {isAutoSyncActive[activeView] ? 'أتمتة WILO نشطة' : 'أتمتة WILO متوقفة'}
                                                </p>
                                            </div>

                                            <div className="space-y-0.5">
                                                <p className={`text-base font-black tracking-tight ${isAutoSyncActive[activeView] ? 'text-white' : 'text-slate-900'}`}>
                                                    المزامنة التلقائية
                                                </p>
                                                <p className={`text-[10px] font-bold ${isAutoSyncActive[activeView] ? 'text-slate-400' : 'text-slate-400'}`}>
                                                    فحص دوري كل 5 دقائق
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => handleToggleAutoSync(activeView)}
                                                className={`px-5 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${isAutoSyncActive[activeView]
                                                    ? 'bg-white/10 text-white hover:bg-white/20'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5'}`}
                                            >
                                                {isAutoSyncActive[activeView] ? (
                                                    <>
                                                        <Minus className="w-3 h-3" />
                                                        إيقاف المزامنة
                                                    </>
                                                ) : (
                                                    <>
                                                        <Bot className="w-3 h-3" />
                                                        تفعيل المزامنة
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-5">
                                    <div className="bg-white rounded-2xl p-6 border border-slate-100 min-h-[450px] flex flex-col relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                                    مراجعة بيانات {activeView === 'new' ? 'الجديدة' : 'المتروكة'}
                                                </h3>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1">تأكد من مطابقة السجلات قبل الترحيل</p>
                                            </div>
                                        </div>

                                        {stagedData[activeView].length > 0 ? (
                                            <div className="flex-1 overflow-x-auto">
                                                <table className="w-full text-right border-separate border-spacing-y-2">
                                                    <thead>
                                                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                            <th className="pb-2 px-3">#</th>
                                                            {stagedData[activeView][0].map((header: string, i: number) => (
                                                                <th key={i} className="pb-2 px-3 whitespace-nowrap">{header}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {stagedData[activeView].slice(1).map((row: any[], i) => (
                                                            <tr key={i} className="hover:bg-slate-50 transition-all group bg-slate-50/30">
                                                                <td className="py-3 px-3 rounded-r-lg">
                                                                    <span className="text-[10px] font-black text-slate-300">#{configs[activeView].startRow + i}</span>
                                                                </td>
                                                                {row.map((cell: any, j: number) => (
                                                                    <td key={j} className="py-3 px-3">
                                                                        <span className="text-[11px] font-bold text-slate-600 line-clamp-1 max-w-[150px]" title={cell}>
                                                                            {cell}
                                                                        </span>
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>

                                                </table>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center space-y-5 py-12 text-center group">
                                                <div className="relative">
                                                    <div className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center text-4xl transition-all duration-1000 ${isSyncing ? 'border-indigo-400 bg-indigo-50 text-indigo-500 rotate-12 scale-105' : 'border-slate-200 text-slate-200 shadow-none'}`}>
                                                        {isSyncing ? <CloudDownload className="w-8 h-8" /> :
                                                            (isAutoSyncActive[activeView] ? <Bot className="w-8 h-8 animate-bounce text-emerald-400" /> : <FolderOpen className="w-8 h-8" />)}
                                                    </div>
                                                    {isSyncing && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-12 h-12 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <h4 className="text-base font-black text-slate-900 tracking-tight">{isSyncing ? 'جاري السحب...' : (isAutoSyncActive[activeView] ? 'المزاينة الآلية نشطة' : 'لا توجد بيانات بانتظار المراجعة')}</h4>
                                            </div>
                                        )}

                                        {isAddingToDb && (
                                            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-40">
                                                <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in duration-300 shadow-2xl">
                                                    <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin mx-auto flex items-center justify-center">
                                                        <Database className="w-6 h-6 text-emerald-500" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-lg font-black text-slate-900">جاري الترحيل...</h4>
                                                        <p className="text-[10px] font-bold text-slate-400">يتم الآن نقل البيانات لنظام WILO وتحديث السطر.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Disconnect Modal */}
            {showDisconnectModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <AlertTriangle className="w-8 h-8 text-rose-500" />
                        </div>
                        <div className="text-center space-y-2 mb-6">
                            <h3 className="text-xl font-black text-slate-900">فصل الحساب؟</h3>
                            <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                هل أنت متأكد من رغبتك في فصل حساب Google Sheets؟
                                <br />
                                <span className="text-rose-500">سيتم فقدان جميع إعدادات الربط الحالية.</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDisconnectModal(false)}
                                className="flex-1 py-3 rounded-lg bg-slate-50 text-slate-600 font-black hover:bg-slate-100 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={confirmDisconnect}
                                disabled={isDisconnecting}
                                className="flex-1 py-3 rounded-lg bg-rose-500 text-white font-black hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                            >
                                {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                <span>تأكيد الفصل</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create File Modal */}
            {isCreateModalOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <div className="text-center space-y-2 mb-6">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">إنشاء ملف جديد</h3>
                            <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                أدخل اسم الملف الجديد الذي سيتم إنشاؤه في حساب Google Sheets الخاص بك.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم الملف</label>
                                <input
                                    type="text"
                                    value={newFileName}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    placeholder="مثال: LiteCRM Orders"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-sm font-bold focus:border-indigo-500/50 outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-3 rounded-lg bg-slate-50 text-slate-600 font-black hover:bg-slate-100 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleConfirmCreate}
                                    disabled={isCreatingFile || !newFileName.trim()}
                                    className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreatingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    <span>إنشاء</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                , document.body)}
        </div>
    );
};
