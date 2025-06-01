// Vanilla TypeScript Router for handling navigation between demos
export interface RouteDefinition {
    path: string;
    component: () => Promise<void>;
    title: string;
}

export class Router {
    private routes: Map<string, RouteDefinition> = new Map();
    private currentRoute: string = '';
    private onRouteChangeCallbacks: Array<(route: string) => void> = [];

    constructor() {
        // Listen for browser navigation
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
    }

    public addRoute(route: RouteDefinition): void {
        this.routes.set(route.path, route);
    }

    public navigate(path: string): void {
        if (this.currentRoute === path) return;

        window.history.pushState(null, '', `#${path}`);
        this.handleRoute();
    }

    public getCurrentRoute(): string {
        return this.currentRoute;
    }

    public onRouteChange(callback: (route: string) => void): void {
        this.onRouteChangeCallbacks.push(callback);
    }

    private async handleRoute(): Promise<void> {
        const hash = window.location.hash.substring(1) || '/ship-builder'; // Default route
        const route = this.routes.get(hash);

        if (route) {
            this.currentRoute = hash;

            // Clear the page content
            document.body.innerHTML = '';

            // Update page title
            document.title = `EQX Pre - ${route.title}`;

            // Execute the route component
            try {
                await route.component();

                // Notify callbacks
                this.onRouteChangeCallbacks.forEach(callback => callback(hash));
            } catch (error) {
                console.error(`Failed to load route ${hash}:`, error);
            }
        } else {
            console.warn(`Route not found: ${hash}`);
            this.navigate('/ship-builder'); // Fallback to default
        }
    }

    public start(): void {
        this.handleRoute();
    }

    public getRoutes(): RouteDefinition[] {
        return Array.from(this.routes.values());
    }
}

// Global router instance
export const router = new Router();
