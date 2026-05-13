import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Library from './pages/Library/Library';
import YouTube from './pages/YouTube/YouTube';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/youtube" element={<YouTube />} />
      </Routes>
    </Layout>
  );
}
