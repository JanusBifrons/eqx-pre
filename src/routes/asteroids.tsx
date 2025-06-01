import { createFileRoute } from '@tanstack/react-router'
import { AsteroidsPage } from '../pages/asteroids/AsteroidsPage'

export const Route = createFileRoute('/asteroids')({
    component: AsteroidsPage,
})
