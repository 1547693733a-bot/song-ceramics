import {useLayoutEffect, useMemo, useRef, useState, type PropsWithChildren} from 'react';
import {MobileDeviceProvider} from './mobile/Device';
import {KeyboardProvider} from './mobile/Keyboard';
import {ScreenPortalProvider} from './mobile/PhoneFrame';
import './web.css';

// Reuse the app's gestures and sheet portal, without simulated device chrome.
export function WebRuntime({children}: PropsWithChildren) {
  const screenRef = useRef<HTMLDivElement | null>(null);
  const portal = useMemo(() => ({screenRef}), []);
  const [viewport, setViewport] = useState({width: 393, height: 852});
  useLayoutEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    const update = () => setViewport({width: screen.clientWidth, height: screen.clientHeight});
    update();
    const observer = new ResizeObserver(update);
    observer.observe(screen);
    return () => observer.disconnect();
  }, []);
  return <MobileDeviceProvider viewport={viewport}>
    <ScreenPortalProvider value={portal}>
      <div className="web-stage">
        <div className="web-screen" data-phone-screen data-testid="web-screen" ref={screenRef}
          onDragStartCapture={event => event.preventDefault()}>
          <KeyboardProvider><div className="mobile-app-viewport">{children}</div></KeyboardProvider>
        </div>
      </div>
    </ScreenPortalProvider>
  </MobileDeviceProvider>;
}
