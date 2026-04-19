import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Register from "./pages/Register"
import Home from "./pages/Home"
import Activities from "./pages/Activities"
import SettingsPrefs from "./pages/SettingsPrefs"
import Community from "./pages/Community.jsx"
import CreatePost from "./pages/CreatePost"
import ViewPost from "./pages/ViewPost"
import EditPost from "./pages/EditPost"

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register/>}/>
        <Route path="/home" element={<Home/>}/>
        <Route path="/community" element={<Community/>}/>
        <Route path="/activities" element={<Activities/>}/>
        <Route path="/settingsandpreferences" element={<SettingsPrefs/>}/>
        <Route path="/posts/create" element={<CreatePost/>}/>
        <Route path="/posts/:postId" element={<ViewPost/>}/>
        <Route path="/posts/:postId/edit" element={<EditPost/>}/>
      </Routes>
    </BrowserRouter>
      
  )
}

export default App
