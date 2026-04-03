import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { TechnicianProfilePage } from './pages/TechnicianProfilePage';
import { PostsPage } from './pages/PostsPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { EditPostPage } from './pages/EditPostPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyProjectsPage } from './pages/MyProjectsPage';
import { NearbyMapPage } from './pages/NearbyMapPage';
import { NotFoundPage } from './pages/NotFoundPage';

function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'search', Component: SearchPage },
      { path: 'technician/:id', Component: TechnicianProfilePage },
      { path: 'posts', Component: PostsPage },
      { path: 'posts/create', Component: CreatePostPage },
      { path: 'posts/:id', Component: PostDetailPage },
      { path: 'posts/:id/edit', Component: EditPostPage },

      // 🔐 PROTECTED ROUTES GROUP
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', Component: DashboardPage },
          { path: 'profile', Component: ProfilePage },
          { path: 'my-projects', Component: MyProjectsPage },
          { path: 'nearby', Component: NearbyMapPage },
        ],
      },

      { path: '*', Component: NotFoundPage },
    ],
  },

  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/register',
    Component: RegisterPage,
  },
]);