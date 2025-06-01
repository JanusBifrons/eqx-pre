import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { MuiProvider } from './components/MuiProvider';
import './index.css';

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

function App() {
    return (
        <MuiProvider>
            <RouterProvider router={router} />
        </MuiProvider>
    );
}

export default App;