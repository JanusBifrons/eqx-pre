import { createFileRoute } from '@tanstack/react-router'
import { ShipBuilderPage } from '../pages/ship-builder/ShipBuilderPage'

export const Route = createFileRoute('/ship-builder')({
    component: ShipBuilderPage,
})
