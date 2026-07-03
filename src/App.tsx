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
import CustomCursor from "./components/CustomCursor";
import TypeScrollbar from "./components/TypeScrollbar";
import "./components/scrollbar.css";
import {SmoothScroll} from "./anim/SmoothScroll";
import {RouteTransition} from "./anim/RouteTransition";
import {Preloader} from "./anim/Preloader";

function App() {
  return (
      <BrowserRouter>
          <CustomCursor/>
          <TypeScrollbar/>
          <Preloader>
          <SmoothScroll>
              <RouteTransition>
                  {(location) => (
                      <Routes location={location}>
                          {/*admins*/}
                          <Route path="/admin/main" element={<Main/>}/>
                          <Route path="/admin/edit" element={<Edit/>}/>
                          <Route path="/admin/add" element={<Add/>}/>
                          <Route path="/admin/login" element={<Login/>}/>
                          <Route path="/admin/texts" element={<Texts/>}/>
                          {/*user*/}
                          <Route path="/" element={<MainPage/>}/>
                          <Route path="/post/:id" element={<PostPage/>}/>
                          <Route path="/search" element={<MockPage pageName={"поиска"}/>}/>
                          <Route path="/about" element={<MockPage pageName={"о проекте"}/>}/>
                      </Routes>
                  )}
              </RouteTransition>
          </SmoothScroll>
          </Preloader>
      </BrowserRouter>
  );
}

export default App;
