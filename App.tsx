
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Flavor, LoreItem, GeneratedWorldData, WorldGenOptions } from './types';
import { FLAVORS, LENGTH_OPTIONS } from './constants';
import { generateContinuation, generateIdeas, getFullPromptForTokenEstimation, generateLoreDetail, generateWorldName, generateWorldDescription, importCharacterFromImage, generateLoreImage, generateFullWorld } from './services/geminiService';
import * as dbService from './services/dbService';

import Header from './components/Header';
import Settings from './components/Settings';
import FlavorSelector from './components/FlavorSelector';
import StoryInput from './components/StoryInput';
import LoreBuilder from './components/CharacterBuilder';
import ActionButtons from './components/ActionButtons';
import StoryOutput from './components/StoryOutput';
import Modal from './components/Modal';
import { CogIcon, UsersIcon, SaveIcon, UploadIcon } from './components/icons';
import ImageLightbox from './components/ImageLightbox';

const AI_COLORS = ['text-purple-400', 'text-pink-400', 'text-sky-400', 'text-teal-400', 'text-orange-400'];

type StoryPart = {
  text: string;
  type: 'user' | 'ai';
  id: number;
  color?: string;
};

/**
 * Estimates the number of tokens in a given text.
 * A common heuristic is ~4 characters per token.
 * @param text The string to estimate tokens for.
 * @returns An estimated token count.
 */
const estimateTokens = (text: string): number => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // result is in format "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
            const [header, data] = result.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || file.type;
            resolve({ base64: data, mimeType });
        };
        reader.onerror = error => reject(error);
    });
};

