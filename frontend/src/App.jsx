import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AppLayout><Main /></AppLayout>} />
                <Route path="/login" element={<AppLayout><Login /></AppLayout>} />
                <Route path="/signup" element={<AppLayout><Signup /></AppLayout>} />
                <Route path="/calendar" element={<AppLayout><CalendarPage /></AppLayout>} />
                <Route path="/community" element={<AppLayout><NoticePage /></AppLayout>} />
                <Route path="/community/free" element={<AppLayout><FreePage /></AppLayout>} />
                <Route path="/community/recipe" element={<AppLayout><RecipePage /></AppLayout>} />
                <Route path="/community/info" element={<AppLayout><InfoPage /></AppLayout>} />
                <Route path="/community/write" element={<AppLayout><PostWritePage /></AppLayout>} />
                <Route path="/community/:postId" element={<AppLayout><PostDetailPage /></AppLayout>} />
            </Routes>
        </Router>
    );
}


export default App;
