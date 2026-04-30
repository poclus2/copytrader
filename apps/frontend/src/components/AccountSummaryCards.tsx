import React from 'react';

interface AccountSummaryProps {
    balance: number;
    equity: number;
    profit?: number;
    withdrawals?: number;
    currency?: string;
}

const AccountSummaryCards: React.FC<AccountSummaryProps> = ({
    balance,
    equity,
    profit = 0,
    withdrawals = 0,
    currency = 'USD'
}) => {
    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const cards = [
        {
            title: 'Balance',
            value: formatMoney(balance),
            color: 'bg-blue-500',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: 'Equity',
            value: formatMoney(equity),
            color: 'bg-green-500',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            title: 'Total Profit',
            value: formatMoney(profit),
            color: profit >= 0 ? 'bg-emerald-500' : 'bg-red-500',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            )
        },
        {
            title: 'Withdrawals',
            value: formatMoney(withdrawals),
            color: 'bg-orange-500',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-5 flex items-center">
                    <div className={`rounded-full p-3 mr-4 ${card.color}`}>
                        {card.icon}
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium uppercase">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AccountSummaryCards;
