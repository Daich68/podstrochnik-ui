import React, {useState, FormEvent} from "react";
import {LoginRequest} from "../../../api/Login";
import {Token} from "../../../entity/Entity";

export const Login: React.FC = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    if (localStorage.getItem('accessToken')){
        window.location.href = '/admin/main';
    }
    const handleLogin = async (event: FormEvent) => {
        event.preventDefault();
        try {
            const token: Token = await LoginRequest({ login, password });
            localStorage.clear();
            localStorage.setItem("accessToken", token.access);
            localStorage.setItem("ID", token._id);
            window.location.href = '/admin/main';
        } catch (error) {
            console.error('Login failed:', error);
        }
    };
    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <label>
                    Username:
                    <input
                        type="text"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                    />
                </label>
                <br />
                <label>
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>
                <br />
                <button type="submit">Log In</button>
            </form>
        </div>
    );
}