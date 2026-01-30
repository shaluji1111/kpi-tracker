import React, { useState } from 'react';
import { Users, Plus, UserCircle2, MessageSquare, Send, X } from 'lucide-react';
import axios from 'axios';

const Sidebar = ({ members, onSelectMember, selectedMemberId, onMemberAdded, isManager, token }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');

    // Feedback State
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackContent, setFeedbackContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Word Count Logic
    const getWordCount = (text) => text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const wordCount = getWordCount(feedbackContent);
    const isOverLimit = wordCount > 500;

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!newMemberName.trim()) return;

        try {
            await axios.post('/api/members',
                { name: newMemberName },
                { headers: { 'x-auth-token': token } }
            );
            onMemberAdded();
            setNewMemberName('');
            setIsAdding(false);
        } catch (error) {
            console.error("Error adding member:", error);
            alert("Failed to add member");
        }
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        if (!feedbackContent.trim() || isOverLimit) return;

        setIsSending(true);
        try {
            await axios.post('/api/feedback', { content: feedbackContent });
            alert("Feedback sent anonymously!");
            setFeedbackContent('');
            setShowFeedbackModal(false);
        } catch (error) {
            alert("Error sending feedback: " + (error.response?.data?.error || "Unknown error"));
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            <div className="w-72 bg-white dark:bg-card-bg border-r border-gray-100 dark:border-white/5 h-screen flex flex-col transition-all duration-300 z-20">
                {/* Brand */}
                <div className="p-8 pb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neon-green to-green-500 flex items-center justify-center shadow-lg shadow-neon-green/20">
                        <Users className="w-5 h-5 text-black" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Team<span className="text-gray-400 dark:text-gray-500 font-normal">Tracker</span></h1>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 scrollbar-hide">
                    {/* Manager Section */}
                    <div>
                        <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2">My Desk</p>
                        <button
                            onClick={() => onSelectMember('manager')}
                            className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all duration-200 group ${selectedMemberId === 'manager'
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-black font-semibold shadow-lg'
                                    : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            <UserCircle2 className="w-5 h-5" />
                            Manager Overview
                        </button>
                    </div>

                    {/* Team Section */}
                    <div>
                        <div className="flex items-center justify-between px-4 mb-2">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Team</p>
                            <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400">{members.length}</span>
                        </div>

                        <div className="space-y-1">
                            {members.map(member => (
                                <button
                                    key={member.id}
                                    onClick={() => onSelectMember(member)}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group ${selectedMemberId === member.id
                                            ? 'bg-neon-green/10 dark:bg-neon-green/10 text-green-700 dark:text-neon-green font-medium border border-neon-green/20'
                                            : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 border border-transparent'
                                        }`}
                                >
                                    <span>{member.name}</span>
                                    {selectedMemberId === member.id && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-neon-green shadow-[0_0_8px_rgba(204,255,0,0.8)]"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer / Feedback & Add */}
                <div className="p-4 mx-2 mb-2 space-y-2">
                    {/* Feedback Button (Always Visible) */}
                    {!isManager && (
                        <button
                            onClick={() => setShowFeedbackModal(true)}
                            className="w-full flex items-center justify-center gap-2 p-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <MessageSquare className="w-4 h-4" /> Give Feedback
                        </button>
                    )}

                    {isManager ? (
                        isAdding ? (
                            <form onSubmit={handleAddMember} className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-200 dark:border-white/10 space-y-2 relative animate-fade-in-up">
                                <input
                                    type="text"
                                    value={newMemberName}
                                    onChange={(e) => setNewMemberName(e.target.value)}
                                    placeholder="Name..."
                                    className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 px-1 py-1 text-sm focus:outline-none focus:border-neon-green text-gray-900 dark:text-white"
                                    autoFocus
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-neon-green text-black text-xs font-bold py-1.5 rounded-lg hover:bg-lime-400 transition-colors"
                                    >
                                        ADD
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="flex-1 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs py-1.5 rounded-lg hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                        CANCEL
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 dark:border-white/20 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-white/40 hover:text-gray-700 dark:hover:text-white transition-all duration-300 group"
                            >
                                <div className="bg-gray-200 dark:bg-white/10 p-1 rounded-md group-hover:scale-110 transition-transform">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">Add Member</span>
                            </button>
                        )
                    ) : (
                        <div className="text-center p-4 text-xs text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-white/5 rounded-xl">
                            Login to manage team
                        </div>
                    )}
                </div>
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-card-bg w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-white/10 relative animate-fade-in-up">
                        <button
                            onClick={() => setShowFeedbackModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                            <MessageSquare className="w-5 h-5 text-neon-green" /> Submit Feedback
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Send anonymous feedback to the manager.
                        </p>

                        <form onSubmit={handleSubmitFeedback}>
                            <div className="relative">
                                <textarea
                                    value={feedbackContent}
                                    onChange={(e) => setFeedbackContent(e.target.value)}
                                    className={`w-full h-40 bg-gray-50 dark:bg-dark-bg border rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 resize-none transition-all ${isOverLimit
                                            ? 'border-red-500 focus:ring-red-500/20'
                                            : 'border-gray-200 dark:border-white/10 focus:border-neon-green focus:ring-neon-green/20'
                                        }`}
                                    placeholder="Type your feedback here..."
                                ></textarea>
                                <div className={`absolute bottom-3 right-3 text-xs font-medium ${isOverLimit ? 'text-red-500' : 'text-gray-400'
                                    }`}>
                                    {wordCount}/500 words
                                </div>
                            </div>

                            <button
                                disabled={isOverLimit || isSending || wordCount === 0}
                                className="w-full mt-4 bg-gray-900 dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSending ? 'Sending...' : <><Send className="w-4 h-4" /> Send Feedback</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
