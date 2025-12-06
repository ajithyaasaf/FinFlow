import { redirect } from 'next/navigation'

export default function Home() {
    // Redirect to login - middleware will handle routing based on auth state
    redirect('/login')
}
