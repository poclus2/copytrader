import { Navigate, Outlet } from "react-router-dom";
import { ReactNode } from "react";

interface ProtectedRouteProps {
    children?: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
        return <Navigate to="/auth" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
