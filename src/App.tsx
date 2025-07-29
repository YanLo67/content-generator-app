import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="flex justify-center gap-8 my-8">
        <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
          <img src={viteLogo} className="h-20 w-20" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className="h-20 w-20" alt="React logo" />
        </a>
      </div>
      <h1 className="text-4xl font-bold text-center mb-6">Vite + React</h1>
      <div className="card max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
        >
          count is {count}
        </button>
        <p className="mt-4 text-red-700">
          Edit <code className="bg-gray-200 rounded px-1">src/App.tsx</code> and
          save to test HMR
        </p>
      </div>
      <p className="text-center mt-8 text-gray-600">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
