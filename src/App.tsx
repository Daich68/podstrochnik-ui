import React from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import './App.css';
import {Login} from "./pages/admin/login/Login";
import {Main} from "./pages/admin/main/Main";
import {Edit} from "./pages/admin/edit_add/Edit";
import {Add} from "./pages/admin/edit_add/Add";
import {Texts} from "./pages/admin/texts/Texts";
import {MockPage} from "./utils/MockPage";
import {MainPage} from "./pages/main/Main";
import {PostPage} from "./pages/post/PostPage";

function App() {
  return (
      // eslint-disable-next-line react/jsx-no-undef
      <BrowserRouter>
          {/* eslint-disable-next-line react/jsx-no-undef */}
        <Routes>
            {/*admins*/}
            <Route path="/admin/main" element={<Main/>}/>
            <Route path="/admin/edit" element={<Edit/>}/>
            <Route path="/admin/add" element={<Add/>}/>
            <Route path="/admin/login" element={<Login/>}/>
            <Route path="/admin/texts" element={<Texts/>}/>
            {/*user*/}
            <Route path="/" element={<MainPage/>}/>
            <Route path="/post/:id" element={<PostPage/>}/>
            <Route path="/search" element={<MockPage pageName={"poiska"}/>}/>
            <Route path="/about" element={<MockPage pageName={"o proekte"}/>}/>
        </Routes>
      </BrowserRouter>
  );
}

export default App;
