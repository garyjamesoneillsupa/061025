import { useState, useEffect } from "react";
import { X, Plus, Download } from "lucide-react";

export default function IOSInstallBanner() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [userEngaged, setUserEngaged] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|EdgiOS|FxiOS/.test(navigator.userAgent);
    const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    const hasBeenDismissed = localStorage.getItem('ios-install-dismissed');
    const lastDismissed = localStorage.getItem('ios-install-last-dismissed');
    
    setIsIOS(iOS);
    setIsStandalone(standalone);
    
    // Only show for iOS Safari users who haven't installed and haven't recently dismissed
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const canShow = iOS && isSafari && !standalone && (!hasBeenDismissed || (lastDismissed && parseInt(lastDismissed) < weekAgo));
    
    if (canShow) {
      // Track user engagement before showing prompt
      const trackEngagement = () => {
        setUserEngaged(true);
        localStorage.setItem('user-engaged', 'true');
      };
      
      // Wait for user engagement (scroll, click, or 30 seconds)
      const engagementTimer = setTimeout(trackEngagement, 30000);
      
      window.addEventListener('scroll', trackEngagement, { once: true });
      window.addEventListener('click', trackEngagement, { once: true });
      window.addEventListener('touchstart', trackEngagement, { once: true });
      
      return () => {
        clearTimeout(engagementTimer);
        window.removeEventListener('scroll', trackEngagement);
        window.removeEventListener('click', trackEngagement);
        window.removeEventListener('touchstart', trackEngagement);
      };
    }
  }, []);

  useEffect(() => {
    if (userEngaged && isIOS && !isStandalone) {
      // Show prompt after user engagement
      setTimeout(() => {
        setShowPrompt(true);
      }, 1000);
    }
  }, [userEngaged, isIOS, isStandalone]);

  const handleInstall = () => {
    setShowPrompt(false);
    
    // Create iOS native-style installation guide
    const installGuide = document.createElement('div');
    installGuide.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: 10000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 0;
      animation: fadeIn 0.3s ease;
    `;
    
    installGuide.innerHTML = `
      <style>
        @keyframes fadeIn { 
          from { opacity: 0; } 
          to { opacity: 1; } 
        }
        @keyframes slideUp { 
          from { transform: translateY(100%); } 
          to { transform: translateY(0); } 
        }
      </style>
      
      <div style="
        background: #f2f2f7;
        width: 100%;
        max-width: 400px;
        border-radius: 13px 13px 0 0;
        box-shadow: 0 -8px 30px rgba(0,0,0,0.15);
        animation: slideUp 0.4s ease-out;
        overflow: hidden;
      ">
        <!-- App Info Header -->
        <div style="
          background: white;
          padding: 20px;
          display: flex;
          align-items: center;
          border-bottom: 0.5px solid #c6c6c8;
        ">
          <div style="
            width: 64px;
            height: 64px;
            background: white;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid #e5e5e7;
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
            font-size: 24px;
            font-weight: 800;
            color: #000;
          ">
            OVM
          </div>
          <div style="flex: 1;">
            <div style="
              font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
              font-size: 20px;
              font-weight: 600;
              color: #000;
              margin-bottom: 4px;
              line-height: 1.2;
            ">OVM</div>
            <div style="
              font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
              font-size: 15px;
              color: #8e8e93;
              line-height: 1.3;
            ">Vehicle Movement Software</div>
            <div style="
              font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
              font-size: 13px;
              color: #8e8e93;
              margin-top: 2px;
            ">Works offline • Fast & secure</div>
          </div>
        </div>
        
        <!-- Installation Steps -->
        <div style="background: white; padding: 0;">
          <div style="
            padding: 20px 20px 16px 20px;
            border-bottom: 0.5px solid #c6c6c8;
          ">
            <div style="
              font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
              font-size: 17px;
              font-weight: 600;
              color: #000;
              margin-bottom: 12px;
            ">Install on your iPhone</div>
            
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="
                width: 28px;
                height: 28px;
                background: #007aff;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                flex-shrink: 0;
              ">
                <span style="color: white; font-size: 16px; font-weight: 600;">⬆</span>
              </div>
              <div style="
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
                font-size: 16px;
                color: #000;
                line-height: 1.4;
              ">Tap the <strong>Share</strong> button</div>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="
                width: 28px;
                height: 28px;
                background: #007aff;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                flex-shrink: 0;
              ">
                <span style="color: white; font-size: 16px; font-weight: 600;">+</span>
              </div>
              <div style="
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
                font-size: 16px;
                color: #000;
                line-height: 1.4;
              ">Select <strong>"Add to Home Screen"</strong></div>
            </div>
            
            <div style="display: flex; align-items: center;">
              <div style="
                width: 28px;
                height: 28px;
                background: #34c759;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                flex-shrink: 0;
              ">
                <span style="color: white; font-size: 14px; font-weight: 600;">✓</span>
              </div>
              <div style="
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
                font-size: 16px;
                color: #000;
                line-height: 1.4;
              ">Tap <strong>"Add"</strong> to install</div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div style="padding: 0;">
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
              width: 100%;
              background: none;
              border: none;
              padding: 18px;
              font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
              font-size: 20px;
              font-weight: 600;
              color: #007aff;
              cursor: pointer;
              border-bottom: 0.5px solid #c6c6c8;
            ">Continue</button>
            
            <button onclick="
              this.parentElement.parentElement.parentElement.remove();
              localStorage.setItem('ios-install-dismissed', 'true');
              localStorage.setItem('ios-install-last-dismissed', Date.now().toString());
            " style="
              width: 100%;
              background: none;
              border: none;
              padding: 18px;
              font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
              font-size: 20px;
              color: #000;
              cursor: pointer;
            ">Not Now</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(installGuide);
  };
  
  const showShareInstructions = () => {
    // Fallback instructions with better animation
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.9);
      backdrop-filter: blur(10px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.3s ease;
    `;
    
    overlay.innerHTML = `
      <style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      </style>
      <div style="
        background: white;
        border-radius: 16px;
        padding: 32px 24px;
        max-width: 340px;
        text-align: center;
        box-shadow: 0 25px 50px rgba(0,0,0,0.4);
        animation: slideUp 0.4s ease;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">📱</div>
        <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #333;">Add OVM to Home Screen</h3>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #666; line-height: 1.5;">
          1. Tap the Share button <strong>⬆️</strong> at the bottom<br>
          2. Scroll and tap <strong>"Add to Home Screen"</strong><br>
          3. Tap <strong>"Add"</strong> to install
        </p>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #00ABE7;
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,171,231,0.3);
        ">Got it!</button>
      </div>
    `;
    
    document.body.appendChild(overlay);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-dismissed', 'true');
    localStorage.setItem('ios-install-last-dismissed', Date.now().toString());
  };

  if (!showPrompt || !isIOS || isStandalone) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '0.5px solid rgba(0, 0, 0, 0.1)',
        padding: '12px 16px',
        animation: 'slideUp 0.4s ease-out'
      }}
    >
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}
      </style>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: 'white',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e5e7',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: '18px',
          fontWeight: '700',
          color: '#000'
        }}>
          OVM
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: '16px',
            fontWeight: '600',
            color: '#000',
            lineHeight: '1.2',
            marginBottom: '2px'
          }}>
            Install OVM
          </div>
          <div style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: '13px',
            color: '#8e8e93',
            lineHeight: '1.3'
          }}>
            Add to Home Screen for quick access
          </div>
        </div>
        
        <button
          onClick={handleInstall}
          style={{
            background: '#007aff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,122,255,0.3)'
          }}
        >
          Install
        </button>
        
        <button
          onClick={dismissPrompt}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px',
            color: '#8e8e93',
            fontSize: '20px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}