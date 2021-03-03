import React from 'react';
import './card.scss';

export default function Card({ card, onClick }) {
  return (
    <div className={"card" + (card.isFlipped ? " flipped" : "")} onClick={onClick}>
      <div className="card-inner">
        <div className="card-front">
          <img src={'images/' + card.name + '.png'} alt={card.name} />
        </div>

        <div className="card-back"></div>
      </div>
    </div>
  );
}