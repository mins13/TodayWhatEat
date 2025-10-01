import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';

import Main from './pages/Main';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CalendarPage from './pages/Calendar';
import NoticePage from "./pages/Community/NoticePage";
import FreePage from "./pages/Community/FreePage.jsx";
import RecipePage from "./pages/Community/RecipePage";
import InfoPage from "./pages/Community/InfoPage";
import PostWritePage from "./pages/Community/PostWritePage";
import PostDetailPage from "./pages/Community/PostDetailPage";
import AppLayout from './components/AppLayout';
import RecipeListPage from './pages/Recipe/RecipeListPage.jsx';
import RecipeRecommendPage from "./pages/Recipe/RecipeRecommendPage.jsx";
import RecipeDetailPage from "./pages/Recipe/RecipeDetailPage.jsx";
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminPosts from "./pages/Admin/AdminPosts";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) setIsLoggedIn(true);
    }, []);

    const withLayout = (Component) => (
        <AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
            <Component setIsLoggedIn={setIsLoggedIn} />
        </AppLayout>
    );

    return (
        <Router>
            <Routes>
                <Route path="/" element={<AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}><Main /></AppLayout>} />
                <Route path="/login" element={
                    <AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
                        <Login setIsLoggedIn={setIsLoggedIn} />
                    </AppLayout>
                } />
                <Route path="/signup" element={<AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}><Signup /></AppLayout>} />
                <Route path="/calendar" element={<ProtectedRoute><AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}><CalendarPage /></AppLayout></ProtectedRoute>} />
                <Route path="/community" element={<AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}><NoticePage /></AppLayout>} />
                <Route path="/community/free" element={<AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}><FreePage /></AppLayout>} />
                <Route path="/community/recipe" element={<AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}><RecipePage /></AppLayout>} />
                <Route path="/community/info" element={<AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}><InfoPage /></AppLayout>} />
                <Route path="/community/write" element={<AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}><PostWritePage /></AppLayout>} />
                <Route
                    path="/community/:board/:postId"
                    element={
                        <AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}>
                            <PostDetailPage />
                        </AppLayout>
                    }
                />
                <Route path="/recipe" element={<AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}><RecipeListPage /></AppLayout>} />
                <Route path="/recipe/recommend" element={<AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}><RecipeRecommendPage /></AppLayout>} />
                <Route path="/recipe/:recipeId" element={<AppLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}><RecipeDetailPage /></AppLayout>} />
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="posts" element={<AdminPosts />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
