import { useState, useMemo, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Search, Database, Layers, Folder, AlertTriangle, ArrowRight } from 'lucide-react';
import type { IntegrationProject, ProjectSource, IntegrationId } from '../../types/integrations';

interface DiscoveryReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    discoveredProjects: IntegrationProject[];
    onConfirm: (projects: IntegrationProject[]) => void;
    integrationColors: Record<IntegrationId, string>;
}

export const DiscoveryReviewModal: FC<DiscoveryReviewModalProps> = ({
    isOpen,
    onClose,
    discoveredProjects,
    onConfirm,
    integrationColors
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(discoveredProjects.map(p => p.id)));
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = useMemo(() =>
        discoveredProjects.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.linkedSources?.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
        ),
        [discoveredProjects, searchTerm]);

    const handleToggle = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleConfirm = () => {
        const projectsToImport = discoveredProjects.filter(p => selectedIds.has(p.id));
        onConfirm(projectsToImport);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="w-full max-w-4xl bg-[#0A0A0C] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[80vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 bg-gradient-to-b from-[#121214] to-[#0A0A0C]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                    <Search size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Discovery Review</h2>
                                    <p className="text-gray-400">Nexora found {discoveredProjects.length} potential projects. Select what to import.</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* Project List */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-[#0A0A0C]">
                        {filteredProjects.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <Search size={48} className="mb-4 opacity-20" />
                                <p>No projects found matching "{searchTerm}"</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {filteredProjects.map(project => (
                                    <ProjectItem
                                        key={project.id}
                                        project={project}
                                        selected={selectedIds.has(project.id)}
                                        onToggle={() => handleToggle(project.id)}
                                        colors={integrationColors}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-[#121214] flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            {selectedIds.size} of {discoveredProjects.length} selected
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                            >
                                Skip for Now
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={selectedIds.size === 0}
                                className={`px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 flex items-center gap-2 ${selectedIds.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Import {selectedIds.size} Projects
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// Sub-components

const ProjectItem: FC<{
    project: IntegrationProject;
    selected: boolean;
    onToggle: () => void;
    colors: Record<IntegrationId, string>;
}> = ({ project, selected, onToggle, colors }) => {
    return (
        <motion.div
            onClick={onToggle}
            className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${selected
                    ? 'bg-blue-500/5 border-blue-500/30'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
            whileTap={{ scale: 0.995 }}
        >
            <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className={`mt-1 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-600 group-hover:border-gray-500'
                    }`}>
                    {selected && <Check size={14} className="text-white" />}
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-lg ${selected ? 'text-white' : 'text-gray-300'}`}>{project.name}</h3>
                        {project.confidenceScore && project.confidenceScore < 0.8 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                <AlertTriangle size={10} />
                                Match?
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{project.description || 'No description available'}</p>

                    {/* Sources */}
                    <div className="flex flex-wrap gap-2">
                        {project.linkedSources?.map(source => (
                            <SourceBadge key={source.id} source={source} color={colors[source.integrationId]} />
                        ))}
                    </div>
                </div>

                {/* Integration Icons */}
                <div className="flex -space-x-2">
                    {project.sources.map(s => (
                        <div
                            key={s}
                            className="w-8 h-8 rounded-full border-2 border-[#121214] flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ backgroundColor: colors[s] || '#333' }}
                        >
                            {s[0].toUpperCase()}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const SourceBadge: FC<{ source: ProjectSource; color: string }> = ({ source, color }) => {
    let Icon = Folder;
    if (source.type === 'repo') Icon = Database; // Approximate
    if (source.type === 'database') Icon = Layers;

    return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-gray-400">
            <Icon size={12} style={{ color }} />
            <span>{source.name}</span>
            <span className="opacity-50">• {source.type}</span>
        </div>
    );
};
