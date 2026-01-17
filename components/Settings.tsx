
import React, { useState, useEffect, useMemo } from 'react';
import { StarIcon, CloseIcon } from './icons';
import { fetchOpenRouterModels, OpenRouterModelInfo } from '../services/geminiService';

interface SettingsProps {
  llmProvider: 'gemini' | 'openrouter' | 'koboldcpp';
  onLlmProviderChange: (value: 'gemini' | 'openrouter' | 'koboldcpp') => void;
  openRouterUrl: string;
  onOpenRouterUrlChange: (value: string) => void;
  openRouterApiKey: string;
  onOpenRouterApiKeyChange: (value: string) => void;
  openRouterModel: string;
  onOpenRouterModelChange: (value: string) => void;
  favoriteModels: string[];
  onToggleFavoriteModel: (modelId: string) => void;
  koboldCppUrl: string;
  onKoboldCppUrlChange: (value: string) => void;
  useHuggingFaceImageGen: boolean;
  onUseHuggingFaceImageGenChange: (value: boolean) => void;
  huggingFaceImageUrl: string;
  onHuggingFaceImageUrlChange: (value: string) => void;
  huggingFaceApiKey: string;
  onHuggingFaceApiKeyChange: (value: string) => void;
}

const Settings: React.FC<SettingsProps> = ({
  llmProvider,
  onLlmProviderChange,
  openRouterUrl,
  onOpenRouterUrlChange,
  openRouterApiKey,
  onOpenRouterApiKeyChange,
  openRouterModel,
  onOpenRouterModelChange,
  favoriteModels,
  onToggleFavoriteModel,
  koboldCppUrl,
  onKoboldCppUrlChange,
  useHuggingFaceImageGen,
  onUseHuggingFaceImageGenChange,
  huggingFaceImageUrl,
  onHuggingFaceImageUrlChange,
  huggingFaceApiKey,
  onHuggingFaceApiKeyChange,
}) => {
  const [models, setModels] = useState<OpenRouterModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const llmProviders = [
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'openrouter', name: 'OpenRouter' },
    { id: 'koboldcpp', name: 'KoboldCpp (Local)' },
  ];

  useEffect(() => {
    if (llmProvider === 'openrouter') {
      const getModels = async () => {
        setIsLoadingModels(true);
        setModelsError(null);
        setModels([]);
        try {
          const urlToFetch = openRouterUrl.trim() || 'https://openrouter.ai/api/v1';
          const fetchedModels = await fetchOpenRouterModels(urlToFetch);
          setModels(fetchedModels);
        } catch (err) {
          if (err instanceof Error) {
            setModelsError(err.message);
          } else {
            setModelsError("An unknown error occurred while fetching models.");
          }
        } finally {
          setIsLoadingModels(false);
        }
      };
      getModels();
    }
  }, [llmProvider, openRouterUrl]);

  const { favoriteModelOptions, otherModelOptions } = useMemo(() => {
    if (!models.length) return { favoriteModelOptions: [], otherModelOptions: [] };
    
    const favs = models
      .filter(m => favoriteModels.includes(m.id))
      .sort((a, b) => a.id.localeCompare(b.id));

    const others = models.filter(m => !favoriteModels.includes(m.id));

    return { favoriteModelOptions: favs, otherModelOptions: others };
  }, [models, favoriteModels]);

  const selectedModelInfo = useMemo(() => models.find(m => m.id === openRouterModel), [models, openRouterModel]);
  const isCurrentModelFavorite = useMemo(() => favoriteModels.includes(openRouterModel), [favoriteModels, openRouterModel]);

  return (
    <div className="space-y-6">
      <div>
          <h3 className="text-base font-semibold text-purple-400 mb-2 text-center">Language Model Provider</h3>
          <div className="flex justify-center gap-1 p-1 rounded-lg bg-gray-900/50">
              {llmProviders.map(p => (
                  <button
                      key={p.id}
                      onClick={() => onLlmProviderChange(p.id as any)}
                      className={`w-full px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200
                        ${llmProvider === p.id
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-gray-300 hover:bg-gray-700'
                        }
                      `}
                  >
                      {p.name}
                  </button>
              ))}
          </div>
      </div>
      
      {llmProvider === 'openrouter' && (
        <div className="space-y-8 pt-4 border-t border-gray-700/50 animate-fade-in">
            <fieldset className="border border-gray-700 p-4 rounded-lg">
                <legend className="px-2 text-sm font-semibold text-purple-400">OpenRouter Credentials & Endpoint</legend>
                <div className="space-y-4 pt-2">
                     <div>
                        <label htmlFor="or-key" className="block text-sm font-medium text-gray-300 mb-1">OpenRouter API Key</label>
                        <input
                            id="or-key"
                            type="password"
                            value={openRouterApiKey}
                            onChange={(e) => onOpenRouterApiKeyChange(e.target.value)}
                            placeholder="sk-or-..."
                            className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-gray-200 placeholder-gray-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="or-url" className="block text-sm font-medium text-gray-300 mb-1">API Base URL (Optional)</label>
                        <input
                            id="or-url"
                            type="text"
                            value={openRouterUrl}
                            onChange={(e) => onOpenRouterUrlChange(e.target.value)}
                            placeholder="https://openrouter.ai/api/v1"
                            className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-gray-200 placeholder-gray-500"
                        />
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                        Find models and get your API key from <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">openrouter.ai</a>.
                    </p>
                </div>
            </fieldset>

            <fieldset className="border border-gray-700 p-4 rounded-lg">
                <legend className="px-2 text-sm font-semibold text-purple-400">Model Selection</legend>
                <div className="space-y-4 pt-2">
                    <div>
                        <label htmlFor="or-model" className="block text-sm font-medium text-gray-300 mb-1">Search & Select Model</label>
                        <div className="flex items-center gap-2">
                            <input
                                id="or-model"
                                type="text"
                                list="or-models-list"
                                value={openRouterModel}
                                onChange={(e) => onOpenRouterModelChange(e.target.value)}
                                placeholder={isLoadingModels ? "Loading models..." : "e.g., google/gemini-flash-1.5"}
                                className="flex-grow w-full px-4 py-2 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-gray-200 placeholder-gray-500 disabled:opacity-50"
                                disabled={isLoadingModels}
                            />
                            <button
                                onClick={() => onToggleFavoriteModel(openRouterModel)}
                                title={isCurrentModelFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                className="flex-shrink-0 p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!openRouterModel || isLoadingModels}
                            >
                                <StarIcon 
                                    className={`w-6 h-6 transition-all duration-200 ${isCurrentModelFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`} 
                                    filled={isCurrentModelFavorite}
                                />
                            </button>
                        </div>
                        <datalist id="or-models-list">
                            {favoriteModelOptions.length > 0 && <optgroup label="Favorites">{favoriteModelOptions.map(m => <option key={m.id} value={m.id} />)}</optgroup>}
                            <optgroup label="All Models">{otherModelOptions.map(m => <option key={m.id} value={m.id} />)}</optgroup>
                        </datalist>
                        {modelsError && <p className="text-xs text-red-400 mt-1">Could not load models. Check URL or network.</p>}
                        {selectedModelInfo && (
                            <div className="text-xs text-gray-400 mt-2 bg-gray-900/50 p-2 rounded-md">
                                <span className="font-semibold text-gray-300">Context Length:</span> {selectedModelInfo.contextLength.toLocaleString()} tokens. 
                                <span className="text-gray-500 italic"> This is the model's "memory" for the story.</span>
                            </div>
                        )}
                    </div>

                    {favoriteModelOptions.length > 0 && (
                        <div className="pt-4 border-t border-gray-700/50">
                            <label htmlFor="or-favorites-select" className="block text-sm font-medium text-gray-300 mb-2">Manage Favorites</label>
                            <div className="space-y-3">
                                <select
                                    id="or-favorites-select"
                                    value={isCurrentModelFavorite ? openRouterModel : ""}
                                    onChange={(e) => onOpenRouterModelChange(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-gray-200"
                                >
                                    <option value="" disabled>Select a favorite to use...</option>
                                    {favoriteModelOptions.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.id} ({model.contextLength.toLocaleString()} tokens)
                                        </option>
                                    ))}
                                </select>
                                <div className="flex flex-wrap gap-2">
                                    {favoriteModelOptions.map(model => (
                                        <div key={model.id} className="bg-gray-700 text-gray-200 text-xs font-medium pl-2.5 pr-1 py-1 rounded-full flex items-center gap-1.5">
                                            <span>{model.id}</span>
                                            <button 
                                                onClick={() => onToggleFavoriteModel(model.id)} 
                                                className="p-0.5 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
                                                title={`Remove ${model.id} from favorites`}
                                            >
                                                <CloseIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </fieldset>
        </div>
      )}

      {llmProvider === 'koboldcpp' && (
          <div className="space-y-4 pt-4 border-t border-gray-700/50 animate-fade-in">
              <fieldset className="border border-gray-700 p-4 rounded-lg">
                  <legend className="px-2 text-sm font-semibold text-purple-400">KoboldCpp (Local) Endpoint</legend>
                  <div className="space-y-4 pt-2">
                      <div>
                          <label htmlFor="kcpp-url" className="block text-sm font-medium text-gray-300 mb-1">API Base URL (OpenAI-compatible)</label>
                          <input
                              id="kcpp-url"
                              type="text"
                              value={koboldCppUrl}
                              onChange={(e) => onKoboldCppUrlChange(e.target.value)}
                              placeholder="http://localhost:5001/v1"
                              className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-gray-200 placeholder-gray-500"
                          />
                      </div>
                      <p className="text-xs text-gray-400 text-center">
                          Enter the URL for your local KoboldCpp server's OpenAI-compatible endpoint. No API key is required.
                      </p>
                  </div>
              </fieldset>
          </div>
      )}

        <div className="pt-6 border-t border-gray-700">
            <h3 className="text-base font-semibold text-purple-400 mb-2 text-center">Image Generation Provider</h3>
            <div className="flex justify-between items-center p-2 rounded-lg bg-gray-900/50">
                <span className={`text-sm font-semibold transition-colors ${!useHuggingFaceImageGen ? 'text-purple-400' : 'text-gray-400'}`}>Use Google Imagen</span>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => onUseHuggingFaceImageGenChange(!useHuggingFaceImageGen)}>
                    <div className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${useHuggingFaceImageGen ? 'bg-purple-600' : 'bg-gray-700'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${useHuggingFaceImageGen ? 'translate-x-6' : ''}`}></div>
                    </div>
                </div>
                <span className={`text-sm font-semibold transition-colors ${useHuggingFaceImageGen ? 'text-purple-400' : 'text-gray-400'}`}>Use Hugging Face</span>
            </div>
            
            {useHuggingFaceImageGen && (
                <div className="space-y-4 pt-4 mt-4 border-t border-gray-700/50 animate-fade-in">
                    <div>
                        <label htmlFor="hf-key" className="block text-sm font-medium text-gray-300 mb-1">Hugging Face API Key</label>
                        <input
                            id="hf-key"
                            type="password"
                            value={huggingFaceApiKey}
                            onChange={(e) => onHuggingFaceApiKeyChange(e.target.value)}
                            placeholder="hf_..."
                            className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-gray-200 placeholder-gray-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="hf-url" className="block text-sm font-medium text-gray-300 mb-1">Inference Model URL</label>
                        <input
                            id="hf-url"
                            type="text"
                            value={huggingFaceImageUrl}
                            onChange={(e) => onHuggingFaceImageUrlChange(e.target.value)}
                            placeholder="https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
                            className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-gray-200 placeholder-gray-500"
                        />
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                        Find models and get your API key from <a href="https://huggingface.co/inference-api" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">huggingface.co</a>.
                    </p>
                </div>
            )}
        </div>

      <style>{`
          @keyframes fade-in {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
              animation: fade-in 0.3s ease-out forwards;
          }
      `}</style>
    </div>
  );
};

export default Settings;
