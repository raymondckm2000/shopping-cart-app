import type { ChangeEvent } from 'react';

type QuantityInputProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

const QuantityInput = ({ value, min = 1, max, onChange, disabled }: QuantityInputProps) => {
  const clamp = (next: number) => {
    const lowerBound = min ?? 0;
    let result = Number.isNaN(next) ? lowerBound : next;

    if (typeof max === 'number') {
      result = Math.min(result, max);
    }

    if (typeof lowerBound === 'number') {
      result = Math.max(result, lowerBound);
    }

    return Math.floor(result);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = Number.parseInt(event.target.value, 10);
    onChange(clamp(parsed));
  };

  const decrease = () => {
    onChange(clamp(value - 1));
  };

  const increase = () => {
    onChange(clamp(value + 1));
  };

  return (
    <div className="quantity-input">
      <button
        type="button"
        className="quantity-input__button"
        onClick={decrease}
        disabled={disabled || value <= (min ?? 0)}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="quantity-input__field"
        inputMode="numeric"
        aria-label="Quantity"
      />
      <button
        type="button"
        className="quantity-input__button"
        onClick={increase}
        disabled={disabled || (typeof max === 'number' && value >= max)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
};

export default QuantityInput;
