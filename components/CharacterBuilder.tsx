

import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { LoreItem, LoreType, WorldGenOptions } from '../types';
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, SaveIcon, UploadIcon, UsersIcon, FlagIcon, MapPinIcon, TagIcon, SparklesIcon, PhotoIcon, EyeIcon, PencilIcon, GlobeAltIcon } from './icons';
import Loader from './Loader';
import WorldGenerator from './WorldGenerator';

// --- Helper Input/Textarea Components ---
const FormInput = ({ label, id, onGenerate = undefined, isGenerating = false, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
        <div className="flex items-center gap-2">
            <input
                id={id}
                {...props}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-gray-200 placeholder-gray-500 text-sm flex-grow"
            />
            {onGenerate && (
                <button 
                    type="button"
                    onClick={onGenerate} 
                    disabled={isGenerating} 
                    className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-md text-purple-400 hover:bg-purple-900/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    title="Generate with AI"
                >
                    {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                </button>
            )}
        </div>
    </div>
);

const FormTextarea = ({ label, id, onGenerate = undefined, isGenerating = false, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
        <div className="flex items-start gap-2">
            <textarea
                id={id}
                {...props}
                rows={3}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-gray-200 placeholder-gray-500 text-sm resize-y flex-grow"
            />
            {onGenerate && (
                <button 
                    type="button"
                    onClick={onGenerate} 
                    disabled={isGenerating} 
                    className="flex-shrink-0 h-9 w-9 mt-px flex items-center justify-center rounded-md text-purple-400 hover:bg-purple-900/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    title="Generate with AI"
                >
                    {isGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                </button>
            )}
        </div>
    </div>
);

// --- Lore Item Editor Component ---
interface LoreItemEditorProps {
    item: LoreItem;
    onUpdate: (item: LoreItem) => void;
    onDelete: (id: string) => void;
    onLoadItemFile: (itemId: string, file: File) => void;
    isInitiallyOpen: boolean;
    onGenerateLoreDetail: (itemId: string, field: 'name' | 'description') => void;
    generatingLoreField: { itemId: string; field: 'name' | 'description' } | null;
    onUpdateImage: (itemId: string, file: File | null) => void;
    isUpdatingImage: string | null;
    onGenerateImage: (itemId: string) => void;
    isGeneratingImage: string | null;
    onViewImage: (src: string, name: string) => void;
}

const getIconForType = (type: LoreType) => {
    const props = {className: "w-5 h-5 mr-2 text-purple-400"};
    switch(type) {
        case 'Character': return <UsersIcon {...props} />;
        case 'Race': return <UsersIcon {...props} />;
        case 'Faction': return <FlagIcon {...props} />;
        case 'Location': return <MapPinIcon {...props} />;
        case 'Custom': return <TagIcon {...props} />;
        default: return null;
    }
}

const IconButton = ({ children, className = '', ...props }) => (
    <button
        type="button"
        className={`p-2 rounded-full text-white bg-black/50 hover:bg-black/70 transition-all duration-200 ${className}`}
        {...props}
    >
        {children}
    </button>
);

const LoreItemEditor: React.FC<LoreItemEditorProps> = ({ item, onUpdate, onDelete, onLoadItemFile, isInitiallyOpen, onGenerateLoreDetail, generatingLoreField, onUpdateImage, isUpdatingImage, onGenerateImage, isGeneratingImage, onViewImage }) => {
    const [isOpen, setIsOpen] = useState(isInitiallyOpen);
    const itemFileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (field: keyof LoreItem, value: string) => {
        onUpdate({ ...item, [field]: value });
    };
    
    const handleSaveThisItem = () => {
        const dataStr = JSON.stringify(item, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = (item.name || `lore-item-${item.id}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${fileName}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const handleLoadItemClick = () => {
        itemFileInputRef.current?.click();
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onLoadItemFile(item.id, file);
        }
        if(event.target) event.target.value = ''; // Reset file input
    };
    
    const handleImageFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onUpdateImage(item.id, file);
        }
        if(event.target) event.target.value = '';
    };

    const handleSaveImage = () => {
        if (!item.image) return;
        const link = document.createElement('a');
        link.href = `data:${item.image.mimeType};base64,${item.image.base64}`;
        const fileName = (item.name || `lore-image-${item.id}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${fileName}.${item.image.mimeType.split('/')[1] || 'png'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-gray-900/70 rounded-lg border border-gray-700 transition-all duration-300">
            <input type="file" ref={itemFileInputRef} onChange={handleFileSelected} className="hidden" accept=".json" />
            <input type="file" ref={imageInputRef} onChange={handleImageFileSelected} className="hidden" accept="image/png,image/jpeg,image/webp" />

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 text-left"
                aria-expanded={isOpen}
            >
                <div className="flex items-center">
                    {getIconForType(item.type)}
                    <span className="font-semibold text-purple-400">{item.name || `Unnamed ${item.type}`}</span>
                </div>
                {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-700/50 space-y-4 animate-fade-in-fast">
                    <div className="space-y-4">
                       {item.type === 'Custom' && (
                             <FormInput label="Custom Type Name" id={`custom-type-${item.id}`} type="text" value={item.customTypeName} onChange={e => handleChange('customTypeName', e.target.value)} placeholder="e.g., Magic System" />
                       )}
                        <FormInput 
                            label="Name" 
                            id={`name-${item.id}`} 
                            type="text" 
                            value={item.name} 
                            onChange={e => handleChange('name', e.target.value)} 
                            placeholder={`Name of the ${item.type}`} 
                            onGenerate={() => onGenerateLoreDetail(item.id, 'name')}
                            isGenerating={generatingLoreField?.itemId === item.id && generatingLoreField?.field === 'name'}
                        />
                        <FormTextarea 
                            label="Description" 
                            id={`desc-${item.id}`} 
                            value={item.description} 
                            onChange={e => handleChange('description', e.target.value)} 
                            placeholder={`Description of the ${item.type}`} 
                            onGenerate={() => onGenerateLoreDetail(item.id, 'description')}
                            isGenerating={generatingLoreField?.itemId === item.id && generatingLoreField?.field === 'description'}
                        />
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Image</label>
                            <div className="mt-2 group relative">
                                {item.image ? (
                                    <div className="relative group">
                                        <img src={`data:${item.image.mimeType};base64,${item.image.base64}`} alt={item.name || 'Lore item image'} className="w-full h-auto max-h-60 object-contain rounded-md bg-gray-900/50"/>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 sm:gap-2 transition-opacity rounded-md">
                                            <IconButton onClick={() => onViewImage(`data:${item.image.mimeType};base64,${item.image.base64}`, item.name || 'Image')} title="View Image">
                                                <EyeIcon className="w-5 h-5" />
                                            </IconButton>
                                            <IconButton onClick={handleSaveImage} title="Save Image">
                                                <SaveIcon className="w-5 h-5" />
                                            </IconButton>
                                            <IconButton onClick={() => imageInputRef.current?.click()} title="Change Image">
                                                <PencilIcon className="w-5 h-5" />
                                            </IconButton>
                                            <IconButton onClick={() => onGenerateImage(item.id)} title="Regenerate Image">
                                                <SparklesIcon className="w-5 h-5" />
                                            </IconButton>
                                            <IconButton onClick={() => onUpdateImage(item.id, null)} title="Remove Image" className="hover:bg-red-900/50 hover:text-red-300">
                                                <TrashIcon className="w-5 h-5" />
                                            </IconButton>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button onClick={() => imageInputRef.current?.click()} className="relative block w-full rounded-lg border-2 border-dashed border-gray-600 p-8 text-center hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-colors">
                                            <PhotoIcon className="mx-auto h-12 w-12 text-gray-500" />
                                            <span className="mt-2 block text-sm font-semibold text-gray-400">Upload an image</span>
                                        </button>
                                        <button onClick={() => onGenerateImage(item.id)} disabled={isGeneratingImage === item.id} className="group relative block w-full rounded-lg border-2 border-dashed border-gray-600 p-8 text-center hover:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-colors">
                                            <SparklesIcon className="mx-auto h-12 w-12 text-gray-500 group-hover:text-purple-400 transition-colors" />
                                            <span className="mt-2 block text-sm font-semibold text-gray-400">Generate with AI</span>
                                        </button>
                                    </div>
                                )}
                                {(isUpdatingImage === item.id || isGeneratingImage === item.id) && (
                                    <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center rounded-lg">
                                        <Loader />
                                        <span className="mt-2 text-sm text-purple-300">
                                            {isGeneratingImage === item.id ? 'Generating image...' : 'Processing image...'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <button onClick={handleSaveThisItem} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors" title="Save this item to a .json file">
                                <SaveIcon className="w-4 h-4" />
                                Save Item
                            </button>
                             <button onClick={handleLoadItemClick} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors" title="Replace this item with data from a .json file">
                                <UploadIcon className="w-4 h-4" />
                                Load Item
                            </button>
                        </div>
                        <button onClick={() => onDelete(item.id)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-red-800 text-red-100 rounded-md hover:bg-red-700 transition-colors">
                            <TrashIcon className="w-4 h-4" />
                            Delete
                        </button>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};


// --- Main Builder Component ---
interface LoreBuilderProps {
    worldName: string;
    onWorldNameChange: Dispatch<SetStateAction<string>>;
    worldDescription: string;
    onWorldDescriptionChange: Dispatch<SetStateAction<string>>;
    loreItems: LoreItem[];
    onUpdateLoreItems: Dispatch<SetStateAction<LoreItem[]>>;
    onGenerateWorldDetail: (field: 'name' | 'description') => void;
    generatingWorldField: 'name' | 'description' | null;
    onGenerateLoreDetail: (itemId: string, field: 'name' | 'description') => void;
    generatingLoreField: { itemId: string; field: 'name' | 'description' } | null;
    onImportCharacterCard: (file: File) => void;
    isImporting: boolean;
    onUpdateLoreItemImage: (itemId: string, file: File | null) => void;
    isUpdatingImage: string | null;
    onGenerateLoreItemImage: (itemId:string) => void;
    isGeneratingImage: string | null;
    onViewImage: (src: string, name: string) => void;
    onLoadFullWorldFile: (file: File) => void;
    onLoadWorldInfoFile: (file: File) => void;
    onLoadSingleLoreItemFile: (itemId: string, file: File) => void;
    onGenerateFullWorld: (options: WorldGenOptions, mode: 'fast' | 'deep') => Promise<void>;
    isGeneratingWorld: boolean;
    onClearWorld: () => void;
}

const LoreBuilder: React.FC<LoreBuilderProps> = ({ 
    worldName, onWorldNameChange,
    worldDescription, onWorldDescriptionChange,
    loreItems, onUpdateLoreItems,
    onGenerateWorldDetail, generatingWorldField,
    onGenerateLoreDetail, generatingLoreField,
    onImportCharacterCard, isImporting,
    onUpdateLoreItemImage, isUpdatingImage,
    onGenerateLoreItemImage, isGeneratingImage,
    onViewImage,
    onLoadFullWorldFile, onLoadWorldInfoFile, onLoadSingleLoreItemFile,
    onGenerateFullWorld, isGeneratingWorld,
    onClearWorld,
}) => {
    const [view, setView] = useState<'editor' | 'generator'>('editor');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const lastItemRef = useRef<HTMLDivElement>(null);
    const worldInfoFileInputRef = useRef<HTMLInputElement>(null);
    const fullWorldFileInputRef = useRef<HTMLInputElement>(null);
    const charCardInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // If a new item was added (by import or manually), find it and set it as the one to open
        const latestItem = loreItems.length > 0 ? loreItems[loreItems.length - 1] : null;
        if (latestItem && latestItem.id !== editingItemId) {
            setEditingItemId(latestItem.id);
        }
    }, [loreItems]);

    useEffect(() => {
        if (editingItemId && lastItemRef.current) {
            lastItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [editingItemId]);

    const handleAddLoreItem = (type: LoreType) => {
        const newItem: LoreItem = {
            id: Date.now().toString(),
            type,
            name: '',
            description: '',
            ...(type === 'Custom' && { customTypeName: 'Custom' })
        };
        onUpdateLoreItems(prev => [...prev, newItem]);
        setEditingItemId(newItem.id);
    };

    const handleDeleteLoreItem = (id: string) => {
        onUpdateLoreItems(prev => prev.filter(c => c.id !== id));
    };

    const handleUpdateLoreItem = (updatedItem: LoreItem) => {
        onUpdateLoreItems(prev => prev.map(c => c.id === updatedItem.id ? updatedItem : c));
    };

    // --- World Info Save/Load ---
    const handleSaveWorldInfo = () => {
        const dataToSave = { worldName, worldDescription };
        const dataStr = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = (worldName || 'world-info').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${fileName}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleLoadWorldInfoClick = () => {
        worldInfoFileInputRef.current?.click();
    };
    
    const handleWorldInfoFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onLoadWorldInfoFile(file);
        }
        if(event.target) event.target.value = '';
    };


    // --- Full World Save/Load ---
    const handleSaveFullWorld = () => {
        if (loreItems.length === 0 && !worldName && !worldDescription) {
            alert("There is nothing to save.");
            return;
        }
        const dataToSave = { worldName, worldDescription, loreItems };
        const dataStr = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = (worldName || 'world-lore').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${fileName}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleLoadFullWorldClick = () => {
        fullWorldFileInputRef.current?.click();
    };

    const handleFullWorldFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onLoadFullWorldFile(file);
        }
        if(event.target) event.target.value = '';
    };

    const handleImportClick = () => {
        charCardInputRef.current?.click();
    };

    const handleCharCardFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImportCharacterCard(file);
        }
        if (event.target) event.target.value = ''; // Reset file input
    };

    const isLastItem = (id: string) => loreItems.length > 0 && loreItems[loreItems.length - 1].id === id;

    const AddButton = ({ type, children }) => (
        <button onClick={() => handleAddLoreItem(type)} className="flex-1 text-center flex items-center justify-center gap-2 px-2 py-2 text-xs font-semibold bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors">
            {children}
        </button>
    );

    return (
        <div className="space-y-6">
            <input type="file" ref={worldInfoFileInputRef} onChange={handleWorldInfoFileSelected} className="hidden" accept=".json" />
            <input type="file" ref={fullWorldFileInputRef} onChange={handleFullWorldFileSelected} className="hidden" accept=".json" />
            <input type="file" ref={charCardInputRef} onChange={handleCharCardFileSelected} className="hidden" accept="image/png,image/jpeg,image/webp" />
            
            <div className="flex justify-center">
                <button
                    onClick={() => setView(view === 'editor' ? 'generator' : 'editor')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                    {view === 'editor' ? <GlobeAltIcon className="w-5 h-5"/> : <PencilIcon className="w-5 h-5" />}
                    {view === 'editor' ? 'Generate Full World' : 'Manual Editor'}
                </button>
            </div>
            
            {view === 'generator' ? (
                <WorldGenerator 
                    onGenerate={onGenerateFullWorld} 
                    isLoading={isGeneratingWorld}
                />
            ) : (
             <>
                <fieldset className="border border-gray-700 p-4 rounded-lg space-y-4">
                    <legend className="px-2 text-base font-semibold text-purple-400">World Foundation</legend>
                    <FormInput 
                        label="World Name" 
                        id="world-name" 
                        type="text" 
                        value={worldName} 
                        onChange={e => onWorldNameChange(e.target.value)} 
                        placeholder="e.g., The Ashen Dominion of Aerthos" 
                        onGenerate={() => onGenerateWorldDetail('name')}
                        isGenerating={generatingWorldField === 'name'}
                    />
                    <FormTextarea 
                        label="World Description" 
                        id="world-description" 
                        value={worldDescription} 
                        onChange={e => onWorldDescriptionChange(e.target.value)} 
                        placeholder="A brief, evocative summary of your world's core concept, history, or conflict." 
                        onGenerate={() => onGenerateWorldDetail('description')}
                        isGenerating={generatingWorldField === 'description'}
                    />
                     <div className="flex items-center gap-2 pt-2">
                        <button onClick={handleLoadWorldInfoClick} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors" title="Load just the World Name & Description from a file">
                            <UploadIcon className="w-4 h-4" /> Load Info
                        </button>
                        <button onClick={handleSaveWorldInfo} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors" title="Save just the World Name & Description to a file">
                            <SaveIcon className="w-4 h-4" /> Save Info
                        </button>
                    </div>
                </fieldset>

                <fieldset className="border border-gray-700 p-4 rounded-lg space-y-3">
                     <legend className="px-2 text-base font-semibold text-purple-400">Manage Full World</legend>
                     <p className="text-sm text-gray-400 text-center">Save or load the entire world, including its foundation and all lore items below.</p>
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={handleLoadFullWorldClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors" title="Load a complete World from a .json file">
                            <UploadIcon className="w-5 h-5" /> Load World
                        </button>
                        <button onClick={handleSaveFullWorld} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors" title="Save the complete World to a .json file">
                            <SaveIcon className="w-5 h-5" /> Save World
                        </button>
                    </div>
                    <div className="pt-3 mt-3 border-t border-gray-700/50 flex justify-center">
                        <button 
                            onClick={onClearWorld}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-800 text-red-100 rounded-md hover:bg-red-700 transition-colors"
                            title="Clear all world information. This cannot be undone."
                        >
                            <TrashIcon className="w-5 h-5" /> Clear Entire World
                        </button>
                    </div>
                </fieldset>
                
                <fieldset className="border border-gray-700 p-4 rounded-lg space-y-4">
                    <legend className="px-2 text-base font-semibold text-purple-400">Add to World Lore</legend>
                    
                    <button 
                        onClick={handleImportClick} 
                        disabled={isImporting}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-bold bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:bg-pink-800 disabled:cursor-not-allowed"
                        title="Import a Character from an image file (PNG, JPG, WEBP)"
                    >
                        {isImporting ? <Loader className="w-5 h-5 animate-spin" /> : <PhotoIcon className="w-5 h-5" />}
                        {isImporting ? 'Analyzing Image...' : 'Import Character from Image'}
                    </button>
                    
                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-xs">OR ADD MANUALLY</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                       <AddButton type="Character"><UsersIcon className="w-4 h-4"/> Character</AddButton>
                       <AddButton type="Race"><UsersIcon className="w-4 h-4"/> Race</AddButton>
                       <AddButton type="Faction"><FlagIcon className="w-4 h-4"/> Faction</AddButton>
                       <AddButton type="Location"><MapPinIcon className="w-4 h-4"/> Location</AddButton>
                       <AddButton type="Custom"><TagIcon className="w-4 h-4"/> Custom</AddButton>
                    </div>
                </fieldset>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 -mr-2 rounded-lg">
                    {loreItems.length > 0 ? (
                        loreItems.map(item => (
                             <div key={item.id} ref={isLastItem(item.id) && editingItemId === item.id ? lastItemRef : null}>
                                <LoreItemEditor
                                    item={item}
                                    onUpdate={handleUpdateLoreItem}
                                    onDelete={handleDeleteLoreItem}
                                    onLoadItemFile={onLoadSingleLoreItemFile}
                                    isInitiallyOpen={editingItemId === item.id}
                                    onGenerateLoreDetail={onGenerateLoreDetail}
                                    generatingLoreField={generatingLoreField}
                                    onUpdateImage={onUpdateLoreItemImage}
                                    isUpdatingImage={isUpdatingImage}
                                    onGenerateImage={onGenerateLoreItemImage}
                                    isGeneratingImage={isGeneratingImage}
                                    onViewImage={onViewImage}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-lg">
                            <p className="text-gray-500">Your world is a blank canvas.</p>
                            <p className="text-gray-500 mt-1">Add or import lore items using the buttons above.</p>
                        </div>
                    )}
                </div>
            </>
            )}
        </div>
    );
};

export default LoreBuilder;