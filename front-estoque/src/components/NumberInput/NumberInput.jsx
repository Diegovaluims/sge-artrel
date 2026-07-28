// NumberInput.jsx
// Input numérico customizado com botões − e +.
// Props: name, value, onChange, min=0, step=1, disabled=false
// onChange emula { target: { name, value: String } } para compatibilidade com handleChange existente.

import './NumberInput.css';

export default function NumberInput({ name, value, onChange, min = 0, step = 1, disabled = false }) {
  const num = value === '' ? '' : Number(value);

  const emit = (novoValor) => {
    onChange({ target: { name, value: String(novoValor) } });
  };

  const decrement = () => {
    const atual = num === '' ? 0 : num;
    emit(Math.max(min, atual - step));
  };

  const increment = () => {
    const atual = num === '' ? 0 : num;
    emit(atual + step);
  };

  const handleChange = e => {
    const raw = e.target.value;
    if (raw === '') { emit(''); return; }
    const parsed = Number(raw);
    if (!isNaN(parsed)) emit(parsed);
  };

  const handleBlur = () => {
    // Corrige valor abaixo do mínimo ao sair do campo
    if (num === '' || num < min) emit(min);
  };

  return (
    <div className="number-input-wrap">
      <button
        type="button"
        className="number-input-btn"
        onClick={decrement}
        disabled={disabled || (num !== '' && num <= min)}
        aria-label="Diminuir"
      >
        −
      </button>
      <input
        id={name}
        name={name}
        type="number"
        className="number-input-field"
        value={value}
        min={min}
        step={step}
        disabled={disabled}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-label="Quantidade"
      />
      <button
        type="button"
        className="number-input-btn"
        onClick={increment}
        disabled={disabled}
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  );
}
