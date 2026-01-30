import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import { LayoutDashboard, FileBarChart, Moon, Sun, Lock, Unlock, Menu } from 'lucide-react';
import axios from 'axios';

// Configure Axios Base URL for development
if (import.meta.env.DEV) {
    axios.defaults.baseURL = 'http://localhost:3000';
}

function App() {
    const [view, setView] = useState('dashboard'); // 'dashboard' | 'reports'
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null); // null, 'manager', or member object
    const [theme, setTheme] = useState('light');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auth State
    const [isManager, setIsManager] = useState(false);
    const [token, setToken] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [password, setPassword] = useState('');

    useEffect(() => {
        fetchMembers();
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const fetchMembers = async () => {
        try {
            const res = await axios.get('/api/members');
            setMembers(res.data);
            // Default to first member if exists and not in manager mode
            if (res.data.length > 0 && !selectedMember && selectedMember !== 'manager') {
                setSelectedMember(res.data[0]);
            }
        } catch (error) {
            console.error("Error fetching members:", error);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/login',
                { password },
                { headers: { 'Content-Type': 'application/json' } }
            );
            if (res.data.success) {
                setIsManager(true);
                setToken(res.data.token);
                setShowLogin(false);
                setPassword('');
            }
        } catch (error) {
            alert("Invalid Password");
        }
    };

    const handleLogout = () => {
        setIsManager(false);
        setToken(null);
        // If viewing manager dashboard, switch to first member
        if (selectedMember === 'manager' && members.length > 0) {
            setSelectedMember(members[0]);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <Sidebar
                members={members}
                selectedMemberId={selectedMember === 'manager' ? 'manager' : selectedMember?.id}
                onSelectMember={(m) => {
                    setSelectedMember(m);
                    setView('dashboard');
                    setIsMobileMenuOpen(false); // Close menu on selection
                }}
                onMemberAdded={fetchMembers}
                isManager={isManager}
                token={token}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col overflow-hidden relative w-full">
                {/* Top Nav */}
                <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center px-4 md:px-8 justify-between shadow-sm z-10 transition-colors duration-200">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <button
                            onClick={() => setView('dashboard')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${view === 'dashboard'
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
                        </button>
                        <button
                            onClick={() => setView('reports')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${view === 'reports'
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <FileBarChart className="w-4 h-4" /> <span className="hidden sm:inline">Reports</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                            title="Toggle Theme"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>

                        {isManager ? (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                            >
                                <Unlock className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowLogin(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition"
                            >
                                <Lock className="w-4 h-4" /> <span className="hidden sm:inline">Login</span>
                            </button>
                        )}
                    </div>
                </header>

                {/* Main View */}
                <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                    {view === 'dashboard' ? (
                        <Dashboard
                            member={selectedMember}
                            isManager={isManager}
                            token={token}
                        />
                    ) : (
                        <Reports />
                    )}
                </main>

                {/* Login Modal */}
                {showLogin && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-96 transform transition-all">
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Manager Login</h3>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full border dark:border-gray-600 rounded-lg p-2.5 focus:ring-2 ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Enter password..."
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium">
                                        Login
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowLogin(false); setPassword(''); }}
                                        className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
