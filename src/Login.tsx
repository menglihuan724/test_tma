import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined, LoginOutlined } from '@ant-design/icons';
import styled, { keyframes } from 'styled-components';
import env from './config/env';
import { colors } from './config/theme';

const { Title, Text } = Typography;

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, ${colors.bgPrimary} 0%, ${colors.bgSecondary} 50%, #1a2744 100%);
  background-size: 200% 200%;
  animation: ${gradientAnimation} 15s ease infinite;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at center,
      rgba(245, 158, 11, 0.03) 0%,
      transparent 50%
    );
    pointer-events: none;
  }
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  background: rgba(30, 41, 59, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid ${colors.borderLight} !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  .ant-card-body {
    padding: 40px 32px !important;
  }

  @media (max-width: 480px) {
    max-width: 100%;
    
    .ant-card-body {
      padding: 32px 24px !important;
    }
  }
`;

const LogoWrapper = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const Logo = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
  margin-bottom: 16px;
`;

const StyledTitle = styled(Title)`
  color: ${colors.textPrimary} !important;
  margin-bottom: 8px !important;
  text-align: center;
`;

const Subtitle = styled(Text)`
  color: ${colors.textSecondary} !important;
  display: block;
  text-align: center;
  margin-bottom: 32px;
`;

const StyledInput = styled(Input.Password)`
  height: 48px;
  background: ${colors.bgTertiary} !important;
  border: 1px solid ${colors.borderLight} !important;
  border-radius: 8px !important;
  font-size: 16px;
  
  .ant-input {
    background: transparent !important;
    color: ${colors.textPrimary} !important;
    
    &::placeholder {
      color: ${colors.textDisabled} !important;
    }
  }

  .ant-input-prefix {
    color: ${colors.textSecondary} !important;
    margin-right: 12px;
  }

  &:hover, &:focus {
    border-color: ${colors.primary} !important;
  }

  &.ant-input-affix-wrapper-focused {
    border-color: ${colors.primary} !important;
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2) !important;
  }
`;

const LoginButton = styled(Button)`
  width: 100%;
  height: 48px;
  margin-top: 24px;
  border-radius: 8px !important;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3) !important;
  transition: all 0.3s ease !important;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4) !important;
  }

  &:active {
    transform: translateY(0);
  }
`;

const ErrorText = styled(Text)`
  color: ${colors.error} !important;
  display: block;
  text-align: center;
  margin-top: 16px;
`;

const Footer = styled.div`
  margin-top: 24px;
  text-align: center;
`;

const FooterText = styled(Text)`
  color: ${colors.textDisabled} !important;
  font-size: 12px;
`;

function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/app/home');
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!password) {
      setError('Please enter password');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate async login
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === env.VITE_PASSWORD) {
      localStorage.setItem('isLoggedIn', 'true');
      message.success('Login successful');
      navigate('/app/home');
    } else {
      setError('Invalid password');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LogoWrapper>
          <Logo src="/assets/logo.jpeg" alt="Faku Logo" />
          <StyledTitle level={2}>Welcome Back</StyledTitle>
          <Subtitle>Sign in to access your Faku dashboard</Subtitle>
        </LogoWrapper>

        <StyledInput
          prefix={<LockOutlined />}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          onKeyPress={handleKeyPress}
          autoFocus
        />

        <LoginButton
          type="primary"
          icon={<LoginOutlined />}
          onClick={handleLogin}
          loading={loading}
        >
          Sign In
        </LoginButton>

        {error && <ErrorText>{error}</ErrorText>}

        <Footer>
          <FooterText>Faku Web3 Dashboard</FooterText>
        </Footer>
      </LoginCard>
    </LoginContainer>
  );
}

export default Login;
