import { createFileRoute } from '@tanstack/react-router'
import { EnhancedPage } from '../pages/enhanced/EnhancedPage'

export const Route = createFileRoute('/enhanced')({
    component: EnhancedPage,
})
