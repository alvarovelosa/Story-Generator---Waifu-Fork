
import React, { useState, useEffect, useRef } from 'react';
import { WorldGenOptions, SupportingCharacter, SupportingCharacterCategory } from '../types';
import Loader from './Loader';
import { SparklesIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from './icons';

interface WorldGeneratorProps {
    onGenerate: (options: WorldGenOptions, mode: 'fast' | 'deep') => Promise<void>;
    isLoading: boolean;
}

const presets = [
    'Frontier Survival',
    'Court Intrigue',
    'Sunken Isles',
    'Aftermath',
    'High Faith',
    'Rising Empire',
];

const subgenreOptions = [
    { value: 'Low', label: 'Low', description: 'Small-scale struggles, grounded and local.' },
    { value: 'Epic', label: 'Epic', description: 'World-shaping conflicts, legendary scope.' },
    { value: 'Grimdark', label: 'Grimdark', description: 'Bleak, cynical worlds of brutality.' },
    { value: 'Noblebright', label: 'Noblebright', description: 'Hopeful, heroic struggles with moral clarity.' },
    { value: 'Weird', label: 'Weird', description: 'Uncanny, surreal, or alien atmosphere.' },
    { value: 'Slice of Life', label: 'Slice of Life', description: 'Everyday rhythms, community, and small joys.' }
];

const biomeOptions = [
    { value: 'Mountains', label: 'Mountains', description: 'Highlands, peaks, impassable ridges.' },
    { value: 'Forest', label: 'Forest', description: 'Dense woods, wild growth, hidden paths.' },
    { value: 'Desert', label: 'Desert', description: 'Arid wastes, scarce water, vast dunes.' },
    { value: 'Plains', label: 'Plains', description: 'Open steppes, grasslands, endless horizon.' },
    { value: 'Swamp', label: 'Swamp', description: 'Wetlands, bogs, treacherous ground.' },
    { value: 'Tundra', label: 'Tundra', description: 'Frozen wastes, permafrost, harsh cold.' },
    { value: 'City', label: 'City', description: 'Urban sprawl, alleys, towers, labyrinths.' },
    { value: 'Oceanic / Archipelago', label: 'Oceanic / Archipelago', description: 'Islands, reefs, or full ocean worlds.' },
    { value: 'Subterranean', label: 'Subterranean', description: 'Caves, undercities, endless depths.' },
    { value: 'Space', label: 'Space', description: 'Orbital habitats, starships, void between worlds.' },
    { value: 'Custom', label: 'Custom', description: 'Define your own biome.' },
];

const travelConstraintOptions = [
    { value: 'Weather', label: 'Weather', description: 'Storms, seasons, climate hazards.' },
    { value: 'Monsters', label: 'Monsters', description: 'Predators, beasts, hostile fauna.' },
    { value: 'Law', label: 'Law', description: 'Borders, permits, bans, curfews.' },
    { value: 'Terrain', label: 'Terrain', description: 'Difficult ground, cliffs, rivers, choke points.' },
    { value: 'Cost', label: 'Cost', description: 'Travel is expensive or resource-draining.' },
    { value: 'Magic / Tech Barriers', label: 'Magic / Tech Barriers', description: 'Arcane wards, sealed gates, or technological lockdowns.' },
];

const techLevels = [
    { name: "Stone Age", description: "Hunter-gatherers, stone/wood tools, fire." },
    { name: "Bronze Age", description: "Early cities, bronze weapons, first writing." },
    { name: "Iron Age", description: "Empires, iron/steel, roads, aqueducts." },
    { name: "Medieval", description: "Feudal systems, castles, sails, early medicine." },
    { name: "Renaissance", description: "Printing, navigation, early science, gunpowder." },
    { name: "Enlightenment / Early Industrial", description: "Steam power, factories, long-range navies." },
    { name: "Late Industrial / Victorian", description: "Railroads, telegraph, mass production." },
    { name: "Early Modern", description: "Cars, planes, electricity, radio." },
    { name: "Modern", description: "Computers, nuclear power, space race." },
    { name: "Near Future", description: "AI, biotech, green energy, space colonies." },
    { name: "Far Future", description: "Interstellar, post-scarcity, transhuman." }
];

const magicLevels = [
    { name: "Null", description: "No magic, only myth/superstition." },
    { name: "Faint Echoes", description: "Omens, rare miracles, spirits." },
    { name: "Folk Magic", description: "Charms, curses, hedge witches, herbal rites." },
    { name: "Ritual Magic", description: "Priests, shamans, ceremonies with repeatable results." },
    { name: "Apprentice Age", description: "Structured spellcraft exists, limited and elite." },
    { name: "Mage Orders", description: "Guilds, academies, codified disciplines." },
    { name: "Arcane Society", description: "Magic entrenched in culture, economy, warfare." },
    { name: "Grand Sorcery", description: "Large-scale enchantments, cities shielded, weather shaped." },
    { name: "Mythic Age", description: "Gods, avatars, magical creatures openly present." },
    { name: "World-Shaping", description: "Reality altered by magic; natural laws pliable." },
    { name: "Transcendent", description: "Civilizations operate beyond natural law; existence is magical essence." }
];

const factionOptions = [
    { value: 1, label: '1', description: 'A single dominant bloc.' },
    { value: 2, label: '2', description: 'Rival powers locked in tension.' },
    { value: 3, label: '3', description: 'Complex balance, unstable politics.' },
    { value: 4, label: '4', description: 'Fragmented, many competing groups.' },
];

const peopleOptions = [
    { value: 0, label: '0', description: 'Only one people / humans only.' },
    { value: 1, label: '1', description: 'One distinct people.' },
    { value: 2, label: '2', description: 'Two distinct peoples.' },
    { value: 3, label: '3', description: 'Three major peoples.' },
];

const characterCategories: { [key in SupportingCharacterCategory]: { types: string[], sliderLabels: [string, string] } } = {
  Friend: { types: ['Mentor', 'Companion', 'Family', 'Protector', 'Student'], sliderLabels: ['Loyal', 'Betrayal Risk'] },
  Rival: { types: ['Rival', 'Ex-Ally', 'Political', 'Romantic', 'Opportunist'], sliderLabels: ['Petty', 'Deadly'] },
  Enemy: { types: ['Henchman', 'Schemer', 'Zealot', 'Corrupted Hero', 'Monster'], sliderLabels: ['Nuisance', 'Lethal Threat'] },
  Neutral: { types: ['Leader', 'Merchant', 'Trickster', 'Outsider', 'Wanderer'], sliderLabels: ['Helpful', 'Dangerous'] },
  LoveInterest: { types: ['Fated', 'Complicated', 'Forbidden', 'Rival → Lover'], sliderLabels: ['Strong Bond', 'High Obstacle'] },
  Family: { types: ['Parent', 'Sibling', 'Child', 'Found Family'], sliderLabels: ['Supportive', 'Strained'] },
  Recurring: { types: ['Comic Relief', 'Gossip', 'Helper', 'Sidekick', 'Local Anchor'], sliderLabels: ['Background', 'Important'] },
};


// --- Helper Components ---
const Section: React.FC<{title: string; children: React.ReactNode; defaultOpen?: boolean}> = ({ title, children, defaultOpen=false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <fieldset className="border border-gray-700 rounded-lg">
            <legend className="w-full px-2">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex justify-between items-center text-sm font-semibold text-purple-400"
                >
                    {title}
                    {isOpen ? <ChevronUpIcon className="w-4 h-4"/> : <ChevronDownIcon className="w-4 h-4"/>}
                </button>
            </legend>
            {isOpen && <div className="p-4 pt-2 space-y-3 animate-fade-in-fast">{children}</div>}
        </fieldset>
    );
};

const RadioGrid = ({ options, selected, onChange, disabled, name }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map(option => (
            <button
                type="button" key={`${name}-${option}`} onClick={() => onChange(selected === option ? null : option)} disabled={disabled}
                className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors duration-200 disabled:opacity-50 ${selected === option ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'}`}>
                {option}
            </button>
        ))}
    </div>
);

const DescriptiveRadioGrid = ({ options, selected, onChange, disabled, name }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map(option => (
            <button
                type="button" key={`${name}-${option.value}`} onClick={() => onChange(selected === option.value ? null : option.value)} disabled={disabled}
                className={`p-3 text-left rounded-md transition-colors duration-200 disabled:opacity-50 ${selected === option.value ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'}`}>
                <span className="font-bold block text-sm">{option.label}</span>
                <span className={`text-xs ${selected === option.value ? 'text-purple-200' : 'text-gray-400'}`}>{option.description}</span>
            </button>
        ))}
    </div>
);

