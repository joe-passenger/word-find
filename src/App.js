import logo from "./logo.svg";
import "./App.css";
import { useState, useEffect } from "react";

/**
 * This React Component is the entry point for a simple browser game in which the
 * player makes as many valid words as possible from the letters they're given.
 */
export const App = () => {
  /** Word that the player is currently typing */
  const [currentWord, setCurrentWord] = useState("");
  /** Valid letters for the current game */
  const [currentLetters, setCurrentLetters] = useState([]);
  /** Words that the player has successfully scored on */
  const [scoredWords, setScoredWords] = useState([]);
  /** Message to display to the player */
  const [feedback, setFeedback] = useState("");

  const DEFAULT_LETTERS_IN_GAME = 5;
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const VOWELS = "AEIOU";

  const HIGH_SCORE_PROPERTY = "high score";

  useEffect(() => {
    generateRandomLettersForCurrentGame(DEFAULT_LETTERS_IN_GAME);

    if (localStorage.getItem(HIGH_SCORE_PROPERTY) === null) {
      localStorage.setItem(HIGH_SCORE_PROPERTY, 0);
    }
  }, []);

  /**
   * Assigns a set of letters for the current game.
   * At least one letter will be a vowel to help reduce the number of unplayable games,
   * but the remaining letters are entirely randomized.
   */
  const generateRandomLettersForCurrentGame = (numLetters) => {
    const letters = [];
    letters.push(getRandomVowel());
    for (let i = 1; i < numLetters; i++) {
      letters.push(getRandomLetter());
    }
    setCurrentLetters(letters);
  };

  /**
   * Returns a random letter from the alphabet from A-Z.
   */
  const getRandomLetter = () => {
    const index = Math.random() * ALPHABET.length;
    return ALPHABET.charAt(index);
  };

  /**
   * Returns a random vowel from A,E,I,O,U.
   * This function does not consider the letter "Y" to be a vowel.
   */
  const getRandomVowel = () => {
    const index = Math.random() * VOWELS.length;
    return VOWELS.charAt(index);
  };

  /**
   * Given a word, call the dictionaryapi to check its validity in the English language.
   * API response json is an array that will contain multiple elements for words with more than one definition.
   * Each element contains a definition, the origin of the word, and other metadata.
   * As long as the "word" property exists, we'll consider it a valid word.
   * Returns true if the word is valid, false otherwise.
   */
  const isValidEnglishWord = async (word) => {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        // word not found
        return false;
      }

      const json = await response.json();
      const isWordValid = !!json[0].word;
      return isWordValid;
    } catch (error) {
      console.error(error.message);
    }
  };

  /**
   * Confirms that the word entered by the user contains ONLY letters that are valid for this game.
   * Returns true if word is made up of valid letters, false otherwise.
   */
  const wordContainsOnlyValidLetters = (word) => {
    const allowedLetters = [...currentLetters];
    for (let letter of word) {
      letter = letter.toUpperCase();
      if (allowedLetters.includes(letter)) {
        const index = allowedLetters.indexOf(letter);
        allowedLetters.splice(index, 1);
      } else {
        return false;
      }
    }
    return true;
  };

  /**
   * Returns true if the player already scored for this word, false otherwise.
   */
  const wasWordAlreadyUsed = (word) => {
    return scoredWords.includes(word);
  };

  /**
   * Checks all validation criteria for a word entered by the user.
   * Sets an error message if any validation criterion fails.
   * Returns true if valid, false otherwise.
   */
  const isNewWordValid = async (word) => {
    if (wasWordAlreadyUsed(word)) {
      showFeedbackShort("Word already used!");
      return false;
    } else if (!wordContainsOnlyValidLetters(word)) {
      showFeedbackShort("Word contains invalid letter(s)!");
      return false;
    } else if (!(await isValidEnglishWord(word))) {
      showFeedbackShort("Word not recognized!");
      return false;
    }
    return true;
  };

  const handleWordSubmission = async (word) => {
    if (await isNewWordValid(word)) {
      setScoredWords([...scoredWords, currentWord.toUpperCase()]);
      setCurrentWord("");
      showFeedbackShort("Nice!");
    }
  };

  /**
   * Displays a message on the screen for two seconds.
   * TODO - if function is called a second time before first message is cleared, the existing timeout should be cleared
   */
  const showFeedbackShort = (message) => {
    const feedbackDisplayLength = 2_000; // 2 seconds
    setFeedback(message);
    setTimeout(() => {
      setFeedback("");
    }, feedbackDisplayLength);
  };

  const endGame = () => {
    const highScore = localStorage.getItem(HIGH_SCORE_PROPERTY);
    const currentGameScore = scoredWords.length;
    if (currentGameScore > highScore) {
      localStorage.setItem(HIGH_SCORE_PROPERTY, scoredWords.length);
    }
    window.location.reload();
  };

  /**
   * If Enter key is pressed, submit the current word.
   */
  const submitWordOnEnter = (event) => {
    if (event.key === "Enter") {
      handleWordSubmission(currentWord);
    }
  };

  return (
    <div className="game-container">
      <button className="center" onClick={() => endGame()}>
        Give Up (New Game)
      </button>

      <div className="score-container">
        <p className="inline-block">Current Score: {scoredWords.length}</p>
        <p className="inline-block" style={{ marginLeft: "24px" }}>
          High Score: {localStorage.getItem(HIGH_SCORE_PROPERTY)}
        </p>
      </div>

      <div id="letters-container">
        <p style={{ textAlign: "center" }}>Your Letters</p>
        {currentLetters.map((currentLetter) => {
          return <span className="letter-tile">{currentLetter}</span>;
        })}
      </div>

      <div style={{ marginTop: "16px" }}>
        <input
          type="text"
          className="word-input"
          value={currentWord}
          onChange={(event) => {
            setCurrentWord(event.target.value);
          }}
          onKeyDown={submitWordOnEnter}
        />
        <button
          style={{ marginTop: "6px", marginLeft: "8px" }}
          onClick={() => handleWordSubmission(currentWord)}
        >
          Submit
        </button>
        <p className="feedback">{feedback}</p>
        <div className="word-list">
          {scoredWords.map((validWord) => {
            return <p className="word">{validWord}</p>;
          })}
        </div>
      </div>
    </div>
  );
};
