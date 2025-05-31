// Mock React for Zustand compatibility
export default {};
export const createElement = () => null;
export const useState = () => [null, () => {}];
export const useEffect = () => {};
export const useLayoutEffect = () => {};
export const useMemo = () => null;
export const useCallback = () => null;
export const useRef = () => ({ current: null });
export const Component = class {};
