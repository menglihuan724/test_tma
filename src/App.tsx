import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

declare global {
  interface Window {
    Telegram: any;
    eruda: any;
  }
}

const BASE_URL = "https://faku.cflpool.io";

function App() {
  const [fakuStatus, setFakuStatus] = useState(0);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Init TWA
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.setHeaderColor("secondary_bg_color");

    // Theme change handler
    window.Telegram.WebApp.onEvent("themeChanged", () => {
      document.documentElement.className = window.Telegram.WebApp.colorScheme;
      document.body.setAttribute(
        "style",
        "--bg-color:" + window.Telegram.WebApp.backgroundColor
      );
    });

    // Set up main button
    window.Telegram.WebApp.MainButton.setParams({
      text: "Faku",
    });
    window.Telegram.WebApp.MainButton.show();

    // Status polling
    const interval = setInterval(async () => {
      if (fakuStatus === 1) {
        const status = await getFakuStatus();
        setFakuStatus(status);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fakuStatus]);

  const testNet = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/startBot`);
      alert(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fakuOne = async () => {
    const num = (document.getElementById('num') as HTMLInputElement).value;
    const isLp = (document.getElementById('isLp') as HTMLSelectElement).value;
    const level = (document.getElementById('level') as HTMLSelectElement).value;

    try {
      const statusRes = await axios.get(`${BASE_URL}/getFakuStatus`);
      if (statusRes.data === 0 && fakuStatus === 0) {
        const response = await axios.post(
          `${BASE_URL}/fakuOnce/${num}/${isLp}/${level}`
        );
        alert(response.data === 0 ? "success" : "failed");
        setFakuStatus(response.data === 0 ? 1 : 0);
      } else {
        alert("faku is running");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getFakuStatus = async () => {
    const res = await axios.get(`${BASE_URL}/getFakuStatus`);
    return res.data;
  };

  const getByOld = async () => {
    const lpAddress = (document.getElementById('lpAddress') as HTMLSelectElement).value;
    try {
      const statusRes = await axios.get(`${BASE_URL}/getFakuStatus`);
      if (statusRes.data === 0 && fakuStatus === 0) {
        const response = await axios.post(
          `${BASE_URL}/fakuGetOld?lp=${lpAddress}`
        );
        alert(response.data === 0 ? "success" : "failed");
        setFakuStatus(response.data === 0 ? 1 : 0);
      } else {
        alert("faku is running");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <main>
        <div style={{ textAlign: 'center' }}>
          <a href="https://www.google.com/">
            <img width="48" src="./assets/logo.jpeg" alt="logo of faku" />
          </a>
        </div>

        <h1>Functions</h1>
        <div className="top-space">
          <button onClick={testNet}>Test NetWork</button>
        </div>
        <div className="top-space">
          status: <span>{fakuStatus === 0 ? "idle" : "running"}</span>
        </div>
        <div className="top-space">
          <button onClick={fakuOne} id="faku">Faku Once</button>
          <input id="num" type="number" name="number" min="1" max="4" />
          <select name="isLp" id="isLp">
            <option value="true">从FAKU</option>
            <option value="false">从LP</option>
          </select>
          <select name="level" id="level">
            <option value="0">low</option>
            <option value="1">med</option>
            <option value="2">high</option>
            <option value="3">extra</option>
          </select>
        </div>
        <div className="top-space">
          <button onClick={getByOld}>GetOld</button>
          <select name="lpAddress" id="lpAddress">
            <option value="0x943b9b4718826ea7023f79c66e0d40bebbcde22f">LP Old</option>
            <option value="0x41279398385c7543eaC6d3471650D5a404c904A9">LP New</option>
          </select>
        </div>
      </main>
      <div className="viewport" />
      <div className="viewport-params viewport-params-size">
        {`width: ${viewportSize.width} x height: ${viewportSize.height}`}
      </div>
      <div className="viewport-params viewport-params-expand">
        {`Is Expanded: ${isExpanded}`}
      </div>
    </>
  );
}

export default App; 