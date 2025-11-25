export function RiskScoreCard({ summary }: { summary: any }) {
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-green-100 text-green-700 border-green-200';
        }
    };

    const riskData = [
        { label: 'Critical', value: summary.criticalRisk, color: 'text-red-600', bg: 'bg-red-500' },
        { label: 'High', value: summary.highRisk, color: 'text-orange-600', bg: 'bg-orange-500' },
        { label: 'Medium', value: summary.mediumRisk, color: 'text-yellow-600', bg: 'bg-yellow-500' },
        { label: 'Low', value: summary.lowRisk, color: 'text-green-600', bg: 'bg-green-500' },
    ];

    const total = summary.totalEmployees;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
            <div className="space-y-4">
                {riskData.map((risk) => (
                    <div key={risk.label}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">{risk.label}</span>
                            <span className={`text-sm font-semibold ${risk.color}`}>
                                {risk.value} ({total > 0 ? ((risk.value / total) * 100).toFixed(0) : 0}%)
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className={`${risk.bg} h-2.5 rounded-full transition-all duration-500`}
                                style={{ width: total > 0 ? `${(risk.value / total) * 100}%` : '0%' }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AtRiskList({ employees }: { employees: any[] }) {
    const getRiskBadge = (level: string) => {
        switch (level) {
            case 'Critical':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">Critical</span>;
            case 'High':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 border border-orange-200">High</span>;
            default:
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">Medium</span>;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">At-Risk Employees</h3>
                <p className="text-sm text-gray-500 mt-1">Showing {employees.length} employees requiring attention</p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Risk Level
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Score
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Flags
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No employees at high risk. Great job! 🎉
                                </td>
                            </tr>
                        ) : (
                            employees.map((employee) => (
                                <tr key={employee.employeeId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{employee.employeeName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{employee.department}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getRiskBadge(employee.riskLevel)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">{employee.riskScore}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-gray-600 space-y-1">
                                            {employee.flags.map((flag: string, idx: number) => (
                                                <div key={idx} className="flex items-center">
                                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 mr-2"></span>
                                                    {flag}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function WorkPatternChart({ employees }: { employees: any[] }) {
    // Group employees by risk level for visualization
    const chartData = employees.reduce((acc: any, emp) => {
        if (!acc[emp.riskLevel]) {
            acc[emp.riskLevel] = {
                count: 0,
                totalOvertime: 0,
                totalWorkHours: 0
            };
        }
        acc[emp.riskLevel].count++;
        acc[emp.riskLevel].totalOvertime += emp.metrics.avgOvertimeHours;
        acc[emp.riskLevel].totalWorkHours += emp.metrics.totalWorkHours;
        return acc;
    }, {});

    const riskLevels = ['Critical', 'High', 'Medium', 'Low'];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Pattern Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {riskLevels.map((level) => {
                    const data = chartData[level] || { count: 0, totalOvertime: 0, totalWorkHours: 0 };
                    const avgOvertime = data.count > 0 ? (data.totalOvertime / data.count).toFixed(1) : '0.0';
                    const avgWorkHours = data.count > 0 ? (data.totalWorkHours / data.count).toFixed(1) : '0.0';

                    return (
                        <div key={level} className="border border-gray-200 rounded-lg p-4">
                            <div className="text-sm font-semibold text-gray-700 mb-2">{level} Risk</div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">{data.count}</div>
                            <div className="text-xs text-gray-500 space-y-1">
                                <div>Avg OT: {avgOvertime}h</div>
                                <div>Avg Work: {avgWorkHours}h</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