const App: React.FC = () => {
  const [storyParts, setStoryParts] = useState<StoryPart[]>(() => {
    try {
        const savedStory = localStorage.getItem('story');
        if (savedStory) {
            const parsedParts = JSON.parse(savedStory);
            if (Array.isArray(parsedParts) && parsedParts.length > 0) {
                return parsedParts;
            }
        }
    } catch (e) {
        console.error("Could not load story from localStorage", e);
    }
    return [{ text: '', type: 'user', id: 0 }];
  });
  
  const [worldName, setWorldName] = useState<string>('');
  const [worldDescription, setWorldDescription] = useState<string>('');
  const [loreItems, setLoreItems] = useState<LoreItem[]>([]);
  
  const [selectedFlavor, setSelectedFlavor] = useState<Flavor>(Flavor.Mysterious);
  const [customFlavor, setCustomFlavor] = useState('');

  const [length, setLength] = useState<number>(LENGTH_OPTIONS[0]);
  const [output, setOutput] = useState<string | string[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoreModalOpen, setIsLoreModalOpen] = useState(false);
  const [generatingLoreField, setGeneratingLoreField] = useState<{itemId: string; field: 'name' | 'description'} | null>(null);
  const [generatingWorldField, setGeneratingWorldField] = useState<'name' | 'description' | null>(null);
  const [isUpdatingImage, setIsUpdatingImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<{ src: string; name: string } | null>(null);
  const [isGeneratingWorld, setIsGeneratingWorld] = useState<boolean>(false);


  // --- LLM Configuration State ---
  const [llmProvider, setLlmProvider] = useState<'gemini' | 'openrouter' | 'koboldcpp'>(
    () => (localStorage.getItem('llmProvider') as any) || 'gemini'
  );
  // OpenRouter
  const [openRouterModel, setOpenRouterModel] = useState<string>(() => localStorage.getItem('openRouterModel') || 'google/gemini-flash-1.5');
  const [openRouterApiKey, setOpenRouterApiKey] = useState<string>(() => localStorage.getItem('openRouterApiKey') || '');
  const [openRouterUrl, setOpenRouterUrl] = useState<string>(() => localStorage.getItem('openRouterUrl') || 'https://openrouter.ai/api/v1');
  const [favoriteModels, setFavoriteModels] = useState<string[]>(() => JSON.parse(localStorage.getItem('favoriteModels') || '[]'));
  // KoboldCpp
  const [koboldCppUrl, setKoboldCppUrl] = useState<string>(() => localStorage.getItem('koboldCppUrl') || 'http://localhost:5001/v1');


  // --- Image Generation Config ---
  const [useHuggingFaceImageGen, setUseHuggingFaceImageGen] = useState<boolean>(() => JSON.parse(localStorage.getItem('useHuggingFaceImageGen') || 'false'));
  const [huggingFaceImageUrl, setHuggingFaceImageUrl] = useState<string>(() => localStorage.getItem('huggingFaceImageUrl') || 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0');
  const [huggingFaceApiKey, setHuggingFaceApiKey] = useState<string>(() => localStorage.getItem('huggingFaceApiKey') || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to save LLM settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('llmProvider', llmProvider);
      localStorage.setItem('openRouterModel', openRouterModel);
      localStorage.setItem('openRouterApiKey', openRouterApiKey);
      localStorage.setItem('openRouterUrl', openRouterUrl);
      localStorage.setItem('favoriteModels', JSON.stringify(favoriteModels));
      localStorage.setItem('koboldCppUrl', koboldCppUrl);
    } catch (e) {
      console.error("Could not save settings to localStorage", e);
    }
  }, [llmProvider, openRouterModel, openRouterApiKey, openRouterUrl, favoriteModels, koboldCppUrl]);

  // Effect to save Image Gen settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('useHuggingFaceImageGen', JSON.stringify(useHuggingFaceImageGen));
      localStorage.setItem('huggingFaceImageUrl', huggingFaceImageUrl);
      localStorage.setItem('huggingFaceApiKey', huggingFaceApiKey);
    } catch (e) {
      console.error("Could not save image gen settings to localStorage", e);
    }
  }, [useHuggingFaceImageGen, huggingFaceImageUrl, huggingFaceApiKey]);

  // Effect to load world data from localStorage on mount
  useEffect(() => {
    try {
      const savedWorldData = localStorage.getItem('worldData');
      if (savedWorldData) {
        const data = JSON.parse(savedWorldData);
        setWorldName(data.worldName || '');
        setWorldDescription(data.worldDescription || '');
        
        const loreItemsWithoutImages = data.loreItems || [];
        setLoreItems(loreItemsWithoutImages);

        // Asynchronously load images from IndexedDB and merge them into the state
        dbService.getAllImages().then(imageMap => {
            if (imageMap.size > 0) {
                setLoreItems(currentItems => 
                    currentItems.map(item => {
                        const imageData = imageMap.get(item.id);
                        return imageData ? { ...item, image: imageData } : item;
                    })
                );
            }
        }).catch(err => console.error("Could not load images from DB", err));

      } else {
        // Fallback for old format
        const savedLore = localStorage.getItem('loreItems');
        if (savedLore) setLoreItems(JSON.parse(savedLore));
      }
    } catch (e) {
      console.error("Could not load world data from localStorage", e);
    }
  }, []);

  // Effect to save world data (text to localStorage, images to IndexedDB)
  useEffect(() => {
    const saveData = async () => {
        try {
            const currentImageIds = new Set<string>();

            // Create a version of loreItems without images for localStorage
            // and save images to IndexedDB
            const loreItemsForStorage = await Promise.all(loreItems.map(async (item) => {
                if (item.image) {
                    currentImageIds.add(item.id);
                    await dbService.saveImage(item.id, item.image);
                    const { image, ...rest } = item;
                    return rest;
                }
                return item;
            }));

            const worldData = { worldName, worldDescription, loreItems: loreItemsForStorage };
            localStorage.setItem('worldData', JSON.stringify(worldData));
            
            // Cleanup unused images from DB
            const idsInDb = await dbService.getAllImageIds();
            const idsToDelete = idsInDb.filter(id => !currentImageIds.has(id));
            if (idsToDelete.length > 0) {
                await dbService.deleteImages(idsToDelete);
            }

        } catch (e) {
            console.error("Could not save world data", e);
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
              setError("Storage quota exceeded. Could not save the latest changes to local storage. Images are stored separately, but text data is too large.");
            }
        }
    };
    saveData();
  }, [worldName, worldDescription, loreItems]);

  // Effect to save story to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('story', JSON.stringify(storyParts));
        } catch (e) {
            console.error("Could not save story to localStorage", e);
        }
    }, [storyParts]);

  const storyText = useMemo(() => storyParts.map(p => p.text).join(''), [storyParts]);
  
  const structuredContext = useMemo(() => {
    let context = '';
    if (worldName.trim()) {
        context += `WORLD NAME: ${worldName.trim()}\n`;
    }
    if (worldDescription.trim()) {
        context += `WORLD DESCRIPTION: ${worldDescription.trim()}\n`;
    }

    if (loreItems.length > 0) {
        if (context) {
            context += '\nLORE ITEMS:\n---\n';
        }
        context += loreItems
            .map(item => {
                const typeHeader = item.type === 'Custom' ? (item.customTypeName || 'Custom').toUpperCase() : item.type.toUpperCase();
                
                let content = `Name: ${item.name.trim()}`;
                if(item.description.trim()){
                    content += `\nDescription: ${item.description.trim()}`;
                }
                if (item.image) {
                    content += `\n(An image is attached to this item.)`;
                }

                return `${typeHeader}:\n${content}`;
            })
            .join('\n\n---\n\n');
    }
    
    return context;
  }, [loreItems, worldName, worldDescription]);

  const promptTokens = useMemo(() => {
    const activeFlavor = customFlavor || selectedFlavor;
    const fullPromptText = getFullPromptForTokenEstimation(storyText, structuredContext, activeFlavor, length);
    return estimateTokens(fullPromptText);
  }, [storyText, structuredContext, customFlavor, selectedFlavor, length]);
  
  const handleStoryChange = (newText: string) => {
    setStoryParts([{ text: newText, type: 'user', id: 0 }]);
  };

  const handleToggleFavoriteModel = (modelId: string) => {
    if (!modelId) return;
    setFavoriteModels(prev => {
        if (prev.includes(modelId)) {
            return prev.filter(m => m !== modelId);
        } else {
            return [...prev, modelId];
        }
    });
  };
  
  const handleContinue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setOutput(null);

    const activeFlavor = customFlavor || selectedFlavor;
    const apiConfig = { 
        provider: llmProvider,
        model: openRouterModel,
        apiKey: openRouterApiKey,
        url: llmProvider === 'openrouter' ? openRouterUrl : koboldCppUrl
    };

    try {
      const continuation = await generateContinuation(storyText, structuredContext, activeFlavor, length, apiConfig);
      
      setStoryParts(prev => {
        const aiPartsCount = prev.filter(p => p.type === 'ai').length;
        const nextColor = AI_COLORS[aiPartsCount % AI_COLORS.length];
        
        let updatedParts = [...prev];
        
        if (updatedParts.length > 0) {
            const lastPartIndex = updatedParts.length - 1;
            const lastPart = updatedParts[lastPartIndex];
            updatedParts[lastPartIndex] = { ...lastPart, text: lastPart.text.trimEnd() };
        }
        
        const storyTextAfterTrim = updatedParts.map(p => p.text).join('');
        const separator = storyTextAfterTrim ? '\n\n' : '';
        
        const newAiPart: StoryPart = { text: separator + continuation, type: 'ai', id: Date.now(), color: nextColor };
        
        return [...updatedParts, newAiPart];
      });

    } catch (e: any) {
      setError(e.message || 'Failed to generate story continuation. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [storyText, structuredContext, selectedFlavor, customFlavor, length, llmProvider, openRouterModel, openRouterApiKey, openRouterUrl, koboldCppUrl]);

  const handleGenerateIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setOutput(null);

    const activeFlavor = customFlavor || selectedFlavor;
    const apiConfig = { 
        provider: llmProvider,
        model: openRouterModel,
        apiKey: openRouterApiKey,
        url: llmProvider === 'openrouter' ? openRouterUrl : koboldCppUrl
    };

    try {
      const ideas = await generateIdeas(storyText, structuredContext, activeFlavor, apiConfig);
      setOutput(ideas);
    } catch (e: any) {
      setError(e.message || 'Failed to generate ideas. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [storyText, structuredContext, selectedFlavor, customFlavor, llmProvider, openRouterModel, openRouterApiKey, openRouterUrl, koboldCppUrl]);


  const handleSelectIdea = (idea: string) => {
    setStoryParts(prev => {
        const aiPartsCount = prev.filter(p => p.type === 'ai').length;
        const nextColor = AI_COLORS[aiPartsCount % AI_COLORS.length];
        
        let updatedParts = [...prev];

        if (updatedParts.length > 0) {
            const lastPartIndex = updatedParts.length - 1;
            const lastPart = updatedParts[lastPartIndex];
            updatedParts[lastPartIndex] = { ...lastPart, text: lastPart.text.trimEnd() };
        }
        
        const storyTextAfterTrim = updatedParts.map(p => p.text).join('');
        const separator = storyTextAfterTrim ? '\n\n' : '';
        
        const newAiPart: StoryPart = { text: separator + idea, type: 'ai', id: Date.now(), color: nextColor };

        return [...updatedParts, newAiPart];
    });
    setOutput(null); // Clear ideas after selection
  };
  
  const handleSelectFlavor = (flavor: Flavor) => {
      setSelectedFlavor(flavor);
      setCustomFlavor('');
  }

  const handleSaveStory = () => {
    const storyContent = storyParts.map(p => p.text).join('');
    if (!storyContent.trim()) {
        alert("The story is empty, nothing to save.");
        return;
    }
    const blob = new Blob([storyContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ai-story.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadStoryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const currentStoryIsNotEmpty = storyParts.length > 1 || (storyParts.length === 1 && storyParts[0].text.trim() !== '');
    
    const proceed = () => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            let storyText = content;

            if (file.type === 'application/json') {
                try {
                    const parsed = JSON.parse(content);
                    // Try to find a meaningful text field, otherwise stringify the whole object
                    if (typeof parsed.story === 'string') {
                        storyText = parsed.story;
                    } else if (typeof parsed.text === 'string') {
                        storyText = parsed.text;
                    } else {
                        storyText = JSON.stringify(parsed, null, 2);
                    }
                } catch {
                    // Not valid JSON, so we'll just use the raw text content
                    storyText = content;
                }
            }
            
            setStoryParts([{ text: storyText, type: 'user', id: Date.now() }]);
        };
        reader.readAsText(file);
        if(event.target) event.target.value = '';
    };

    if (currentStoryIsNotEmpty && !window.confirm('Loading a new file will replace your current story. Are you sure?')) {
        if(event.target) event.target.value = '';
        return;
    }
    
    proceed();
  };

  const handleClearWorld = async () => {
    const isWorldNotEmpty = worldName.trim() !== '' || worldDescription.trim() !== '' || loreItems.length > 0;
    if (isWorldNotEmpty) {
        if (window.confirm('Are you sure you want to clear the entire world? This will delete the world name, description, and all lore items. This action cannot be undone.')) {
            setWorldName('');
            setWorldDescription('');
            setLoreItems([]);
            setOutput(null);
            setError(null);
            try {
                await dbService.clearAllImages();
            } catch (e) {
                console.error("Failed to clear images from DB", e);
                setError("World data cleared, but failed to clear associated images from the database.");
            }
        }
    }
  };

  const handleGenerateWorldDetail = async (field: 'name' | 'description') => {
    setGeneratingWorldField(field);
    try {
        if (field === 'name') {
            const result = await generateWorldName(storyText, loreItems);
            setWorldName(result);
        } else {
            const result = await generateWorldDescription(worldName, storyText, loreItems);
            setWorldDescription(result);
        }
    } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to generate detail: ${e.message}`);
        } else {
            setError('An unknown error occurred while generating detail.');
        }
    } finally {
        setGeneratingWorldField(null);
    }
  };


  const handleGenerateLoreDetail = async (itemId: string, field: 'name' | 'description') => {
    const currentItem = loreItems.find(item => item.id === itemId);
    if (!currentItem) return;

    setGeneratingLoreField({ itemId, field });
    try {
        const otherLore = loreItems.filter(item => item.id !== itemId);
        const result = await generateLoreDetail(storyText, worldName, worldDescription, otherLore, currentItem, field);
        
        setLoreItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, [field]: result } : item
            )
        );

    } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to generate detail: ${e.message}`);
        } else {
            setError('An unknown error occurred while generating detail.');
        }
    } finally {
        setGeneratingLoreField(null);
    }
  };
  
  const handleUpdateLoreItemImage = async (itemId: string, file: File | null) => {
    setIsUpdatingImage(itemId);
    setError(null);
    try {
        if (file === null) {
            // Remove image
            setLoreItems(prev => prev.map(item => {
                if (item.id === itemId) {
                    const { image, ...rest } = item;
                    return rest;
                }
                return item;
            }));
        } else {
            // Add/update image
            if (!file.type.startsWith('image/')) {
                throw new Error('Invalid file type. Please select an image.');
            }
            const { base64, mimeType } = await fileToBase64(file);
            setLoreItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, image: { base64, mimeType } } : item
            ));
        }
    } catch (e: any) {
        setError(e.message || 'Failed to update image.');
    } finally {
        setIsUpdatingImage(null);
    }
  };

  const handleGenerateLoreItemImage = async (itemId: string) => {
    const currentItem = loreItems.find(item => item.id === itemId);
    if (!currentItem) return;

    setIsGeneratingImage(itemId);
    setError(null);
    const imageGenApiConfig = { 
        useHuggingFace: useHuggingFaceImageGen, 
        hfApiKey: huggingFaceApiKey, 
        hfUrl: huggingFaceImageUrl 
    };
    try {
        const imageData = await generateLoreImage(currentItem, worldName, worldDescription, imageGenApiConfig);
        setLoreItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, image: imageData } : item
        ));
    } catch (e: any) {
        setError(e.message || 'Failed to generate image.');
    } finally {
        setIsGeneratingImage(null);
    }
  };


  const handleImportCharacterCard = async (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError('Invalid file type. Please select an image.');
        return;
    }
    setIsImporting(true);
    setError(null);
    try {
        const { base64, mimeType } = await fileToBase64(file);
        const characterData = await importCharacterFromImage(base64, mimeType);
        
        if (characterData.name === 'Import Failed') {
            throw new Error(characterData.description);
        }

        const newItem: LoreItem = {
            id: Date.now().toString(),
            type: 'Character',
            name: characterData.name,
            description: characterData.description,
            image: { base64, mimeType } // Also attach the imported image
        };
        
        setLoreItems(prev => [...prev, newItem]);
        if (!isLoreModalOpen) {
            setIsLoreModalOpen(true);
        }

    } catch (e: any) {
        setError(e.message || 'Failed to import character card. The image may be unclear or the format unsupported.');
        console.error(e);
    } finally {
        setIsImporting(false);
    }
  };

  const handleViewImage = (src: string, name: string) => {
    setViewingImage({ src, name });
  };

  const handleCloseImage = () => {
    setViewingImage(null);
  };

  const handleLoadFullWorldFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const content = e.target?.result as string;
            if (!content) throw new Error("File is empty.");
            const parsed = JSON.parse(content);
            
            const isNewFormat = 'loreItems' in parsed && Array.isArray(parsed.loreItems);

            if (isNewFormat) {
                if (window.confirm('This will replace your entire current world. Are you sure?')) {
                    await dbService.clearAllImages();
                    setWorldName(parsed.worldName || '');
                    setWorldDescription(parsed.worldDescription || '');
                    setLoreItems(parsed.loreItems || []);
                }
            } else {
                throw new Error("Invalid JSON format. Expected a full world export object.");
            }
        } catch (err) {
             alert(`Error loading JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };
    reader.readAsText(file);
  };

  const handleLoadWorldInfoFile = (file: File) => {
      const reader = new FileReader();
      reader.onload = e => {
          try {
              const content = e.target?.result as string;
              if (!content) throw new Error("File is empty.");
              const parsed = JSON.parse(content);

              if (typeof parsed.worldName === 'string' || typeof parsed.worldDescription === 'string') {
                  if (window.confirm('This will replace the current World Name and Description. Are you sure?')) {
                      setWorldName(parsed.worldName || worldName);
                      setWorldDescription(parsed.worldDescription || worldDescription);
                  }
              } else {
                  throw new Error("Invalid JSON format. Expected an object with 'worldName' and/or 'worldDescription'.");
              }
          } catch (err) {
               alert(`Error loading JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
      };
      reader.readAsText(file);
  };

  const handleLoadSingleLoreItemFile = (itemId: string, file: File) => {
      const reader = new FileReader();
      reader.onload = e => {
          try {
              const content = e.target?.result as string;
              if (!content) throw new Error("File is empty.");
              const parsed = JSON.parse(content);
              
              if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed) || !parsed.type) {
                  throw new Error("Invalid JSON format. Expected a single lore item object.");
              }
              
              const currentItemName = loreItems.find(i => i.id === itemId)?.name || 'this item';
              if (!window.confirm(`This will replace the content of "${currentItemName}" with the data from the file. Are you sure?`)) {
                  return;
              }

              setLoreItems(prevItems => prevItems.map(item => {
                  if (item.id === itemId) {
                      return {
                          ...item, // keep original id
                          type: parsed.type || item.type,
                          name: parsed.name || 'Unnamed Import',
                          description: parsed.description || '',
                          customTypeName: parsed.customTypeName || (parsed.type === 'Custom' ? 'Custom' : undefined),
                          image: parsed.image || undefined,
                      };
                  }
                  return item;
              }));

          } catch (err) {
              alert(`Error loading item from JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
      };
      reader.readAsText(file);
  };

  const handleGenerateFullWorld = async (options: WorldGenOptions, mode: 'fast' | 'deep') => {
    if (worldName || worldDescription || loreItems.length > 0) {
        if (!window.confirm("This will replace your current world information. Are you sure you want to proceed?")) {
            return;
        }
    }
    
    setIsGeneratingWorld(true);
    setError(null);
    try {
        const result = await generateFullWorld(options, mode);
        
        await dbService.clearAllImages(); // Clear old images on new world gen
        
        setWorldName(result.worldName);

        // Process detailed sections for deep generation
        let fullDescription = result.premise;
        if (mode === 'deep' && result.detailedSections) {
            const sections = result.detailedSections;
            const formattedDetails = Object.entries(sections)
                .map(([key, value]) => {
                    if (!value) return '';
                    const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    const content = value.split('\n').map(line => `- ${line}`).join('\n');
                    return `\n\n### ${title}\n${content}`;
                })
                .join('');
            fullDescription += formattedDetails;
        }
        setWorldDescription(fullDescription);
        
        const newLoreItems: LoreItem[] = [];
        
        // --- Factions ---
        result.factions.forEach(f => {
            const descParts = [
                `Goal: ${f.goal}`,
                `Method: ${f.method}`,
                `Resource: ${f.resource}`,
                `Flaw: ${f.flaw}`
            ];
            if(f.leaderArchetype) descParts.push(`Leader Archetype: ${f.leaderArchetype}`);
            if(f.leverage) descParts.push(`Leverage: ${f.leverage}`);
            if(f.fractureRisk) descParts.push(`Fracture Risk: ${f.fractureRisk}`);

            newLoreItems.push({
                id: `faction-${Date.now()}-${Math.random()}`,
                type: 'Faction',
                name: f.name,
                description: descParts.join('\n')
            });
        });

        // --- Races ---
        result.races.forEach(r => {
            const descParts = [
                `Hallmark Trait: ${r.hallmark}`,
                `Limitation: ${r.limitation}`,
                `Cultural Quirk: ${r.quirk}`
            ];
            if(r.physiologyQuirk) descParts.push(`Physiology Quirk: ${r.physiologyQuirk}`);
            if(r.socialRole) descParts.push(`Social Role: ${r.socialRole}`);
            if(r.prejudice) descParts.push(`Prejudice: ${r.prejudice}`);
            if(r.gift) descParts.push(`Gift: ${r.gift}`);

            newLoreItems.push({
                id: `race-${Date.now()}-${Math.random()}`,
                type: 'Race',
                name: r.name,
                description: descParts.join('\n')
            });
        });

        // --- Main Character ---
        const mc = result.mainCharacter;
        const mcDescParts = [
            `Role: ${options.mcRole}`,
            `Desire: ${mc.desire}`,
            `Fear: ${mc.fear}`,
            `Edge: ${mc.edge}`,
            `Problem: ${mc.problem}`
        ];
        if(mc.scar) mcDescParts.push(`Past Scar: ${mc.scar}`);
        if(mc.need) mcDescParts.push(`Current Need: ${mc.need}`);
        if(mc.secret) mcDescParts.push(`Secret: ${mc.secret}`);
        if(mc.lineInSand) mcDescParts.push(`Line-in-the-Sand: ${mc.lineInSand}`);
        newLoreItems.push({
            id: `mc-${Date.now()}`,
            type: 'Character',
            name: mc.name,
            description: mcDescParts.join('\n')
        });

        // --- Antagonist ---
        const antag = result.antagonist;
        const antagDescParts = [
            `Role: Antagonist (${options.antagonistShape})`,
            `Motive: ${antag.motive}`,
            `Leverage: ${antag.leverage}`,
            `Weakness: ${antag.weakness}`
        ];
        if(antag.desiredFuture) antagDescParts.push(`Desired Future: ${antag.desiredFuture}`);
        if(antag.lineTheyWontCross) antagDescParts.push(`Line They Won't Cross: ${antag.lineTheyWontCross}`);
        if(antag.doomClock) antagDescParts.push(`Doom Clock: ${antag.doomClock}`);
        newLoreItems.push({
            id: `antagonist-${Date.now()}`,
            type: 'Character',
            name: antag.name,
            description: antagDescParts.join('\n')
        });

        // --- Allies & Rival (Deep mode) ---
        if(result.allies) {
            result.allies.forEach(ally => {
                newLoreItems.push({
                    id: `ally-${Date.now()}-${Math.random()}`,
                    type: 'Character',
                    name: ally.name,
                    description: `Role: Ally\nDetails: ${ally.role}\nUnique Edge: ${ally.edge}`
                });
            });
        }
        if(result.rival) {
            newLoreItems.push({
                id: `rival-${Date.now()}`,
                type: 'Character',
                name: result.rival.name,
                description: `Role: Rival\nObsession: ${result.rival.obsession}\nBlind Spot: ${result.rival.blindSpot}`
            });
        }
        
        setLoreItems(newLoreItems);

        // Add starter hooks to story
        const starterHooksText = result.starterHooks.map((hook, i) => `SCENE HOOK ${i + 1}:\n${hook}`).join('\n\n');
        const hooksHeader = "--- WORLD GENERATION STARTER HOOKS ---\n\n";
        setStoryParts([{ text: hooksHeader + starterHooksText, type: 'user', id: Date.now() }]);

        setIsLoreModalOpen(false); // Close the modal on success

    } catch (e: any) {
        setError(e.message || 'Failed to generate world. Please try again.');
        console.error(e);
    } finally {
        setIsGeneratingWorld(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto relative">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-0 right-0 p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors duration-200 z-10"
          aria-label="Open API Settings"
        >
          <CogIcon className="w-6 h-6"/>
        </button>
        <Header />
        
        <main className="space-y-8 mt-8">
          
          <div className="space-y-6 p-6 bg-gray-800 rounded-2xl shadow-lg flex flex-col">
            <h2 className="text-xl font-bold text-purple-400">1. World Lore</h2>
            <div className="space-y-3 flex-grow flex flex-col justify-center">
                <p className="text-sm text-gray-400">Define characters, races, factions, and locations to give the AI richer context for your story.</p>
                <button 
                  onClick={() => setIsLoreModalOpen(true)} 
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                    <UsersIcon className="w-5 h-5" />
                    Manage World Lore
                </button>
                <div className="text-xs text-gray-500 pt-1 text-center truncate">
                    {worldName 
                        ? <span className="font-semibold text-purple-300">{worldName}</span> 
                        : loreItems.length > 0 
                            ? `Defined: ${loreItems.map(c => c.name || 'Unnamed').join(', ')}`
                            : "No lore defined yet."
                    }
                </div>
            </div>
          </div>

          <div className="space-y-6 p-6 bg-gray-800 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-purple-400">2. Choose the Flavor</h2>
            <FlavorSelector
              flavors={FLAVORS}
              selectedFlavor={selectedFlavor}
              onSelectFlavor={handleSelectFlavor}
              customFlavor={customFlavor}
              onCustomFlavorChange={setCustomFlavor}
            />
          </div>

          <div className="p-6 bg-gray-800 rounded-2xl shadow-lg space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-purple-400">3. Write Your Story</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSaveStory}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors"
                        title="Save story to file"
                    >
                        <SaveIcon className="w-4 h-4" />
                        Save
                    </button>
                    <button
                        onClick={handleLoadStoryClick}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors"
                        title="Load story from file"
                    >
                        <UploadIcon className="w-4 h-4" />
                        Load
                    </button>
                </div>
            </div>
            <StoryInput storyParts={storyParts} onStoryChange={handleStoryChange} />
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileLoad}
                className="hidden"
                accept=".txt,.md,.json"
            />
          </div>
          
          <div className="p-6 bg-gray-800 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-purple-400 mb-4">4. Generate What's Next</h2>
            <ActionButtons
              length={length}
              onLengthChange={setLength}
              onContinue={handleContinue}
              onGenerateIdeas={handleGenerateIdeas}
              isLoading={isLoading || isImporting || !!isGeneratingImage || isGeneratingWorld}
              lengthOptions={LENGTH_OPTIONS}
              promptTokens={promptTokens}
            />
          </div>
          
          <StoryOutput output={output} isLoading={isLoading || isImporting || !!isGeneratingImage || isGeneratingWorld} error={error} onSelectIdea={handleSelectIdea} />
        </main>
      </div>

      <Modal title="API Configuration" isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        <Settings
          llmProvider={llmProvider}
          onLlmProviderChange={setLlmProvider}
          openRouterModel={openRouterModel}
          onOpenRouterModelChange={setOpenRouterModel}
          openRouterApiKey={openRouterApiKey}
          onOpenRouterApiKeyChange={setOpenRouterApiKey}
          openRouterUrl={openRouterUrl}
          onOpenRouterUrlChange={setOpenRouterUrl}
          favoriteModels={favoriteModels}
          onToggleFavoriteModel={handleToggleFavoriteModel}
          koboldCppUrl={koboldCppUrl}
          onKoboldCppUrlChange={setKoboldCppUrl}
          useHuggingFaceImageGen={useHuggingFaceImageGen}
          onUseHuggingFaceImageGenChange={setUseHuggingFaceImageGen}
          huggingFaceImageUrl={huggingFaceImageUrl}
          onHuggingFaceImageUrlChange={setHuggingFaceImageUrl}
          huggingFaceApiKey={huggingFaceApiKey}
          onHuggingFaceApiKeyChange={setHuggingFaceApiKey}
        />
      </Modal>

      <Modal title="World Lore Builder" isOpen={isLoreModalOpen} onClose={() => setIsLoreModalOpen(false)}>
        <LoreBuilder
          worldName={worldName}
          onWorldNameChange={setWorldName}
          worldDescription={worldDescription}
          onWorldDescriptionChange={setWorldDescription}
          loreItems={loreItems}
          onUpdateLoreItems={setLoreItems}
          onGenerateWorldDetail={handleGenerateWorldDetail}
          generatingWorldField={generatingWorldField}
          onGenerateLoreDetail={handleGenerateLoreDetail}
          generatingLoreField={generatingLoreField}
          onImportCharacterCard={handleImportCharacterCard}
          isImporting={isImporting}
          onUpdateLoreItemImage={handleUpdateLoreItemImage}
          isUpdatingImage={isUpdatingImage}
          onGenerateLoreItemImage={handleGenerateLoreItemImage}
          isGeneratingImage={isGeneratingImage}
          onViewImage={handleViewImage}
          onLoadFullWorldFile={handleLoadFullWorldFile}
          onLoadWorldInfoFile={handleLoadWorldInfoFile}
          onLoadSingleLoreItemFile={handleLoadSingleLoreItemFile}
          onGenerateFullWorld={handleGenerateFullWorld}
          isGeneratingWorld={isGeneratingWorld}
          onClearWorld={handleClearWorld}
        />
      </Modal>

      {viewingImage && (
        <ImageLightbox
          imageSrc={viewingImage.src}
          imageName={viewingImage.name}
          onClose={handleCloseImage}
        />
      )}
    </div>
  );
};

export default App;
