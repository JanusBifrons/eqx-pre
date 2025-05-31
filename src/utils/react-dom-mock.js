// Mock React DOM for Zustand compatibility
export default {};
export const render = () => {};
export const createRoot = () => ({ render: () => {}, unmount: () => {} });
