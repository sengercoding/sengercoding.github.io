import React from "react";
import ReactDOM from "react-dom/client";
import { useState } from "react";
import "./index.css";

export default function App() {
  const [noCount, setNoCount] = useState(0);
  const [yesPressed, setYesPressed] = useState(false);
  const yesButtonSize = noCount * 20 + 16;

  const handleNoClick = () => {
    setNoCount(noCount + 1);
  };

  const getNoButtonText = () => {
    const phrases = [
      "Nein",
      "Bist du sicher?",
      "Wirklich sicher?",
      "Gaaaanz ganz sicher??",
      "Überleg dir das besser nochmal!",
      "Letzte Chance!",
      "Ganz sicher nicht?",
      "Du könntest das bereuen!",
      "Denk noch mal darüber nach!",
      "Bist du dir absolut sicher?",
      "Das könnte ein Fehler sein!",
      "Bittteeeee!!!!!!!!!",
      "Sei nicht so kalt!!!!",
      "Vielleicht einmal deine Meinung ändern????",
      "Würdest du es nicht überdenken??",
      "Ist das deine endgültige Antwort?",
      "Du brichst mir das Herz ;(",
    ];

    return phrases[Math.min(noCount, phrases.length - 1)];
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen -mt-16">
      {yesPressed ? (
        <>
        <img src="https://media.tenor.com/gUiu1zyxfzYAAAAi/bear-kiss-bear-kisses.gif" />
        <div className="text-4xl font-bold my-4">WHOOOOOO DA FREU ICH MICH ABER!!!</div>
        </>
      ) : (
        <>
          <img className="h-[200px]" src="https://gifdb.com/images/high/cute-love-bear-roses-ou7zho5oosxnpo6k.gif" />
          <h1 className="text-4xl text-pink-500 font-bold">Will you be my Valentine?</h1>
          <div>
            <button
              className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-4`}
              style={{ fontSize: yesButtonSize }}
              onClick={() => setYesPressed(true)}
            >
              Ja
            </button>
            <button
              onClick={handleNoClick}
              className=" bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              {noCount === 0 ? "Nein" : getNoButtonText()}
            </button>
          </div>
        </>
      )}
    </div>
  );
}