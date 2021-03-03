import React, { useState } from 'react';
import cards from '../../cards';
import Card from '../Card/Card';
import './card-board.scss';
import { Howl } from 'howler';
import flipSoundUrl from '../../sounds/sound-flip-card.m4a';
import gameMusicUrl from '../../sounds/game-music-short.mp3';

function shuffleCards(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));

    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function copyCards(cards) {
  return JSON.parse(JSON.stringify(cards));
}

function addCardUniqueID(card, isOriginal) {
  card.uniqueID = (isOriginal) ? card.id + '-original' : card.id + '-copy';

  return card;
}

export default function CardBoard() {
  const [settingsDeckSize, setDeckSize] = useState(18);
  const [settingsOpponent, setOpponent] = useState('user');
  const [settingsSoundVolume, setSoundVolume] = useState(0.5);
  const [settingsMusicVolume, setMusicVolume] = useState(0.5);
  const [settingsIsSoundOn, switchSound] = useState(true);
  const [settingsIsMusicOn, switchMusic] = useState(true);
  const [settingsIsNightMode, switchNightMode] = useState(false);

  const [isMenuStatistics, showMenuStatistics] = useState(false);
  const [isMenuSettings, showMenuSettings] = useState(false);

  const [ladder, changeLadder] = useState([]);

  const [gameStatus, setGameStatus] = useState('gamestart');
  const [deck, setDeck] = useState();
  const [firstCardUID, setFirstCard] = useState(null);

  const [currentPlayer, changePlayer] = useState('playerA');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const [computerRestCardUIDs, rememberRestCards] = useState();
  const [computerKnownCardUIDs, rememberKnownCards] = useState([]);
  const [computerUnknownCardUIDs, rememberUnknownCards] = useState([]);

  function makeDeck(cards, deckSize) {
    let safeCards = copyCards(cards);
    shuffleCards(safeCards);
    let gameCards = safeCards.slice(0, deckSize / 2);
  
    let copiedCards = copyCards(gameCards);
  
    gameCards.map(card => addCardUniqueID(card, true));
    copiedCards.map(card => addCardUniqueID(card, false));
  
    let deck = gameCards.concat(copiedCards);
    shuffleCards(deck);
  
    if (settingsOpponent === 'computer') {
      rememberRestCards(deck.map(card => card.uniqueID));
      rememberUnknownCards(deck.map(card => card.uniqueID));
    }
  
    return deck;
  }

  const flipSound = new Howl({
    src: flipSoundUrl,
    autoplay: false,
    loop: false,
    volume: settingsSoundVolume,
  });

  const gameMusic = new Howl({
    src: gameMusicUrl,
    autoplay: false,
    loop: false,
    volume: settingsMusicVolume,
  });

  function onCardClick(card) {
    if (card.isFlipped) return;
    if (settingsOpponent === 'computer' && currentPlayer === 'playerB') return;

    if (settingsIsSoundOn) {
      flipSound.play();
    }

    setCardIsFlipped(card.uniqueID, true);

    if (settingsOpponent === 'computer' && !firstCardUID) {
      rememberKnownCards(prev => [...prev, card.uniqueID]);
      rememberUnknownCards(prev => prev.filter(uniqueID => uniqueID !== card.uniqueID));
    }

    if (!firstCardUID) {
      setFirstCard(card.uniqueID);
    } else {
      onTurnEnd(card.uniqueID);
    }
  }

  function setCardIsFlipped(uniqueID, isFlipped) {
		setDeck(prev => prev.map(card => {
			if (card.uniqueID !== uniqueID) {
        return card;
      }

			return {...card, isFlipped};
		}));
  }

  function onTurnEnd(secondCardUID) {
    if (settingsOpponent === 'computer') {
      rememberUnknownCards(prev => prev.filter(uniqueID => uniqueID !== secondCardUID));

      if (firstCardUID.split('-')[0] === secondCardUID.split('-')[0]) {
        rememberRestCards(prev => {
          return prev.filter(uniqueID => (uniqueID !== firstCardUID && uniqueID !== secondCardUID));
        });

        rememberKnownCards(prev => {
          return prev.filter(uniqueID => (uniqueID !== firstCardUID && uniqueID !== secondCardUID));
        });
      } else {
        rememberKnownCards(prev => {
          if (!prev.includes(secondCardUID)) {
            return [...prev, secondCardUID];
          }
        });
      }
    }

    if (firstCardUID.split('-')[0] === secondCardUID.split('-')[0]) {
      if (currentPlayer === 'playerA') {
        setScoreA(scoreA + 1);
      } else {
        setScoreB(scoreB + 1);
      }

      resetChoice();

      setTimeout(() => {
        if (settingsDeckSize / 2 - 1 === scoreA + scoreB) {
          let ladderResult;

          if ((currentPlayer === 'playerA' && scoreA + 1 > scoreB) || (currentPlayer === 'playerB' && scoreA > scoreB + 1)) {
            ladderResult = 'Player A wins';
          } else if ((currentPlayer === 'playerA' && scoreA + 1 < scoreB) || (currentPlayer === 'playerB' && scoreA < scoreB + 1)) {
            ladderResult = (settingsOpponent === 'user') ? 'Player B wins' : 'Computer wins';
          } else {
            ladderResult = 'Tie';
          }

          changeLadder([ladderResult, ...ladder].slice(0, 10));
          setGameStatus('gameend');
        }
      }, 1500);

      return;
    }

    if (currentPlayer === 'playerA') {
      changePlayer('playerB');

      if (settingsOpponent === 'computer') {
        computerMakeClick(null, secondCardUID);
      }
    } else {
      changePlayer('playerA');
    }

    setTimeout(() => {
      setCardIsFlipped(firstCardUID, false);
      setCardIsFlipped(secondCardUID, false);
    }, 800);

    resetChoice();
  }

  function resetChoice() {
    setFirstCard(null);
  }

  function toggleMenuStatistics() {
    showMenuStatistics(!isMenuStatistics);
  }

  function toggleMenuSettings() {
    showMenuSettings(!isMenuSettings);
  }

  function onDeckSizeChange(event) {
    setDeckSize(+event.target.value);
    setDeck(makeDeck(cards, +event.target.value));
  }

  function onOpponentChange(event) {
    setOpponent(event.target.value);
    setGameStatus('gamestart');
  }

  function changeSoundVolume(event) {
    setSoundVolume(event.target.value);
  }

  function changeMusicVolume(event) {
    setMusicVolume(event.target.value);
  }

  function toggleSound(event) {
    switchSound(event.target.checked);
  }

  function toggleMusic(event) {
    switchMusic(event.target.checked);
  }

  function toggleNightMode(event) {
    switchNightMode(event.target.checked);
  }

  function showWinner() {
    let result;

    if (scoreA > scoreB) {
      result = 'Player A wins';
    } else if (scoreA === scoreB) {
      result = 'Tie';
    } else if (settingsOpponent === 'user') {
      result = 'Player B wins';
    } else {
      result = 'Computer wins';
    }

    return result;
  }

  function showLadder() {
    return ladder.map((result, index) => <li key={index}>{result}</li>);
  }

  function startGame() {
    if (settingsOpponent === 'computer') {
      rememberKnownCards([]);
      rememberUnknownCards([]);
    }

    setDeck(makeDeck(cards, settingsDeckSize));
    setGameStatus('inprogress');
    changePlayer('playerA');
    setScoreA(0);
    setScoreB(0);

    if (settingsIsMusicOn) {
      gameMusic.play();

      setTimeout(() => {
        gameMusic.stop();
      }, 30000);
    }
  }

  function computerMakeClick(firstCardUID = null, secondCardUID = null) {
    setTimeout(() => {
      let tempKnownCardsUIDs = [];
      let tempUnknownCardsUIDs = [];
      let pairs;

      if (secondCardUID && !computerKnownCardUIDs.includes(secondCardUID)) {
        tempKnownCardsUIDs = [...computerKnownCardUIDs, secondCardUID];
  
        let knownIDs = tempKnownCardsUIDs.map(uniqueID => uniqueID.split('-')[0]);
        pairs = [...new Set(knownIDs.filter((value, index, self) => self.indexOf(value) !== index))];

        if (pairs.length > 0) {
          if (settingsIsSoundOn) {
            flipSound.play();
          }

          setCardIsFlipped(pairs[0] + "-original", true);
          setTimeout(() => {
            if (settingsIsSoundOn) {
              flipSound.play();
            }

            setCardIsFlipped(pairs[0] + "-copy", true);
          }, 500);

          setScoreB(scoreB + 1);

          rememberRestCards(prev => {
            return prev.filter(uniqueID => (uniqueID !== (pairs[0] + "-original") && uniqueID !== (pairs[0] + "-copy")));
          });
  
          rememberKnownCards(prev => {
            return prev.filter(uniqueID => (uniqueID !== (pairs[0] + "-original") && uniqueID !== (pairs[0] + "-copy")));
          });
        }
      }
  
      if (secondCardUID && computerUnknownCardUIDs.length > 0) {
        tempUnknownCardsUIDs = computerUnknownCardUIDs.filter(uniqueID => uniqueID !== secondCardUID);
      }

      if (tempUnknownCardsUIDs.length > 0) {
        let number;

        if (settingsIsSoundOn) {
          flipSound.play();
        }

        number = getRndInteger(0, tempUnknownCardsUIDs.length);
        setCardIsFlipped(tempUnknownCardsUIDs[number], true);

        rememberKnownCards(prev => [...prev, tempUnknownCardsUIDs[number]]);
        rememberUnknownCards(prev => prev.filter(uniqueID => uniqueID !== tempUnknownCardsUIDs[number]));

        computerMakeClick(tempUnknownCardsUIDs[number], null);
      } else {
        //!!!!!!!!!!! all known logic
        tempKnownCardsUIDs = [...computerKnownCardUIDs];
  
        let knownIDs = tempKnownCardsUIDs.map(uniqueID => uniqueID.split('-')[0]);
        pairs = [...new Set(knownIDs.filter((value, index, self) => self.indexOf(value) !== index))];

        if (pairs.length > 0) {
          if (settingsIsSoundOn) {
            flipSound.play();
          }

          setCardIsFlipped(pairs[0] + "-original", true);
          setTimeout(() => {
            if (settingsIsSoundOn) {
              flipSound.play();
            }

            setCardIsFlipped(pairs[0] + "-copy", true);
          }, 500);

          setScoreB(scoreB + 1);

          rememberRestCards(prev => {
            return prev.filter(uniqueID => (uniqueID !== (pairs[0] + "-original") && uniqueID !== (pairs[0] + "-copy")));
          });
  
          rememberKnownCards(prev => {
            return prev.filter(uniqueID => (uniqueID !== (pairs[0] + "-original") && uniqueID !== (pairs[0] + "-copy")));
          });
        }
      }

      if (firstCardUID) {
        tempKnownCardsUIDs = [...computerKnownCardUIDs, firstCardUID];

        let knownIDs = tempKnownCardsUIDs.map(uniqueID => uniqueID.split('-')[0]);
        let firstCardID = firstCardUID.split('-')[0];

        if (knownIDs.includes(firstCardID)) {
          let flipUID;

          if (firstCardUID.split('-')[1] === 'original') {
            flipUID = firstCardID + "-copy";
          } else {
            flipUID = firstCardID + "-original";
          }

          if (settingsIsSoundOn) {
            flipSound.play();
          }

          setCardIsFlipped(flipUID, true);
          setScoreB(scoreB + 1);

          rememberRestCards(prev => {
            return prev.filter(uniqueID => (uniqueID !== firstCardUID && uniqueID !== flipUID));
          });
  
          rememberKnownCards(prev => {
            return prev.filter(uniqueID => (uniqueID !== firstCardUID && uniqueID !== flipUID));
          });

          computerMakeClick();
        } else {
          //random click
        }
      }
    }, 2000);
  }

  function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
  }

  return (
    <div className={"memory-game"  + (settingsIsNightMode ? ' night-on' : '')}>
      {gameStatus === 'gameend' ? <div className="winner">{showWinner()}</div> : ''}

      {gameStatus !== 'inprogress' &&
        <div className="game-menu-wrapper">
          <div className="game-menu">
            <button className="btn start-game" onClick={startGame}>
              Start
            </button>

            <button className="btn show-statistics" onClick={toggleMenuStatistics}>
              Statistics
            </button>

            <button className="btn show-settings" onClick={toggleMenuSettings}>
              Settings
            </button>
          </div>
        </div>
      }

      {isMenuSettings &&
        <div className="modal settings">
          <div className="deck-size">
            <label htmlFor="deck-size">Select deck size:</label>

            <select id="deck-size" value={settingsDeckSize} onChange={onDeckSizeChange}>
              <option value="18">18</option>
              <option value="24">24</option>
              <option value="32">32</option>
            </select>
          </div>

          <div className="opponent">
            <label htmlFor="opponent">Select opponent:</label>

            <select id="opponent" value={settingsOpponent} onChange={onOpponentChange}>
              <option value="user">user</option>
              <option value="computer">computer</option>
            </select>
          </div>

          <div className="night-mode">
            <label htmlFor="night">Night mode:</label>
            <input
                  type="checkbox"
                  id="night"
                  name="night"
                  defaultChecked={settingsIsNightMode}
                  onChange={toggleNightMode} />
          </div>

          <div className="volume">
            <p>Audio settings:</p>

            <div>
              <input
                type="range"
                id="sound-volume"
                name="sound-volume"
                min="0"
                max="1"
                value={settingsSoundVolume}
                onChange={changeSoundVolume}
                step=".05" />

              <input
                type="checkbox"
                defaultChecked={settingsIsSoundOn}
                onChange={toggleSound} />

              <label htmlFor="sound-volume">Sound</label>
            </div>

            <div>
              <input
                type="range"
                id="music-volume"
                name="music-volume"
                min="0"
                max="1"
                value={settingsMusicVolume}
                onChange={changeMusicVolume}
                step=".05" />

              <input
                type="checkbox"
                defaultChecked={settingsIsMusicOn}
                onChange={toggleMusic} />

              <label htmlFor="music-volume">Music</label>
            </div>
          </div>

          <div className="modal-close" onClick={toggleMenuSettings}>&#10006;</div>
        </div>
      }

      {isMenuStatistics &&
        <div className="modal statistics">
          <div className="ladder">
            <ol>
              {showLadder()}
            </ol>
          </div>
          
          <div className="modal-close" onClick={toggleMenuStatistics}>&#10006;</div>
        </div>
      }

      {gameStatus === 'inprogress' &&
        <div className="score">
          <div className={"player player-1" + (currentPlayer === 'playerA' ? ' active' : '')}>Player A</div>

          <div className="points">
            <span className="points-pl1">{scoreA}</span>
            <span className="divider">:</span>
            <span className="points-pl2">{scoreB}</span>
          </div>

          <div className={"player player-2" + (currentPlayer === 'playerB' ? ' active' : '')}>
            {settingsOpponent === 'user' ? 'Player B' : 'Computer'}
          </div>
        </div>
      }
      
      <div className={"card-board deck-size-" + settingsDeckSize}>
        { gameStatus === 'inprogress' && deck.map(card => {
          return <Card card={card} key={card.uniqueID} onClick={() => onCardClick(card)} />
        }) }
      </div>
    </div>
      
  );
}
