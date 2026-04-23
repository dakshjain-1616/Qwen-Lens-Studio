import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Reasoning from './pages/Reasoning'
import Multilingual from './pages/Multilingual'
import Document from './pages/Document'
import Code from './pages/Code'
import Dual from './pages/Dual'
import Batch from './pages/Batch'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Reasoning />} />
          <Route path="reasoning" element={<Reasoning />} />
          <Route path="multilingual" element={<Multilingual />} />
          <Route path="document" element={<Document />} />
          <Route path="code" element={<Code />} />
          <Route path="dual" element={<Dual />} />
          <Route path="batch" element={<Batch />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
