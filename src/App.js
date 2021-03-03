import React from 'react';
import CardBoard from './components/CardBoard/CardBoard';
import logo from './images/logo_rs_school_js.svg';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';

function App() {
  const fullScreenHandle = useFullScreenHandle();

  return (
    <div className="container">
      <header>
        <h1>Memory Game</h1>

        <button className="btn enable-fullscreen" onClick={fullScreenHandle.enter}>
          Fullscreen
        </button>
      </header>

      <FullScreen handle={fullScreenHandle}>
        <CardBoard />
      </FullScreen>

      <footer>
        <div className="developer">
          <span className="copyright">©2021</span>
          <a
            href="https://github.com/DieL89"
            target="_blank"
            rel="noreferrer"
          >
            Developer's GitHub
          </a>
        </div>

        <a
          className="rsschool-logo"
          href="https://rs.school/js/"
          target="_blank"
          rel="noreferrer"
        >
          <img src={logo} alt="RS School Logo" />
        </a>
      </footer>
    </div>
  );
}

export default App;
