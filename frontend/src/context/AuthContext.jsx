import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Decode JWT payload without external library
const decodeToken = (token) => {
    try {
        let base64Payload = token.split('.')[1];
        // Normalize Base64Url format to standard Base64
        base64Payload = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
        // Pad with standard '='
        const pad = base64Payload.length % 4;
        if (pad) {
            if (pad === 1) throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
            base64Payload += new Array(5 - pad).join('=');
        }
        const payload = JSON.parse(window.atob(base64Payload));
        return payload;
    } catch (e) {
        console.error("Token decode error:", e);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Auth0 state
    const {
        isLoading: auth0Loading,
        isAuthenticated: auth0Authenticated,
        user: auth0User,
        getAccessTokenSilently,
        loginWithRedirect,
        logout: auth0Logout,
    } = useAuth0();

    // On mount — restore session from localStorage (email/password login)
    useEffect(() => {
        if (auth0Loading) return; // wait for Auth0 to settle first

        const token = localStorage.getItem('token');
        if (token) {
            const decoded = decodeToken(token);
            if (decoded && decoded.exp * 1000 > Date.now()) {
                setUser({ token, id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
            } else {
                localStorage.removeItem('token');
            }
        } else if (auth0Authenticated && auth0User) {
            // Auth0 session is active — sync with backend to get role
            (async () => {
                try {
                    const token = await getAccessTokenSilently();
                    setUser({
                        token,
                        id: auth0User.sub,
                        name: auth0User.name,
                        email: auth0User.email,
                        picture: auth0User.picture,
                        role: 'farmer', // default role for Auth0 users; update after role-selection step
                    });
                } catch (err) {
                    console.warn('Auth0 token error:', err.message);
                }
            })();
        }
        setLoading(false);
    }, [auth0Loading, auth0Authenticated, auth0User]);

    // ─── Email / Password Login (existing backend) ───────────────────────────
    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token } = response.data;
            const decoded = decodeToken(access_token);
            localStorage.setItem('token', access_token);
            setUser({ token: access_token, id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
            return { success: true };
        } catch (error) {
            const msg = error.response?.data?.detail || error.response?.data?.message || 'Login failed. Please try again.';
            return { success: false, message: msg };
        }
    };

    // ─── Auth0 Social / Universal Login ────────────────────────────────────
    const loginWithAuth0 = () => loginWithRedirect();

    const signupWithAuth0 = () =>
        loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });

    // ─── Registration (existing backend) ────────────────────────────────────
    const register = async (name, email, password, role, location) => {
        try {
            const response = await api.post('/auth/register', { name, email, password, role, location });
            const { access_token } = response.data;
            const decoded = decodeToken(access_token);
            localStorage.setItem('token', access_token);
            setUser({ token: access_token, id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
            return { success: true };
        } catch (error) {
            const msg = error.response?.data?.detail || error.response?.data?.message || 'Registration failed. Please try again.';
            return { success: false, message: msg };
        }
    };

    // ─── Logout (both flows) ────────────────────────────────────────────────
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        if (auth0Authenticated) {
            auth0Logout({ logoutParams: { returnTo: window.location.origin } });
        }
    };

    const isFullyLoading = loading || auth0Loading;

    return (
        <AuthContext.Provider value={{
            user,
            login,
            loginWithAuth0,
            signupWithAuth0,
            register,
            logout,
            loading: isFullyLoading,
        }}>
            {!isFullyLoading && children}
        </AuthContext.Provider>
    );
};
