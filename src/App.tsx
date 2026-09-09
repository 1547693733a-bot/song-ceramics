import { MobileRuntime } from "./mobile";
import Prototype from "./Prototype";
import {WebRuntime} from "./WebRuntime";

export default function App() {
  if (!import.meta.env.DEV || new URLSearchParams(window.location.search).get('preview') !== '1') {
    return <WebRuntime><Prototype /></WebRuntime>;
  }
  return (
    <MobileRuntime>
      <Prototype />
    </MobileRuntime>
  );
}
