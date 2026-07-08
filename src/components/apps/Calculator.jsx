import { useState } from 'react';
import styles from '../apps.module.css';

const calculate = (first, second, operator) => {
  if (operator === '+') return first + second;
  if (operator === '-') return first - second;
  if (operator === '×') return first * second;
  if (operator === '÷') return second === 0 ? 'Error' : first / second;
  return second;
};

export default function Calculator({ themeMode }) {
  const [display, setDisplay] = useState('0');
  const [firstValue, setFirstValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForSecondValue, setWaitingForSecondValue] = useState(false);

  const inputDigit = (digit) => {
    if (waitingForSecondValue) {
      setDisplay(String(digit));
      setWaitingForSecondValue(false);
      return;
    }

    setDisplay(prev => (prev === '0' ? String(digit) : prev + digit));
  };

  const inputDot = () => {
    if (waitingForSecondValue) {
      setDisplay('0.');
      setWaitingForSecondValue(false);
      return;
    }

    if (!display.includes('.')) {
      setDisplay(prev => prev + '.');
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setFirstValue(null);
    setOperator(null);
    setWaitingForSecondValue(false);
  };

  const toggleSign = () => {
    setDisplay(prev => {
      if (prev === '0') return prev;
      return prev.startsWith('-') ? prev.slice(1) : `-${prev}`;
    });
  };

  const percent = () => {
    setDisplay(prev => {
      const value = parseFloat(prev);
      return String(value / 100);
    });
  };

  const handleOperator = (nextOperator) => {
    const inputValue = parseFloat(display);

    if (operator && waitingForSecondValue) {
      setOperator(nextOperator === '=' ? null : nextOperator);
      return;
    }

    if (firstValue == null) {
      setFirstValue(inputValue);
    } else if (operator) {
      const result = calculate(firstValue, inputValue, operator);
      setDisplay(String(result));
      setFirstValue(result === 'Error' ? 0 : result);
    }

    setWaitingForSecondValue(true);
    setOperator(nextOperator === '=' ? null : nextOperator);
  };

  return (
    <div className={`${styles.calcContainer} ${themeMode === 'dark' ? styles.darkCalc : ''}`}>
      <div className={styles.calcDisplay}>{display}</div>
      <div className={styles.calcGrid}>
        <button className={`${styles.calcBtn} ${styles.top}`} onClick={clearAll}>AC</button>
        <button className={`${styles.calcBtn} ${styles.top}`} onClick={toggleSign}>+/-</button>
        <button className={`${styles.calcBtn} ${styles.top}`} onClick={percent}>%</button>
        <button className={`${styles.calcBtn} ${styles.op}`} onClick={() => handleOperator('÷')}>÷</button>

        <button className={styles.calcBtn} onClick={() => inputDigit(7)}>7</button>
        <button className={styles.calcBtn} onClick={() => inputDigit(8)}>8</button>
        <button className={styles.calcBtn} onClick={() => inputDigit(9)}>9</button>
        <button className={`${styles.calcBtn} ${styles.op}`} onClick={() => handleOperator('×')}>×</button>

        <button className={styles.calcBtn} onClick={() => inputDigit(4)}>4</button>
        <button className={styles.calcBtn} onClick={() => inputDigit(5)}>5</button>
        <button className={styles.calcBtn} onClick={() => inputDigit(6)}>6</button>
        <button className={`${styles.calcBtn} ${styles.op}`} onClick={() => handleOperator('-')}>-</button>

        <button className={styles.calcBtn} onClick={() => inputDigit(1)}>1</button>
        <button className={styles.calcBtn} onClick={() => inputDigit(2)}>2</button>
        <button className={styles.calcBtn} onClick={() => inputDigit(3)}>3</button>
        <button className={`${styles.calcBtn} ${styles.op}`} onClick={() => handleOperator('+')}>+</button>

        <button className={`${styles.calcBtn} ${styles.zero}`} onClick={() => inputDigit(0)}>0</button>
        <button className={styles.calcBtn} onClick={inputDot}>.</button>
        <button className={`${styles.calcBtn} ${styles.op}`} onClick={() => handleOperator('=')}>=</button>
      </div>
    </div>
  );
}