const DescriptiveRadioGridButtons = ({ options, selected, onChange, disabled, name }) => (
    <div className="grid grid-cols-2 gap-2">
        {options.map(option => (
            <button
                type="button" key={`${name}-${option.value}`} onClick={() => onChange(selected === option.value ? null : option.value)} disabled={disabled}
                className={`p-2 text-left rounded-md transition-colors duration-200 disabled:opacity-50 h-full flex flex-col justify-center ${selected === option.value ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'}`}>
                <p className="text-sm">
                    <span className="font-bold">{option.label}</span>
                    <span className={` ${selected === option.value ? 'text-purple-200' : 'text-gray-400'}`}> – {option.description}</span>
                </p>
            </button>
        ))}
    </div>
);

const CheckboxGrid = ({ options, selected, onChange, disabled, name, max=99 }) => (
     <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map(option => (
            <button
                type="button" key={`${name}-${option}`} onClick={() => onChange(option)}
                disabled={disabled || (selected.length >= max && !selected.includes(option)) || (option === 'None' && selected.length > 0 && !selected.includes('None'))}
                className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors duration-200 disabled:opacity-50 ${selected.includes(option) ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'}`}>
                {option}
            </button>
        ))}
    </div>
);

const FormInput: React.FC<any> = ({ label, ...props }) => (
    <div>
        {label && <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>}
        <input {...props} className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-gray-200 placeholder-gray-500 text-sm" />
    </div>
);

