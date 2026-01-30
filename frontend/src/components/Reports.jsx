import React, { useEffect, useState } from 'react';
import { Calendar, Download, BarChart2 } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const Reports = () => {
    const [reportData, setReportData] = useState([]);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            const res = await axios.get('/api/reports');
            // Sort data by date ascending for the graph
            const sortedData = res.data.sort((a, b) => new Date(a.date) - new Date(b.date));
            setReportData(sortedData);
        } catch (error) {
            console.error("Error fetching report:", error);
        }
    };

    const handleExport = () => {
        window.location.href = '/api/export';
    };

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border dark:border-gray-700 shadow-lg rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
                    <p className="text-indigo-600 dark:text-indigo-400">
                        {payload[0].payload.name}: {payload[0].value} hrs
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Calendar className="w-6 h-6" /> Historical Reports
                </h2>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    <Download className="w-4 h-4" /> Export Data (JSON)
                </button>
            </div>

            {/* Analytical Graph */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700 transition-colors">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
                    <BarChart2 className="w-5 h-5 text-indigo-500" /> Performance Trend
                </h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={reportData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                            <XAxis
                                dataKey="date"
                                stroke="#6b7280"
                                tick={{ fill: '#6b7280' }}
                            />
                            <YAxis
                                stroke="#6b7280"
                                tick={{ fill: '#6b7280' }}
                                label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <ReferenceLine y={4} stroke="red" strokeDasharray="3 3" label={{ position: 'top', value: 'Min (4h)', fill: 'red', fontSize: 10 }} />
                            <ReferenceLine y={6} stroke="green" strokeDasharray="3 3" label={{ position: 'top', value: 'Target (6h)', fill: 'green', fontSize: 10 }} />
                            <Bar dataKey="totalHours" fill="#6366f1" name="Hours Worked" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden transition-colors">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                        <tr>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Date</th>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Member</th>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Total Hours</th>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Performance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {reportData.map((row, idx) => {
                            const hours = row.totalHours;
                            let statusColor = "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400";
                            let statusText = "Normal";

                            if (hours < 4) {
                                statusColor = "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400";
                                statusText = "Underperforming";
                            } else if (hours > 6) {
                                statusColor = "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400";
                                statusText = "Overperforming";
                            }

                            return (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 text-gray-900 dark:text-gray-300">{row.date}</td>
                                    <td className="p-4 font-medium text-gray-900 dark:text-white">{row.name}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-300">{hours} hrs</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                                            {statusText}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {reportData.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-400 dark:text-gray-500">
                                    No data available yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;
