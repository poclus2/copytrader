import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, Settings, Briefcase } from 'lucide-react';

const Layout: React.FC = () => {
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-blue-600">CopyTrade</h1>
                </div>
                <nav className="mt-6">
                    <Link to="/" className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link to="/traders" className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <Briefcase className="w-5 h-5 mr-3" />
                        Traders
                    </Link>
                    <Link to="/masters" className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <UserCog className="w-5 h-5 mr-3" />
                        Masters
                    </Link>
                    <Link to="/slaves" className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <Users className="w-5 h-5 mr-3" />
                        Slaves
                    </Link>
                    <Link to="/users" className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <Users className="w-5 h-5 mr-3" />
                        Utilisateurs
                    </Link>
                    <Link to="/settings" className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <Settings className="w-5 h-5 mr-3" />
                        Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
