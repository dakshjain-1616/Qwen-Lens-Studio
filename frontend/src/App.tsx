import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/Layout';
import Home from './pages/Home';
import Reasoning from './pages/Reasoning';
import Multilingual from './pages/Multilingual';
import DocumentPage from './pages/Document';
import Code from './pages/Code';
import Dual from './pages/Dual';

function AnimatedRoutes() {
  const loc = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={loc.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={loc}>
          <Route path="/" element={<Home />} />
          <Route path="/reasoning" element={<Reasoning />} />
          <Route path="/multilingual" element={<Multilingual />} />
          <Route path="/document" element={<DocumentPage />} />
          <Route path="/code" element={<Code />} />
          <Route path="/dual" element={<Dual />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Layout>
      <AnimatedRoutes />
    </Layout>
  );
}
