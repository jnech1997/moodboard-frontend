import { BrowserRouter, Routes, Route } from "react-router-dom";
import BoardList from "./components/BoardList";
import BoardView from "./components/BoardView";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-900 text-gray-100 px-8 py-10 space-y-8 overscroll-contain">
        <Routes>
          <Route path="/" element={<BoardList />} />
          <Route path="/boards/:id" element={<BoardView />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