// --- Supporting Character Editor ---
const SupportingCharacterEditor = ({ character, onUpdate, onDelete, isLoading }) => {
    const config = characterCategories[character.category];

    const handleFieldChange = (field: keyof SupportingCharacter, value: any) => {
        onUpdate({ ...character, [field]: value });
    };

    return (
        <div className="p-4 border border-gray-700/80 rounded-lg space-y-4 bg-gray-900/50 animate-fade-in-fast">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-purple-300 text-sm uppercase tracking-wider">{character.category}</h4>
                <button type="button" onClick={() => onDelete(character.id)} disabled={isLoading} className="text-gray-500 hover:text-red-400 disabled:opacity-50">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
            
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Select Type</label>
                <div className="flex flex-wrap gap-2">
                    {config.types.map(type => (
                        <button
                            type="button"
                            key={type}
                            disabled={isLoading}
                            onClick={() => handleFieldChange('type', character.type === type ? null : type)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-200 disabled:opacity-50 ${character.type === type ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex justify-between text-xs font-medium text-gray-400 px-1">
                    <span>{config.sliderLabels[0]}</span>
                    <span>{config.sliderLabels[1]}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={character.sliderValue}
                    disabled={isLoading}
                    onChange={e => handleFieldChange('sliderValue', Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50 mt-1"
                />
            </div>
            
            <FormInput
                type="text"
                placeholder="One-liner description (e.g., Gruff veteran, secretly afraid of aging)"
                value={character.description}
                disabled={isLoading}
                onChange={e => handleFieldChange('description', e.target.value)}
            />
        </div>
    );
};

const WorldGenerator: React.FC<WorldGeneratorProps> = ({ onGenerate, isLoading }) => {
    const [mode, setMode] = useState<'fast' | 'deep'>('fast');
    
    // --- State for ALL options ---
    const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
    const [tone, setTone] = useState<'Grounded' | 'Balanced' | 'Wild' | null>('Balanced');
    const [vibes, setVibes] = useState<string[]>([]);
    const [customVibe, setCustomVibe] = useState('');
    const [magicScale, setMagicScale] = useState(3);
    const [techScale, setTechScale] = useState(3);
    const [isMagicTooltipVisible, setIsMagicTooltipVisible] = useState(false);
    const [isTechTooltipVisible, setIsTechTooltipVisible] = useState(false);
    const [isFactionTooltipVisible, setIsFactionTooltipVisible] = useState(false);
    const [isPeopleTooltipVisible, setIsPeopleTooltipVisible] = useState(false);
    const [conflict, setConflict] = useState<'War' | 'Survival' | 'Intrigue' | 'Mystery' | 'Heist' | 'Journey' | null>('War');
    const [setting, setSetting] = useState<'City-state' | 'Empire' | 'Frontier' | 'Island chain' | 'Wasteland' | 'Other' | null>('Empire');
    const [customSetting, setCustomSetting] = useState('');
    const [factionCount, setFactionCount] = useState<number | null>(2);
    const [raceCount, setRaceCount] = useState<number | null>(1);
    const [mcRole, setMcRole] = useState<'Soldier' | 'Healer' | 'Scholar' | 'Outlaw' | 'Merchant' | 'Scout' | 'Custom' | null>('Soldier');
    const [customMcRole, setCustomMcRole] = useState('');
    const [antagonistShape, setAntagonistShape] = useState<'Person' | 'Faction' | 'Environment' | 'Supernatural' | 'Unknown' | null>('Faction');
    const [generateNames, setGenerateNames] = useState(true);
    // Deep options
    const [subgenre, setSubgenre] = useState<'Low' | 'Epic' | 'Grimdark' | 'Noblebright' | 'Weird' | 'Slice of Life' | null>('Epic');
    const [primaryBiome, setPrimaryBiome] = useState<string | null>('Forest');
    const [customPrimaryBiome, setCustomPrimaryBiome] = useState('');
    const [travelConstraint, setTravelConstraint] = useState<'Weather' | 'Monsters' | 'Law' | 'Terrain' | 'Cost' | 'Magic / Tech Barriers' | null>('Terrain');
    const [scarceResource, setScarceResource] = useState('');
    const [resourceController, setResourceController] = useState('');
    const [polity, setPolity] = useState<'Empire' | 'City-states' | 'Tribal' | 'Federation' | null>('Empire');
    const [justiceStyle, setJusticeStyle] = useState<'Code' | 'Custom' | 'Clerical' | 'Might' | null>('Code');
    const [taboos, setTaboos] = useState('');
    const [virtues, setVirtues] = useState('');
    const [lingua, setLingua] = useState<'One' | 'Shared' | 'Many' | null>('Shared');
    const [religionPresence, setReligionPresence] = useState<'None' | 'Folk' | 'Organized' | 'Cults' | null>('Organized');
    const [miracleTest, setMiracleTest] = useState<'Rare' | 'Common' | 'False/Illusions' | null>('Rare');
    const [medicineType, setMedicineType] = useState<'Herbal' | 'Alchemical' | 'Magical' | 'None' | null>('Herbal');
    const [medicineConstraint, setMedicineConstraint] = useState<'Cost' | 'Skill' | 'Taboo' | null>('Skill');
    const [tensions, setTensions] = useState<string[]>(['Border', 'Resource']);
    const [mcScar, setMcScar] = useState('');
    const [mcNeed, setMcNeed] = useState('');
    const [mcSecret, setMcSecret] = useState('');
    const [mcLine, setMcLine] = useState('');
    const [supportingCharacters, setSupportingCharacters] = useState<SupportingCharacter[]>([]);
    const [isAddCharMenuOpen, setIsAddCharMenuOpen] = useState(false);
    const addCharMenuRef = useRef<HTMLDivElement>(null);
    const [antagonistFuture, setAntagonistFuture] = useState('');
    const [antagonistLine, setAntagonistLine] = useState('');
    const [antagonistDoomClock, setAntagonistDoomClock] = useState('');
    const [travelRange, setTravelRange] = useState('');
    const [supplyPain, setSupplyPain] = useState('');
    const [messageSpeed, setMessageSpeed] = useState('');
    const [combatFeel, setCombatFeel] = useState<'Messy' | 'Technical' | 'Brutal' | 'Heroic' | null>('Heroic');
    const [importantInjuries, setImportantInjuries] = useState('');
    const [visualAnchors, setVisualAnchors] = useState('');
    const [hardNoGos, setHardNoGos] = useState('');
    const [softLimits, setSoftLimits] = useState('');

    const handleVibeChange = (vibe: string) => {
        setVibes(prev => {
            if (vibe === 'None') return ['None'];
            if (prev.includes(vibe)) return prev.filter(v => v !== vibe && v !== 'None');
            return [...prev.filter(v => v !== 'None'), vibe];
        });
    };
    
    const handleTensionChange = (tension: string) => {
        setTensions(prev => {
            const newTensions = prev.includes(tension) ? prev.filter(t => t !== tension) : [...prev, tension];
            return newTensions.length > 2 ? newTensions.slice(1) : newTensions; // keep only last 2
        });
    };

    const handlePresetChange = (preset: string) => {
        setSelectedPresets(prev => 
            prev.includes(preset) 
                ? prev.filter(p => p !== preset) 
                : [...prev, preset]
        );
    };

    const handleReset = () => {
        setSelectedPresets([]);
        // Fast options
        setTone(null);
        setVibes([]);
        setCustomVibe('');
        setMagicScale(3); // Keep a sensible default for sliders
        setTechScale(3); // Keep a sensible default for sliders
        setConflict(null);
        setSetting(null);
        setCustomSetting('');
        setFactionCount(null);
        setRaceCount(null);
        setMcRole(null);
        setCustomMcRole('');
        setAntagonistShape(null);
        setGenerateNames(true); // Keep a sensible default for this toggle
    
        // Deep options
        setSubgenre(null);
        setPrimaryBiome(null);
        setCustomPrimaryBiome('');
        setTravelConstraint(null);
        setScarceResource('');
        setResourceController('');
        setPolity(null);
        setJusticeStyle(null);
        setTaboos('');
        setVirtues('');
        setLingua(null);
        setReligionPresence(null);
        setMiracleTest(null);
        setMedicineType(null);
        setMedicineConstraint(null);
        setTensions([]);
        setMcScar('');
        setMcNeed('');
        setMcSecret('');
        setMcLine('');
        setSupportingCharacters([]);
        setAntagonistFuture('');
        setAntagonistLine('');
        setAntagonistDoomClock('');
        setTravelRange('');
        setSupplyPain('');
        setMessageSpeed('');
        setCombatFeel(null);
        setImportantInjuries('');
        setVisualAnchors('');
        setHardNoGos('');
        setSoftLimits('');
    };

    const handleSubmit = () => {
        const finalVibes = [...vibes.filter(v => v !== 'Custom' && v.trim()), customVibe.trim()].filter(Boolean);
        if (finalVibes.length === 0) finalVibes.push('None');

        const options: WorldGenOptions = {
            presets: selectedPresets,
            tone, vibes: finalVibes, magicScale, techScale, conflict,
            setting: setting === 'Other' ? (customSetting.trim() || 'A custom setting') : setting,
            factionCount, raceCount,
            mcRole: mcRole === 'Custom' ? (customMcRole.trim() || 'A custom role') : mcRole,
            antagonistShape, generateNames,
            ...(mode === 'deep' && {
                subgenre, 
                primaryBiome: primaryBiome === 'Custom' ? (customPrimaryBiome.trim() || 'A custom biome') : primaryBiome,
                travelConstraint, scarceResource, resourceController, polity, justiceStyle, taboos, virtues, lingua, religionPresence, miracleTest, medicineType, medicineConstraint, tensions, mcScar, mcNeed, mcSecret, mcLine, supportingCharacters, antagonistFuture, antagonistLine, antagonistDoomClock, travelRange, supplyPain, messageSpeed, combatFeel, importantInjuries, visualAnchors, hardNoGos, softLimits
            })
        };
        onGenerate(options, mode);
    };
    
    // --- Supporting Character Handlers ---
    const handleAddCharacter = (category: SupportingCharacterCategory) => {
        const newChar: SupportingCharacter = {
            id: Date.now().toString() + Math.random(),
            category,
            type: null,
            sliderValue: Math.floor(Math.random() * 101), // Random value between 0 and 100
            description: ''
        };
        setSupportingCharacters(prev => [...prev, newChar]);
        setIsAddCharMenuOpen(false);
    };

    const handleUpdateCharacter = (updatedChar: SupportingCharacter) => {
        setSupportingCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
    };

    const handleDeleteCharacter = (id: string) => {
        setSupportingCharacters(prev => prev.filter(c => c.id !== id));
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addCharMenuRef.current && !addCharMenuRef.current.contains(event.target as Node)) {
                setIsAddCharMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const PresetSelector = () => (
        <Section title="Presets" defaultOpen={true}>
            <p className="text-xs text-gray-400 mb-3">
                Broad flavor tags. They are inspirations, not restrictions. Pick one or more to influence the world's feel.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {presets.map(p => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => handlePresetChange(p)}
                        disabled={isLoading}
                        className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 ${selectedPresets.includes(p) ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'}`}
                    >
                        {p}
                    </button>
                ))}
            </div>
        </Section>
    );

    const fastGenerator = (
        <div className="space-y-4">
            <PresetSelector />
            <Section title="1. Core" defaultOpen={true}>
                <RadioGrid name="tone" options={['Grounded', 'Balanced', 'Wild']} selected={tone} onChange={setTone} disabled={isLoading} />
            </Section>
            <Section title="2. Vibes (Multi-select)">
                <CheckboxGrid name="vibes" options={['Dragons', 'Fairies', 'Pirates', 'Aliens', 'None', 'Custom']} selected={vibes} onChange={handleVibeChange} disabled={isLoading} />
                 {vibes.includes('Custom') && <FormInput type="text" placeholder="Enter custom vibe..." value={customVibe} onChange={(e) => setCustomVibe(e.target.value)} disabled={isLoading} />}
            </Section>
            <Section title="3. Magic & Tech" defaultOpen={true}>
                <div>
                    <div className="relative" onMouseEnter={() => setIsMagicTooltipVisible(true)} onMouseLeave={() => setIsMagicTooltipVisible(false)}>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Magic Scale: <span className="font-semibold text-purple-300">{magicLevels[magicScale].name}</span></label>
                        {isMagicTooltipVisible && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg z-10 pointer-events-none transition-opacity duration-200">
                                {magicLevels[magicScale].description}
                            </div>
                        )}
                    </div>
                    <input type="range" min="0" max="10" value={magicScale} onChange={(e) => setMagicScale(Number(e.target.value))} disabled={isLoading} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50" />
                </div>
                <div className="pt-2">
                    <div className="relative" onMouseEnter={() => setIsTechTooltipVisible(true)} onMouseLeave={() => setIsTechTooltipVisible(false)}>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Technology Scale: <span className="font-semibold text-purple-300">{techLevels[techScale].name}</span></label>
                         {isTechTooltipVisible && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg z-10 pointer-events-none transition-opacity duration-200">
                                {techLevels[techScale].description}
                            </div>
                        )}
                    </div>
                    <input type="range" min="0" max="10" value={techScale} onChange={(e) => setTechScale(Number(e.target.value))} disabled={isLoading} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50" />
                </div>
            </Section>
            <Section title="4. Structure">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Core Conflict</label>
                    <RadioGrid name="conflict" options={['War', 'Survival', 'Intrigue', 'Mystery', 'Heist', 'Journey']} selected={conflict} onChange={setConflict} disabled={isLoading} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Setting Scaffold</label>
                    <RadioGrid name="setting" options={['City-state', 'Empire', 'Frontier', 'Island chain', 'Wasteland', 'Other']} selected={setting} onChange={setSetting} disabled={isLoading} />
                </div>
                {setting === 'Other' && <FormInput type="text" placeholder="Describe custom setting..." value={customSetting} onChange={(e) => setCustomSetting(e.target.value)} disabled={isLoading} />}
            </Section>
            <Section title="5. Inhabitants">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="relative text-center" onMouseEnter={() => setIsFactionTooltipVisible(true)} onMouseLeave={() => setIsFactionTooltipVisible(false)}>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                                Factions
                            </label>
                            {isFactionTooltipVisible && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg z-10 pointer-events-none">
                                    Factions are political, religious, or cultural groups with power and influence.
                                </div>
                            )}
                        </div>
                        <DescriptiveRadioGridButtons name="factions" options={factionOptions} selected={factionCount} onChange={setFactionCount} disabled={isLoading} />
                    </div>
                    <div>
                        <div className="relative text-center" onMouseEnter={() => setIsPeopleTooltipVisible(true)} onMouseLeave={() => setIsPeopleTooltipVisible(false)}>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                                Peoples / Species
                            </label>
                            {isPeopleTooltipVisible && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg z-10 pointer-events-none">
                                    Peoples are intelligent species or cultures (humans, elves, aliens, etc.).
                                </div>
                            )}
                        </div>
                        <DescriptiveRadioGridButtons name="peoples" options={peopleOptions} selected={raceCount} onChange={setRaceCount} disabled={isLoading} />
                    </div>
                </div>
            </Section>
             <Section title="6. Key Roles">
                 <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">MC Role</label>
                    <RadioGrid name="mcRole" options={['Soldier', 'Healer', 'Scholar', 'Outlaw', 'Merchant', 'Scout', 'Custom']} selected={mcRole} onChange={setMcRole} disabled={isLoading} />
                 </div>
                 {mcRole === 'Custom' && <FormInput type="text" placeholder="Describe custom role..." value={customMcRole} onChange={(e) => setCustomMcRole(e.target.value)} disabled={isLoading}/>}
                 <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Antagonist</label>
                    <RadioGrid name="antagonist" options={['Person', 'Faction', 'Environment', 'Supernatural', 'Unknown']} selected={antagonistShape} onChange={setAntagonistShape} disabled={isLoading} />
                 </div>
            </Section>
            <button type="button" onClick={() => setMode('deep')} className="w-full text-center py-2 text-sm text-purple-300 hover:text-purple-200 hover:bg-purple-900/30 rounded-lg transition-colors">Deepen World &raquo;</button>
        </div>
    );

    const deepGenerator = (
        <div className="space-y-4">
            <PresetSelector />
            <Section title="1. Macro Premise" defaultOpen={true}>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Overall Tone</label>
                    <RadioGrid name="tone" options={['Grounded', 'Balanced', 'Wild']} selected={tone} onChange={setTone} disabled={isLoading} />
                </div>
                <div className="pt-2">
                     <label className="block text-xs font-medium text-gray-400 mb-1">Subgenre</label>
                    <DescriptiveRadioGrid name="subgenre" options={subgenreOptions} selected={subgenre} onChange={setSubgenre} disabled={isLoading} />
                </div>
            </Section>
            <Section title="2. Magic & Tech">
                <div>
                    <div className="relative" onMouseEnter={() => setIsMagicTooltipVisible(true)} onMouseLeave={() => setIsMagicTooltipVisible(false)}>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Magic Scale: <span className="font-semibold text-purple-300">{magicLevels[magicScale].name}</span></label>
                        {isMagicTooltipVisible && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg z-10 pointer-events-none transition-opacity duration-200">
                                {magicLevels[magicScale].description}
                            </div>
                        )}
                    </div>
                    <input type="range" min="0" max="10" value={magicScale} onChange={(e) => setMagicScale(Number(e.target.value))} disabled={isLoading} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50" />
                </div>
                <div className="pt-2">
                    <div className="relative" onMouseEnter={() => setIsTechTooltipVisible(true)} onMouseLeave={() => setIsTechTooltipVisible(false)}>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Technology Scale: <span className="font-semibold text-purple-300">{techLevels[techScale].name}</span></label>
                         {isTechTooltipVisible && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg z-10 pointer-events-none transition-opacity duration-200">
                                {techLevels[techScale].description}
                            </div>
                        )}
                    </div>
                    <input type="range" min="0" max="10" value={techScale} onChange={(e) => setTechScale(Number(e.target.value))} disabled={isLoading} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50" />
                </div>
            </Section>
            <Section title="3. Geography & Travel">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Primary Biome</label>
                    <DescriptiveRadioGrid name="primaryBiome" options={biomeOptions} selected={primaryBiome} onChange={setPrimaryBiome} disabled={isLoading} />
                </div>
                {primaryBiome === 'Custom' && (
                    <FormInput 
                        type="text" 
                        placeholder="Define your custom biome..." 
                        value={customPrimaryBiome} 
                        onChange={(e) => setCustomPrimaryBiome(e.target.value)} 
                        disabled={isLoading} 
                    />
                )}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Travel Constraint</label>
                    <DescriptiveRadioGrid name="travelConstraint" options={travelConstraintOptions} selected={travelConstraint} onChange={setTravelConstraint} disabled={isLoading} />
                </div>
            </Section>
            <Section title="4. Economy & Law">
                <FormInput label="Scarce Resource" type="text" value={scarceResource} onChange={e => setScarceResource(e.target.value)} placeholder="e.g., Ancient artifacts" disabled={isLoading} />
                <FormInput label="Who Controls It" type="text" value={resourceController} onChange={e => setResourceController(e.target.value)} placeholder="e.g., A secretive guild" disabled={isLoading} />
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Polity</label>
                    <RadioGrid name="polity" options={['Empire', 'City-states', 'Tribal', 'Federation']} selected={polity} onChange={setPolity} disabled={isLoading} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Justice Style</label>
                    <RadioGrid name="justiceStyle" options={['Code', 'Custom', 'Clerical', 'Might']} selected={justiceStyle} onChange={setJusticeStyle} disabled={isLoading} />
                </div>
            </Section>
            <Section title="5. Culture & Religion">
                <FormInput label="3 Taboos (comma-separated)" type="text" value={taboos} onChange={e => setTaboos(e.target.value)} placeholder="e.g., Necromancy, betraying kin, blasphemy" disabled={isLoading} />
                <FormInput label="3 Virtues (comma-separated)" type="text" value={virtues} onChange={e => setVirtues(e.target.value)} placeholder="e.g., Hospitality, courage, wisdom" disabled={isLoading} />
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Lingua Franca</label>
                    <RadioGrid name="lingua" options={['One', 'Shared', 'Many']} selected={lingua} onChange={setLingua} disabled={isLoading} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Religion</label>
                    <RadioGrid name="religionPresence" options={['None', 'Folk', 'Organized', 'Cults']} selected={religionPresence} onChange={setReligionPresence} disabled={isLoading} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Miracles Are...</label>
                    <RadioGrid name="miracleTest" options={['Rare', 'Common', 'False/Illusions']} selected={miracleTest} onChange={setMiracleTest} disabled={isLoading} />
                </div>
            </Section>
            <Section title="6. Inhabitants">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="relative text-center" onMouseEnter={() => setIsFactionTooltipVisible(true)} onMouseLeave={() => setIsFactionTooltipVisible(false)}>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                                Factions to Gen
                                <span className="block font-normal text-gray-500">(How many major power groups?)</span>
                            </label>
                            {isFactionTooltipVisible && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg z-10 pointer-events-none">
                                    Factions are political, religious, or cultural groups with power and influence.
                                </div>
                            )}
                        </div>
                        <DescriptiveRadioGridButtons name="factions" options={factionOptions} selected={factionCount} onChange={setFactionCount} disabled={isLoading} />
                    </div>
                    <div>
                        <div className="relative text-center" onMouseEnter={() => setIsPeopleTooltipVisible(true)} onMouseLeave={() => setIsPeopleTooltipVisible(false)}>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                                Peoples / Species to Gen
                                <span className="block font-normal text-gray-500">(How many distinct peoples / species?)</span>
                            </label>
                            {isPeopleTooltipVisible && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg z-10 pointer-events-none">
                                    Peoples are intelligent species or cultures (humans, elves, aliens, etc.).
                                </div>
                            )}
                        </div>
                        <DescriptiveRadioGridButtons name="peoples" options={peopleOptions} selected={raceCount} onChange={setRaceCount} disabled={isLoading} />
                    </div>
                </div>
            </Section>
             <Section title="7. Conflict & Health">
                <label className="block text-xs font-medium text-gray-400 mb-1">Conflict Web (Pick 2)</label>
                <CheckboxGrid name="tensions" options={['Border', 'Resource', 'Ideology', 'Succession', 'Plague', 'Prophecy']} selected={tensions} onChange={handleTensionChange} disabled={isLoading} max={2}/>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Medicine Type</label>
                    <RadioGrid name="medicineType" options={['Herbal', 'Alchemical', 'Magical', 'None']} selected={medicineType} onChange={setMedicineType} disabled={isLoading} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Medicine Constraint</label>
                    <RadioGrid name="medicineConstraint" options={['Cost', 'Skill', 'Taboo']} selected={medicineConstraint} onChange={setMedicineConstraint} disabled={isLoading} />
                </div>
            </Section>
            <Section title="8. Character Depths">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">MC Role</label>
                    <RadioGrid name="mcRole" options={['Soldier', 'Healer', 'Scholar', 'Outlaw', 'Merchant', 'Scout', 'Custom']} selected={mcRole} onChange={setMcRole} disabled={isLoading} />
                </div>
                {mcRole === 'Custom' && <FormInput type="text" placeholder="Describe custom role..." value={customMcRole} onChange={(e) => setCustomMcRole(e.target.value)} disabled={isLoading}/>}
                <div className="pt-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Antagonist Shape</label>
                    <RadioGrid name="antagonist" options={['Person', 'Faction', 'Environment', 'Supernatural', 'Unknown']} selected={antagonistShape} onChange={setAntagonistShape} disabled={isLoading} />
                </div>
                <div className="relative flex items-center my-3">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase">MC Details</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>
                <FormInput label="MC: Past Scar" type="text" value={mcScar} onChange={e => setMcScar(e.target.value)} placeholder="e.g., Exiled for a crime they did not commit" disabled={isLoading} />
                <FormInput label="MC: Current Need" type="text" value={mcNeed} onChange={e => setMcNeed(e.target.value)} placeholder="e.g., To clear their name" disabled={isLoading} />
                <FormInput label="MC: Secret" type="text" value={mcSecret} onChange={e => setMcSecret(e.target.value)} placeholder="e.g., They are secretly related to the antagonist" disabled={isLoading} />
                <FormInput label="MC: Line-in-the-sand" type="text" value={mcLine} onChange={e => setMcLine(e.target.value)} placeholder="e.g., Will not harm an innocent" disabled={isLoading} />
                
                <div className="relative flex items-center my-3">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase">Antagonist Details</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>
                <FormInput label="Antagonist: Desired Future" type="text" value={antagonistFuture} onChange={e => setAntagonistFuture(e.target.value)} placeholder="e.g., A world unified under their absolute rule" disabled={isLoading} />
                <FormInput label="Antagonist: Line they won't cross" type="text" value={antagonistLine} onChange={e => setAntagonistLine(e.target.value)} placeholder="e.g., Will not break a sworn oath" disabled={isLoading} />
                <FormInput label="Antagonist: Doom Clock" type="text" value={antagonistDoomClock} onChange={e => setAntagonistDoomClock(e.target.value)} placeholder="e.g., A celestial event grants them power" disabled={isLoading} />

                <div className="relative flex items-center my-3">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase">Supporting Characters</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>
                <div className="space-y-3">
                    {supportingCharacters.map(char => (
                        <SupportingCharacterEditor 
                            key={char.id}
                            character={char}
                            onUpdate={handleUpdateCharacter}
                            onDelete={handleDeleteCharacter}
                            isLoading={isLoading}
                        />
                    ))}
                </div>
                <div className="relative mt-4" ref={addCharMenuRef}>
                    <button
                        type="button"
                        onClick={() => setIsAddCharMenuOpen(!isAddCharMenuOpen)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        <PlusIcon className="w-5 h-5"/>
                        Add Character
                    </button>
                    {isAddCharMenuOpen && (
                        <div className="absolute bottom-full left-0 w-full mb-2 p-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20">
                            <div className="grid grid-cols-2 gap-2">
                                {Object.keys(characterCategories).map(catStr => {
                                    const cat = catStr as SupportingCharacterCategory;
                                    return (
                                        <button 
                                            key={cat}
                                            type="button"
                                            onClick={() => handleAddCharacter(cat)}
                                            className="px-3 py-2 text-xs text-left font-semibold rounded-md bg-gray-800 text-gray-300 hover:bg-purple-600 hover:text-white transition-colors"
                                        >
                                            {cat}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </Section>
             <Section title="9. World Feel">
                 <FormInput label="Travel: Typical Day's Range" type="text" value={travelRange} onChange={e => setTravelRange(e.target.value)} placeholder="e.g., 20-30 miles on a good road" disabled={isLoading} />
                 <FormInput label="Logistics: Supply Pain Point" type="text" value={supplyPain} onChange={e => setSupplyPain(e.target.value)} placeholder="e.g., Fresh water is often scarce" disabled={isLoading} />
                 <FormInput label="Logistics: Message Speed" type="text" value={messageSpeed} onChange={e => setMessageSpeed(e.target.value)} placeholder="e.g., Weeks, via courier or merchant caravan" disabled={isLoading} />
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Combat Feel</label>
                    <RadioGrid name="combatFeel" options={['Messy', 'Technical', 'Brutal', 'Heroic']} selected={combatFeel} onChange={setCombatFeel} disabled={isLoading} />
                </div>
                 <FormInput label="Combat: Injuries That Matter" type="text" value={importantInjuries} onChange={e => setImportantInjuries(e.target.value)} placeholder="e.g., Broken bones, deep cuts, magical curses" disabled={isLoading} />
                 <FormInput label="Aesthetic: 3 Visual Anchors" type="text" value={visualAnchors} onChange={e => setVisualAnchors(e.target.value)} placeholder="e.g., Ornate brass, glowing runes, towering statues" disabled={isLoading} />
            </Section>
        </div>
    );

    return (
        <div className="space-y-4">
             <style>{`.animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; } @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }`}</style>
            
            <div className="flex justify-center gap-1 p-1 rounded-lg bg-gray-900/50">
                <button onClick={() => setMode('fast')} className={`w-full px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'fast' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Fast</button>
                <button onClick={() => setMode('deep')} className={`w-full px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'deep' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Deep</button>
            </div>
            
            {mode === 'fast' ? fastGenerator : deepGenerator}

            <div className="pt-4">
                 <button
                    type="button"
                    onClick={handleReset}
                    disabled={isLoading}
                    className="mb-3 w-full text-center py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                >
                    Clear All Selections & Form
                </button>
                <button type="button" onClick={handleSubmit} disabled={isLoading} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-800 disabled:cursor-not-allowed">
                    {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    {isLoading ? 'Building Your World...' : 'Generate My World!'}
                </button>
            </div>
        </div>
    );
};

export default WorldGenerator;
