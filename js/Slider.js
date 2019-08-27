import EventEmitter from './EventEmitter.js';

export default class Slider extends EventEmitter {
  constructor({ className, value, min, max, lowerBound, upperBound }) {
    super();
    //Inputs
    this._slider = $('.' + className + ' .slider');
    this._valueInput = $('.' + className + ' .value');
    this._minInput = $('.' + className + ' .min');
    this._maxInput = $('.' + className + ' .max');

    //All of these should be gotten or set using val(), min() and max()
    this._value = value;
    this._min = min;
    this._max = max;

    //Bounds, in case there is any
    if (lowerBound !== undefined) {
      this._lowerBound = lowerBound;
    }
    if (lowerBound !== undefined) {
      this._upperBound = upperBound;
    }

    //Update inputs at creation
    this._updateInputs();

    //If user enters wrong values into our input fields, we have to reset them
    //to our actual model values
    this.on('_inputError', this._updateInputs);
    //Same if the change is successful, we only changed our model's values, not
    //input's
    this.on('_inputSuccess', this._updateInputs);

    this._slider.on('input', event => {
      //Dont send event, we dont need users to use event.target.value, that would
      //return a value in range 0-100 that doesn't reflect actual state of the
      //slider. Instead they should use slider.val()
      this._emit('input');
      this.val( this._getValueFromSlider() );
    });
    this._slider.on('change', event => this._emit('change'));

    //We can change the value directly through the input field, but we have to
    //be careful with boundaries
    this._valueInput.on('change', event => {
      const newValue = +this._valueInput.val();
      if (isNaN(newValue)) {
        this._emit('_inputError');
        return;
      }
      this.val(newValue);
    });
    this._minInput.on('change', event => {
      const newValue = +this._minInput.val();
      if (isNaN(newValue)) {
        this._emit('_inputError');
        return;
      }
      this.min(newValue);
    });
    this._maxInput.on('change', event => {
      const newValue = +this._maxInput.val();
      if (isNaN(newValue)) {
        this._emit('_inputError');
        return;
      }
      this.max(newValue);
    });
  }

  _updateInputs = () => {
    this._slider.val( this._getSliderValue() );
    this._valueInput.val( this.val() );
    this._minInput.val( this.min() );
    this._maxInput.val( this.max() );

    // console.log(this.val(), this.min(), this.max());

    this._emit('input');
    this._emit('change');
  }

  //Value in range 0-100 relative to min and max
  _getSliderValue = () => {
    return ( (this._value - this._min) / (this._max - this._min) ) * 100;
  }

  //Convert slider values (0-100) to actual value
  _getValueFromSlider = () => {
    const result = (
      this._min + (this._max - this._min) * (this._slider.val() / 100)
    );
    return result;
  }

  val = newValue => {
    if (newValue !== undefined) {
      //Setter mode
      this._setVal(newValue);
    } else {
      //Getter mode
      return this._value;
    }
  }

  _setVal = newValue => {
    if (newValue < this._lowerBound || newValue > this._upperBound) {
      //Invalid argument
      this._emit('_inputError');
      return;
    }

    if (newValue <= this._min) {
      this._min = newValue;
    } else if (newValue >= this._max) {
      this._max = newValue;
    }

    this._value = newValue;
    this._emit('_inputSuccess');
  }

  min = newValue => {
    if (newValue !== undefined) {
      //Setter mode
      this._setMin(newValue);
    } else {
      //Getter mode
      return this._min;
    }
  }
  max = newValue => {
    if (newValue !== undefined) {
      //Setter mode
      this._setMax(newValue);
    } else {
      //Getter mode
      return this._max;
    }
  }

  _setMin = newValue => {
    if (newValue < this._lowerBound || newValue > this._upperBound) {
      //Invalid argument
      this._emit('_inputError');
      return;
    }

    if (newValue >= this._max) {
      this._max = newValue;
    }

    if (newValue >= this._value) {
      this._value = newValue;
    }

    this._min = newValue;

    this._emit('_inputSuccess');
  }
  _setMax = newValue => {
    if (newValue < this._lowerBound || newValue > this._upperBound) {
      //Invalid argument
      this._emit('_inputError');
      return;
    }

    if (newValue <= this._min) {
      this._min = newValue;
    }

    if (newValue <= this._value) {
      this._value = newValue;
    }

    this._max = newValue;

    this._emit('_inputSuccess');
  }
}
