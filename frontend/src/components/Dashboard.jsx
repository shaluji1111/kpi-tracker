import React, { useState, useEffect } from 'react';
import { Trash2, PlusCircle, Activity, ShieldAlert, Plane, Clock, CheckCircle2, MessageSquare, Inbox } from 'lucide-react';
import axios from 'axios';

const Dashboard = ({ member, isManager, token }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [tasks, setTasks] = useState([]);
    const [summary, setSummary] = useState({ totalHours: 0, status: 'Normal', color: 'yellow', isLeave: false });
    const [managerStats, setManagerStats] = useState(null);

    // Manager View: Feedbacks
    const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'inbox'
    const [feedbacks, setFeedbacks] = useState([]);

    // Form State
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [weight, setWeight] = useState('');

    useEffect(() => {
        fetchData();
    }, [member, date, viewMode]);

    const fetchData = async () => {
        try {
            if (member === 'manager') {
                if (viewMode === 'overview') {
                    const res = await axios.get(`/api/manager/daily?date=${date}`);
                    setManagerStats(res.data);
                } else if (viewMode === 'inbox') {
                    const res = await axios.get('/api/feedback', { headers: { 'x-auth-token': token } });
                    setFeedbacks(res.data);
                }
            } else if (member) {
                const [tasksRes, summaryRes] = await Promise.all([
                    axios.get(`/api/tasks?memberId=${member.id}&date=${date}`),
                    axios.get(`/api/summary?memberId=${member.id}&date=${date}`)
                ]);
                setTasks(tasksRes.data);
                setSummary(summaryRes.data);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!title || !weight) return;
        try {
            await axios.post('/api/tasks', { memberId: member.id, date, title, description: desc, weight: parseFloat(weight) }, { headers: { 'x-auth-token': token } });
            setTitle(''); setDesc(''); setWeight(''); fetchData();
        } catch (error) { console.error("Error adding task:", error); }
    };

    const handleDeleteTask = async (id) => {
        if (!confirm("Are you sure?")) return;
        try { await axios.delete(`/api/tasks/${id}`, { headers: { 'x-auth-token': token } }); fetchData(); } catch (error) { console.error("Error deleting task:", error); }
    };

    const handleToggleLeave = async () => {
        try { await axios.post('/api/leaves', { memberId: member.id, date, active: !summary.isLeave }, { headers: { 'x-auth-token': token } }); fetchData(); } catch (error) { console.error("Error toggling leave:", error); }
    };

    if (!member) return <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 font-medium text-lg">Select a member to view dashboard</div>;

    const getStatusStyle = (color) => {
        const map = {
            red: 'bg-red-500 text-white shadow-lg shadow-red-500/30',
            yellow: 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30',
            green: 'bg-neon-green text-black shadow-lg shadow-neon-green/30',
            blue: 'bg-neon-blue text-white shadow-lg shadow-neon-blue/30',
            gray: 'bg-gray-500 text-white',
        };
        return map[color] || map.gray;
    };

    // --- MANAGER VIEW ---
    if (member === 'manager') {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-1"><span className="text-neon-purple">Manager</span> Dashboard</h2>
                        <div className="flex gap-4 mt-2">
                            <button
                                onClick={() => setViewMode('overview')}
                                className={`text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${viewMode === 'overview' ? 'text-gray-900 dark:text-white border-neon-green' : 'text-gray-400 border-transparent hover:text-gray-600'
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setViewMode('inbox')}
                                className={`text-sm font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-1 ${viewMode === 'inbox' ? 'text-gray-900 dark:text-white border-neon-green' : 'text-gray-400 border-transparent hover:text-gray-600'
                                    }`}
                            >
                                Inbox <MessageSquare className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {viewMode === 'overview' && (
                        <div className="bg-white dark:bg-card-bg p-1 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent text-gray-900 dark:text-white px-4 py-2 outline-none font-medium cursor-pointer"
                            />
                        </div>
                    )}
                </div>

                {viewMode === 'overview' ? (
                    managerStats ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Big Score Card */}
                            <div className="bg-gradient-to-br from-gray-900 to-black dark:from-card-bg dark:to-dark-bg p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl border border-gray-800 dark:border-white/5">
                                <div className="absolute top-0 right-0 p-32 bg-neon-purple blur-[120px] opacity-20 pointer-events-none"></div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex items-start justify-between">
                                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                                            <ShieldAlert className="w-8 h-8 text-neon-purple" />
                                        </div>
                                        <span className="bg-neon-purple/20 text-neon-purple px-4 py-1.5 rounded-full text-sm font-bold border border-neon-purple/20">
                                            {new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}
                                        </span>
                                    </div>
                                    <div className="mt-8">
                                        <h3 className="text-gray-400 font-medium uppercase tracking-wider text-sm mb-2">Team Efficiency Score</h3>
                                        <div className="flex items-baseline gap-4">
                                            <span className={`text-6xl font-black tracking-tight ${managerStats.color === 'red' ? 'text-red-500' :
                                                    managerStats.color === 'yellow' ? 'text-yellow-400' :
                                                        managerStats.color === 'green' ? 'text-neon-green' : 'text-white'
                                                }`}>{managerStats.totalHours.toFixed(1)}</span>
                                            <span className="text-xl text-gray-500 font-medium">avg hrs / member</span>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${getStatusStyle(managerStats.color).split(' ')[0]}`}></div>
                                            <span className="font-bold text-lg">{managerStats.status}</span>
                                        </div>
                                        <span className="text-gray-500">Based on {managerStats.activeMembers} active members</span>
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Stats */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-card-bg p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center justify-between group hover:border-neon-purple/30 transition-colors">
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Total Team Hours</p>
                                        <p className="text-4xl font-bold text-gray-900 dark:text-white mt-1 group-hover:text-neon-purple transition-colors">{managerStats.teamTotalHours}</p>
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                        <Clock className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-20 text-center text-gray-400">Loading Report...</div>
                    )
                ) : (
                    // INBOX VIEW
                    <div className="bg-white dark:bg-card-bg rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-white/5 min-h-[500px]">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Inbox className="w-5 h-5 text-neon-green" /> Anonymous Feedback
                        </h3>

                        {feedbacks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-300 dark:text-gray-600">
                                <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                                <p className="font-medium">No feedback received</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {feedbacks.map((fb) => (
                                    <div key={fb.id} className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-neon-purple/30 transition-colors">
                                        <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-4">
                                            "{fb.content}"
                                        </p>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">
                                            {new Date(fb.created_at || fb.date).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // --- MEMBER VIEW ---
    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{member.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Individual Performance</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-card-bg p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                    {isManager && (
                        <button
                            onClick={handleToggleLeave}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${summary.isLeave
                                    ? 'bg-neon-blue text-white shadow-lg shadow-neon-blue/30'
                                    : 'bg-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-400'
                                }`}
                        >
                            <Plane className="w-4 h-4" />
                            {summary.isLeave ? 'ON LEAVE' : 'Mark Absent'}
                        </button>
                    )}
                    <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-transparent text-gray-900 dark:text-white px-2 outline-none font-medium text-sm cursor-pointer"
                    />
                </div>
            </div>

            {/* Main Scorecard */}
            <div className={`relative overflow-hidden p-8 rounded-[2.5rem] transition-all duration-500 ${summary.isLeave
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white'
                    : 'bg-white dark:bg-card-bg border border-gray-100 dark:border-white/5 shadow-xl dark:shadow-none'
                }`}>

                {/* Glow Effects */}
                {!summary.isLeave && summary.status === 'Overperforming' && (
                    <div className="absolute top-0 right-0 p-40 bg-neon-green/10 blur-[100px] rounded-full pointer-events-none"></div>
                )}
                {!summary.isLeave && summary.status === 'Underperforming' && (
                    <div className="absolute top-0 right-0 p-40 bg-red-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                )}

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-start gap-6">
                        <div className={`p-5 rounded-2xl shadow-lg ${summary.isLeave ? 'bg-white/20 backdrop-blur' : 'bg-gray-50 dark:bg-white/5'}`}>
                            {summary.isLeave ? <Plane className="w-10 h-10 text-white" /> : <Activity className={`w-10 h-10 ${summary.color === 'green' ? 'text-neon-green' : summary.color === 'red' ? 'text-red-500' : 'text-yellow-500'}`} />}
                        </div>
                        <div>
                            <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${summary.isLeave ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>Status</p>
                            <h3 className={`text-3xl font-bold ${summary.isLeave ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{summary.status}</h3>
                            {summary.isLeave && <p className="text-blue-100 text-sm mt-1">Hours excluded from team average</p>}
                        </div>
                    </div>

                    {!summary.isLeave && (
                        <div className="text-right">
                            <div className="flex items-baseline gap-1 justify-end">
                                <span className={`text-7xl font-black tracking-tighter ${summary.color === 'green' ? 'text-gray-900 dark:text-neon-green' :
                                        summary.color === 'red' ? 'text-red-500' : 'text-gray-900 dark:text-white'
                                    }`}>
                                    {summary.totalHours}
                                </span>
                                <span className="text-lg text-gray-400 font-medium">hrs</span>
                            </div>
                            <p className="text-gray-400 dark:text-gray-500 text-sm font-medium mt-[-5px]">Total contribution today</p>
                        </div>
                    )}
                </div>
            </div>

            {!summary.isLeave && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Task Input */}
                    <div className="lg:col-span-1">
                        {isManager ? (
                            <div className="bg-white dark:bg-card-bg p-6 rounded-[2rem] shadow-lg dark:shadow-none border border-gray-100 dark:border-white/5 h-full">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <div className="w-2 h-6 bg-neon-green rounded-full"></div>
                                    Log Work
                                </h3>
                                <form onSubmit={handleAddTask} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Task Title</label>
                                        <input
                                            className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 ring-neon-green/50 outline-none text-gray-900 dark:text-white font-medium transition-all"
                                            placeholder="What did they do?"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Hours</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 ring-neon-green/50 outline-none text-gray-900 dark:text-white font-medium transition-all"
                                            placeholder="0.0"
                                            value={weight}
                                            onChange={e => setWeight(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Details (Optional)</label>
                                        <textarea
                                            className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 ring-neon-green/50 outline-none text-gray-900 dark:text-white font-medium transition-all resize-none"
                                            placeholder="Brief description..."
                                            rows="2"
                                            value={desc}
                                            onChange={e => setDesc(e.target.value)}
                                        />
                                    </div>
                                    <button className="w-full bg-gray-900 dark:bg-white text-white dark:text-black py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-bold text-sm tracking-wide shadow-xl">
                                        <PlusCircle className="w-5 h-5" /> ADD ENTRY
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="h-full bg-gray-50 dark:bg-card-bg/50 p-6 rounded-[2rem] border border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-medium">Read-Only Mode</p>
                                <p className="text-xs mt-1 opacity-60">Login to append tasks</p>
                            </div>
                        )}
                    </div>

                    {/* Task List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-card-bg rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-white/5 h-full">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Activity Log</h3>

                            {tasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-300 dark:text-gray-600">
                                    <CheckCircle2 className="w-12 h-12 mb-2 opacity-50" />
                                    <p className="font-medium">No tasks yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tasks.map((task, i) => (
                                        <div key={task.id} className="group flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-white/10 text-xs font-bold text-gray-500 dark:text-gray-400">
                                                    {i + 1}
                                                </span>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="font-bold text-gray-800 dark:text-white">{task.title}</h4>
                                                        <span className="bg-white dark:bg-neon-green/20 text-gray-900 dark:text-neon-green text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                                            {task.weight}h
                                                        </span>
                                                    </div>
                                                    {task.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>}
                                                </div>
                                            </div>
                                            {isManager && (
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 bg-white dark:bg-white/10 p-2 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
