import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from 'antd';

function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const history = useNavigate();

  const handleLogin = () => {
    if (password === import.meta.env.VITE_PASSWORD) {
      // 密码正确，设置登录状态并跳转到主页
      localStorage.setItem('isLoggedIn', 'true');
      history('/home');
    } else {
      setError('密码错误');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '300px', marginBottom: '16px' }}
        placeholder="Enter password"
      />
      <Button type="primary" onClick={handleLogin}>login</Button>
      {error && <p style={{ color: 'red', marginTop: '8px' }}>{error}</p>}
    </div>
  );
}

export default Login; 